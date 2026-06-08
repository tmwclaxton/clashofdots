import { router } from '@inertiajs/vue3';
import { defineStore } from 'pinia';
import { createGameEcho } from '@/lib/echo';
import { orders, pause as pauseRoute, recruit as recruitRoute } from '@/routes/games';
import { useToastStore } from '@/stores/toastStore';

type Point = [number, number];

type EconomySlot = {
    credits: number;
    incomePerTick: number;
};

type TroopState = {
    position: Point;
    color: number[];
    id: number;
    ownerSlot: number;
    path: Point[];
    health: number;
    morale?: number;
    warmupMultiplier?: number;
    combatMultiplier?: number;
};

type CityState = {
    ownerColor: number[] | null;
    position: Point;
    id: number;
    path: Point[];
    ownerSlot: number | null;
    markerType?: string | null;
};

type GameState = {
    vision: number[][];
    border: number[][];
    troops: TroopState[];
    cities: CityState[];
};

type DraftPath = {
    entityId: number;
    points: Point[];
    kind: 'troop' | 'city';
};

function initialWorld() {
    return { width: 1280, height: 700, cellSize: 20 };
}

/** Canvas uses `scale(zoom)` then `translate(camX, camY)` so `sx = zoom * (wx + camX)`. */
export const GAME_VIEW_ZOOM_MIN = 0.04;

export const GAME_VIEW_ZOOM_MAX = 10;

function coerceTerrainCellsFromSnapshot(
    raw: unknown,
    terrain: number[][] | null,
): string[][] | null {
    if (!terrain || terrain.length === 0 || !terrain[0]?.length) {
        return null;
    }

    if (!Array.isArray(raw) || raw.length !== terrain.length) {
        return null;
    }

    const colCount = terrain[0].length;
    const rows: string[][] = [];

    for (let gx = 0; gx < raw.length; gx++) {
        const row = raw[gx];

        if (!Array.isArray(row) || row.length !== colCount) {
            return null;
        }

        rows.push(row.map((c) => (typeof c === 'string' ? c : 'plains')));
    }

    return rows;
}

function parseEconomy(raw: unknown): EconomySlot[] | null {
    if (!Array.isArray(raw) || raw.length === 0) {
        return null;
    }

    const out: EconomySlot[] = [];

    for (const row of raw) {
        if (!row || typeof row !== 'object') {
            continue;
        }

        const o = row as Record<string, unknown>;
        out.push({
            credits: Number(o.credits ?? 0),
            incomePerTick: Number(o.incomePerTick ?? 0),
        });
    }

    return out.length > 0 ? out : null;
}

export const useGameStore = defineStore('game', {
    state: () => ({
        connected: false,
        initialized: false,
        gameUuid: '' as string,
        slot: 0,
        color: '#c0392b',
        terrain: null as number[][] | null,
        forest: null as number[][] | null,
        terrainCells: null as string[][] | null,
        cityPositions: [] as Point[],
        world: initialWorld(),
        latestState: null as GameState | null,
        economy: null as EconomySlot[] | null,
        worldTick: 0,
        draftPaths: [] as DraftPath[],
        activeDraft: null as DraftPath | null,
        camX: 0,
        camY: 0,
        zoom: 1,
        paused: false,
        winnerUserId: null as number | null,
        winnerSlot: null as number | null,
        winnerName: null as string | null,
        matchEnded: false,
        echo: null as ReturnType<typeof createGameEcho> | null,
        /** Per-commander pause flags from the server (matches Redis `pauseRequests`). */
        serverPauseRequests: [] as boolean[],
        /** When true, the simulation tick intentionally does not advance the world. */
        serverAllPlayersPaused: false,
    }),
    actions: {
        reset() {
            this.connected = false;
            this.initialized = false;
            this.gameUuid = '';
            this.slot = 0;
            this.color = '#c0392b';
            this.terrain = null;
            this.forest = null;
            this.terrainCells = null;
            this.cityPositions = [];
            this.world = initialWorld();
            this.latestState = null;
            this.economy = null;
            this.worldTick = 0;
            this.draftPaths = [];
            this.activeDraft = null;
            this.camX = 0;
            this.camY = 0;
            this.zoom = 1;
            this.paused = false;
            this.winnerUserId = null;
            this.winnerSlot = null;
            this.winnerName = null;
            this.matchEnded = false;
            this.serverPauseRequests = [];
            this.serverAllPlayersPaused = false;
        },
        connect(gameUuid: string, broadcastConnection: string, slot: number, color: string) {
            this.disconnect();
            this.gameUuid = gameUuid;
            this.slot = slot;
            this.color = color;
            this.echo = createGameEcho();

            this.echo
                .private(`game.${gameUuid}.${broadcastConnection}`)
                .subscribed(() => {
                    this.connected = true;
                })
                .listen('.GameInitialized', (payload: Record<string, unknown>) => {
                    this.applySnapshotPayload(payload);
                })
                .listen('.GameStateUpdated', (payload: Record<string, unknown>) => {
                    this.latestState = payload.state as GameState;
                    const eco = parseEconomy(payload.economy);

                    if (eco) {
                        this.economy = eco;
                    }

                    if (payload.worldTick !== undefined && payload.worldTick !== null) {
                        this.worldTick = Number(payload.worldTick);
                    }

                    if (Array.isArray(payload.pauseRequests)) {
                        this.serverPauseRequests = (payload.pauseRequests as unknown[]).map((p) => Boolean(p));
                    }

                    if (typeof payload.allPlayersPaused === 'boolean') {
                        this.serverAllPlayersPaused = payload.allPlayersPaused;
                    }
                })
                .listen('.GameEnded', (payload: Record<string, unknown>) => {
                    this.matchEnded = true;
                    this.winnerUserId =
                        payload.winnerUserId === undefined || payload.winnerUserId === null
                            ? null
                            : Number(payload.winnerUserId);
                    this.winnerSlot =
                        payload.winnerSlot === undefined || payload.winnerSlot === null
                            ? null
                            : Number(payload.winnerSlot);
                    this.winnerName =
                        typeof payload.winnerName === 'string' ? payload.winnerName : null;
                });
        },
        applySnapshotPayload(payload: Record<string, unknown>) {
            this.terrain = payload.terrain as number[][];
            this.forest = payload.forest as number[][];
            this.terrainCells = coerceTerrainCellsFromSnapshot(payload.terrainCells, this.terrain);
            this.cityPositions = payload.cityPositions as Point[];

            if (payload.world && typeof payload.world === 'object') {
                this.world = payload.world as typeof this.world;
            }

            if (payload.slot !== undefined && payload.slot !== null) {
                this.slot = Number(payload.slot);
            }

            if (typeof payload.color === 'string') {
                this.color = payload.color;
            }

            if (payload.state && typeof payload.state === 'object') {
                this.latestState = payload.state as GameState;
            }

            const eco = parseEconomy(payload.economy);

            if (eco) {
                this.economy = eco;
            }

            if (payload.worldTick !== undefined && payload.worldTick !== null) {
                this.worldTick = Number(payload.worldTick);
            }

            if (Array.isArray(payload.pauseRequests)) {
                this.serverPauseRequests = (payload.pauseRequests as unknown[]).map((p) => Boolean(p));
            }

            if (typeof payload.allPlayersPaused === 'boolean') {
                this.serverAllPlayersPaused = payload.allPlayersPaused;
            }

            this.initialized = true;
        },
        async fetchSnapshotIfNeeded(url: string) {
            if (this.initialized) {
                return;
            }

            await this.pullSnapshot(url);
        },
        async pullSnapshot(url: string, options?: { treat404AsEnded?: boolean }) {
            try {
                const raw = document.cookie
                    .split('; ')
                    .find((row) => row.startsWith('XSRF-TOKEN='))
                    ?.split('=')[1];
                const res = await fetch(url, {
                    credentials: 'same-origin',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        ...(raw
                            ? {
                                  'X-XSRF-TOKEN': decodeURIComponent(raw),
                              }
                            : {}),
                    },
                });

                if (!res.ok) {
                    if (options?.treat404AsEnded && res.status === 404) {
                        this.matchEnded = true;
                    }

                    return;
                }

                const data = (await res.json()) as Record<string, unknown>;
                this.applySnapshotPayload(data);
            } catch {
                // Echo may still deliver GameInitialized
            }
        },
        disconnect() {
            this.echo?.disconnect();
            this.echo = null;
            this.reset();
        },
        beginPath(entityId: number, kind: 'troop' | 'city', start: Point) {
            this.activeDraft = {
                entityId,
                kind,
                points: [start],
            };
        },
        extendPath(point: Point) {
            if (!this.activeDraft) {
                return;
            }

            const last = this.activeDraft.points.at(-1);

            if (!last) {
                return;
            }

            const dx = point[0] - last[0];
            const dy = point[1] - last[1];

            /** ~5 CSS px in world units; a fixed world threshold is sub-pixel when zoomed out. */
            const minSeg = Math.max(2, 5 / this.zoom);

            if (Math.hypot(dx, dy) > minSeg) {
                this.activeDraft.points.push(point);
            }
        },
        finishPath() {
            if (!this.activeDraft) {
                return;
            }

            if (this.activeDraft.points.length > 1) {
                this.draftPaths = this.draftPaths.filter(
                    (p) =>
                        !(
                            p.entityId === this.activeDraft!.entityId &&
                            p.kind === this.activeDraft!.kind
                        ),
                );
                this.draftPaths.push({ ...this.activeDraft });
            }

            this.activeDraft = null;
        },
        clearDrafts() {
            this.draftPaths = [];
            this.activeDraft = null;
        },
        /**
         * Fit the whole battlefield in the view. Matches {@link GameCanvas} transform:
         * screen = zoom * (world + cam).
         */
        fitCameraToView(cssWidth: number, cssHeight: number, margin = 0.94): void {
            const ww = this.world.width;
            const wh = this.world.height;

            if (!(ww > 0 && wh > 0 && cssWidth > 0 && cssHeight > 0)) {
                return;
            }

            const z = Math.min((cssWidth * margin) / ww, (cssHeight * margin) / wh);
            this.zoom = Math.min(GAME_VIEW_ZOOM_MAX, Math.max(GAME_VIEW_ZOOM_MIN, z));
            this.camX = cssWidth / (2 * this.zoom) - ww / 2;
            this.camY = cssHeight / (2 * this.zoom) - wh / 2;
        },
        submitOrders(gameUuid: string, options?: { snapshotFetchUrl?: string }) {
            const troopOrders = this.draftPaths
                .filter((p) => p.kind === 'troop')
                .map((p) => [p.entityId, p.points] as [number, Point[]]);
            const cityOrders = this.draftPaths
                .filter((p) => p.kind === 'city')
                .map((p) => [p.entityId, p.points] as [number, Point[]]);

            const toast = useToastStore();
            const snapshotUrl = options?.snapshotFetchUrl;

            router.post(
                orders(gameUuid).url,
                {
                    troop_orders: troopOrders,
                    city_orders: cityOrders,
                },
                {
                    preserveScroll: true,
                    onError: (errors) => {
                        const first =
                            errors.troop_orders ??
                            errors.city_orders ??
                            Object.values(errors).find((v) => typeof v === 'string');
                        const message =
                            typeof first === 'string'
                                ? first
                                : 'Orders could not be submitted. Check you are in an active match and paths are valid.';
                        toast.error(message);
                    },
                    onSuccess: async () => {
                        this.clearDrafts();

                        if (snapshotUrl !== undefined && snapshotUrl.length > 0) {
                            await this.pullSnapshot(snapshotUrl);
                        }
                    },
                },
            );
        },
        togglePause(gameUuid: string) {
            this.paused = !this.paused;
            router.post(
                pauseRoute(gameUuid).url,
                { paused: this.paused },
                { preserveScroll: true },
            );
        },
        recruitInfantry(gameUuid: string) {
            router.post(recruitRoute({ game: gameUuid }).url, {}, { preserveScroll: true });
        },
    },
});
