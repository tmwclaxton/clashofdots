<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import LineOrderToolbar from '@/components/game/LineOrderToolbar.vue';
import WaterModeModal from '@/components/game/WaterModeModal.vue';
import { useIsDark } from '@/composables/useIsDark';
import {
    drawCapitalAtPixel,
    drawInfantryAtPixel,
    drawOutpostAtPixel,
    drawTankAtPixel,
} from '@/lib/mapMarkers';
import {
    editorBlendedTerrainFillStyle,
    editorTerrainDimOverlayFill,
    ENGINE_FOREST_THRESHOLD,
    ENGINE_TERRAIN_VALUES,
    engineCellFillStyle,
} from '@/lib/terrainRender';
import {
    GAME_VIEW_ZOOM_MAX,
    GAME_VIEW_ZOOM_MIN,
    useCameraStore,
} from '@/stores/cameraStore';
import { useDraftStore } from '@/stores/draftStore';
import { useGameStore } from '@/stores/gameStore';

const props = withDefaults(
    defineProps<{
        readOnly?: boolean;
        /** When set, orders trigger an immediate snapshot pull (covers missing Reverb). */
        snapshotFetchUrl?: string;
        /** When true, draw recruitment rings around owned cities. */
        recruitmentPanelOpen?: boolean;
        /** City id currently hovered in the recruitment panel; canvas highlights it. */
        hoveredCityId?: number | null;
    }>(),
    {
        readOnly: false,
        snapshotFetchUrl: '',
        recruitmentPanelOpen: false,
        hoveredCityId: null,
    },
);

const canvasRef = ref<HTMLCanvasElement | null>(null);
const store = useGameStore();
const camera = useCameraStore();
const drafts = useDraftStore();
const { isDark } = useIsDark();

let dragging = false;
let panning = false;
let lastMouse: [number, number] = [0, 0];
let terrainCanvas: HTMLCanvasElement | null = null;
let resizeObserver: ResizeObserver | null = null;
let rafId: number | null = null;
let needsRedraw = false;
let lastRafTimeMs = 0;

/**
 * Smooth movement: display positions continuously chase server target positions
 * at SMOOTH_SPEED_WU_MS world units per millisecond.
 * Chosen to be slightly faster than the max game speed so troops always catch up
 * before the next snapshot, giving fluid motion at any update frequency.
 */
const SMOOTH_SPEED_WU_MS = 0.14; // ~140 wu/sec display speed (game plains = 112.5 wu/sec at 5× scale)
const troopDisplayPositions = new Map<number, [number, number]>();
const troopTargetPositions = new Map<number, [number, number]>();

/** Lasso selection state. */
let lassoStart: [number, number] | null = null;
let lassoCurrent: [number, number] | null = null;

/** Line-order drawing state (advance / defend). */
let lineDrawing = false;
let lineStart: [number, number] | null = null;
let lineCurrent: [number, number] | null = null;

/** Water mode modal state. */
const waterModalVisible = ref(false);
let waterModalEntityId: number | null = null;
/** For group line orders: all troop IDs whose paths cross water. */
let waterModalGroupIds: number[] = [];

/**
 * Returns true if any point in the path lies on a water tile,
 * using the engine numeric terrain grid available in the store.
 */
function pathCrossesWater(points: [number, number][]): boolean {
    if (!store.terrain || !store.forest) {
        return false;
    }

    const { cellSize } = store.world;
    const waterThreshold = ENGINE_TERRAIN_VALUES.water ?? -0.1;

    for (const [wx, wy] of points) {
        const gx = Math.min(
            store.terrain.length - 1,
            Math.floor(wx / cellSize),
        );
        const gy = Math.min(
            (store.terrain[0]?.length ?? 1) - 1,
            Math.floor(wy / cellSize),
        );
        const tv = store.terrain[gx]?.[gy] ?? 0;
        const fv = store.forest[gx]?.[gy] ?? 0;

        if (tv <= waterThreshold && fv <= ENGINE_FOREST_THRESHOLD) {
            return true;
        }
    }

    return false;
}

function onWaterModeChosen(mode: 'wade' | 'embark') {
    if (waterModalGroupIds.length > 0) {
        for (const id of waterModalGroupIds) {
            drafts.setWaterMode(id, mode);
        }
    } else if (waterModalEntityId !== null) {
        drafts.setWaterMode(waterModalEntityId, mode);
    }

    waterModalVisible.value = false;
    waterModalEntityId = null;
    waterModalGroupIds = [];
}

function onWaterModalDismiss() {
    // Default to embark (already the default on DraftPath, nothing to set).
    waterModalVisible.value = false;
    waterModalEntityId = null;
    waterModalGroupIds = [];
}
let lassoActive = false;

/** Touch state for single-finger drafting and two-finger pan/pinch-zoom. */
let touchDrafting = false;
let touchPanning = false;
let lastTouchMid: [number, number] = [0, 0];
let lastTouchDist = 0;

function getTouchCoords(
    canvas: HTMLCanvasElement,
    touch: Touch,
): [number, number] {
    const rect = canvas.getBoundingClientRect();

    return [touch.clientX - rect.left, touch.clientY - rect.top];
}

function touchDistance(t1: Touch, t2: Touch): number {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;

    return Math.hypot(dx, dy);
}

function touchMidpoint(
    canvas: HTMLCanvasElement,
    t1: Touch,
    t2: Touch,
): [number, number] {
    const rect = canvas.getBoundingClientRect();

    return [
        (t1.clientX + t2.clientX) / 2 - rect.left,
        (t1.clientY + t2.clientY) / 2 - rect.top,
    ];
}

/** One-shot fit when a match snapshot first fills the store (per game uuid). */
const initialFitDone = ref(false);

function tryInitialCameraFit(): void {
    if (initialFitDone.value || !store.initialized) {
        return;
    }

    const canvas = canvasRef.value;

    if (!canvas) {
        return;
    }

    const r = canvas.getBoundingClientRect();

    if (r.width < 16 || r.height < 16) {
        return;
    }

    camera.fitCameraToView(
        store.world.width,
        store.world.height,
        r.width,
        r.height,
    );
    initialFitDone.value = true;
    bakeTerrain();
    draw();
}

function canvasInk(): string {
    return (
        getComputedStyle(document.documentElement)
            .getPropertyValue('--wod-canvas-ink')
            .trim() || (isDark.value ? '#f7f1e3' : '#1a1a1a')
    );
}

function canvasField(): string {
    return (
        getComputedStyle(document.documentElement)
            .getPropertyValue('--wod-canvas-field')
            .trim() || (isDark.value ? '#2a3520' : '#c8d68a')
    );
}

function terrainCellsMatchGrid(
    cells: string[][],
    terrain: number[][],
): boolean {
    if (cells.length === 0 || terrain.length === 0) {
        return false;
    }

    const t0 = terrain[0];

    if (!t0?.length) {
        return false;
    }

    return cells.length === terrain.length && cells[0]?.length === t0.length;
}

function bakeTerrain() {
    if (!store.terrain || !store.forest || !terrainCanvas) {
        return;
    }

    const ctx = terrainCanvas.getContext('2d');

    if (!ctx) {
        return;
    }

    const { width, height, cellSize } = store.world;
    terrainCanvas.width = width;
    terrainCanvas.height = height;

    const cells = store.terrainCells;
    const useEditorStyle =
        cells !== null && terrainCellsMatchGrid(cells, store.terrain);

    for (let y = 0; y < height; y += cellSize) {
        for (let x = 0; x < width; x += cellSize) {
            const gx = Math.min(
                store.terrain.length - 1,
                Math.floor(x / cellSize),
            );
            const gy = Math.min(
                store.terrain[0].length - 1,
                Math.floor(y / cellSize),
            );

            if (useEditorStyle && cells) {
                ctx.fillStyle = editorBlendedTerrainFillStyle(cells, gx, gy);
            } else {
                const tv = store.terrain[gx][gy];
                const fv = store.forest[gx][gy];
                ctx.fillStyle = engineCellFillStyle(tv, fv);
            }

            ctx.fillRect(x, y, cellSize + 1, cellSize + 1);
        }
    }

    if (useEditorStyle) {
        ctx.fillStyle = editorTerrainDimOverlayFill(isDark.value);
        ctx.fillRect(0, 0, width, height);
    }
}

function screenToWorld(x: number, y: number): [number, number] {
    return [x / camera.zoom - camera.camX, y / camera.zoom - camera.camY];
}

function worldToScreen(wx: number, wy: number): [number, number] {
    return [(wx + camera.camX) * camera.zoom, (wy + camera.camY) * camera.zoom];
}

function scheduleRedraw(): void {
    needsRedraw = true;
}

function rafLoop(nowMs: number): void {
    const dt = lastRafTimeMs > 0 ? Math.min(nowMs - lastRafTimeMs, 100) : 0;
    lastRafTimeMs = nowMs;

    // Advance each troop's display position toward its server target.
    let anyMoving = false;

    for (const [id, target] of troopTargetPositions) {
        const display = troopDisplayPositions.get(id);

        if (!display) {
            troopDisplayPositions.set(id, [target[0], target[1]]);
            continue;
        }

        const dx = target[0] - display[0];
        const dy = target[1] - display[1];
        const dist = Math.hypot(dx, dy);

        if (dist > 0.5) {
            anyMoving = true;
            const step = Math.min(dist, SMOOTH_SPEED_WU_MS * dt);
            display[0] += (dx / dist) * step;
            display[1] += (dy / dist) * step;
        }
    }

    // Also redraw when any unit is actively embarking or disembarking so the pulsing ring animates.
    const anyEmbarking = (store.latestState?.troops ?? []).some(
        (t) => !t.isShip && t.waterMode === 'embark' && (t.waterTicks ?? 0) > 0,
    );
    const anyDisembarking = (store.latestState?.troops ?? []).some(
        (t) => t.isShip && (t.landTicks ?? 0) > 0,
    );

    if (needsRedraw || anyMoving || anyEmbarking || anyDisembarking) {
        needsRedraw = false;
        draw();
    }

    rafId = requestAnimationFrame(rafLoop);
}

/**
 * When multiple troops share nearly the same display position, they'd render
 * on top of each other and become invisible.  This function computes a
 * per-troop screen-space render offset so every unit remains visible.
 *
 * Only the *render* position is nudged — the canonical display/target
 * positions (used for smooth movement and hit-testing) are unchanged.
 */
function separateTroopPositions(
    troops: Array<{ id: number; position: [number, number]; type?: string; isShip?: boolean }>,
): Map<number, [number, number]> {
    const CLUSTER_RADIUS = 18; // world-units: closer than this → same cluster
    const SPREAD_RADIUS = 14; // world-units: target orbit radius when clustered

    const result = new Map<number, [number, number]>();

    if (troops.length === 0) {
        return result;
    }

    // Seed from smooth display positions (same as what draw() uses for movement).
    const positions: [number, number][] = troops.map(
        (t) => troopDisplayPositions.get(t.id) ?? t.position,
    );

    // Find clusters: groups of troops within CLUSTER_RADIUS of each other.
    const visited = new Set<number>();

    for (let i = 0; i < troops.length; i++) {
        if (visited.has(i)) {
            continue;
        }

        // BFS to collect all troops that are within CLUSTER_RADIUS of any
        // already-collected member.
        const cluster: number[] = [i];
        visited.add(i);
        let head = 0;

        while (head < cluster.length) {
            const ci = cluster[head++];
            const [cx, cy] = positions[ci];

            for (let j = 0; j < troops.length; j++) {
                if (visited.has(j)) {
                    continue;
                }

                const [jx, jy] = positions[j];
                const dist = Math.hypot(jx - cx, jy - cy);

                if (dist < CLUSTER_RADIUS) {
                    cluster.push(j);
                    visited.add(j);
                }
            }
        }

        if (cluster.length === 1) {
            // No overlap - use the display position directly.
            result.set(troops[cluster[0]].id, positions[cluster[0]]);
            continue;
        }

        // Centroid of the cluster.
        let sumX = 0;
        let sumY = 0;

        for (const ci of cluster) {
            sumX += positions[ci][0];
            sumY += positions[ci][1];
        }

        const cx = sumX / cluster.length;
        const cy = sumY / cluster.length;

        // Spread troops evenly around the centroid.
        const step = (Math.PI * 2) / cluster.length;

        cluster.forEach((ci, rank) => {
            const angle = rank * step;
            const r = cluster.length === 1 ? 0 : SPREAD_RADIUS;
            result.set(troops[ci].id, [
                cx + Math.cos(angle) * r,
                cy + Math.sin(angle) * r,
            ]);
        });
    }

    return result;
}

/**
 * Assign evenly-spaced points along a world-space line segment to the given
 * troops and commit them as 2-point draft paths in the store.
 * Troops are sorted by their projection along the line so the assignment is
 * spatially coherent (leftmost troop → leftmost target, etc.).
 */
function distributeAlongLine(
    start: [number, number],
    end: [number, number],
    troopIds: number[],
): void {
    if (troopIds.length === 0) {
        return;
    }

    const dx = end[0] - start[0];
    const dy = end[1] - start[1];

    // Sort troops by their scalar projection onto the line direction.
    const sorted = [...troopIds].sort((a, b) => {
        const pa = troopTargetPositions.get(a) ?? [0, 0];
        const pb = troopTargetPositions.get(b) ?? [0, 0];
        const projA = (pa[0] - start[0]) * dx + (pa[1] - start[1]) * dy;
        const projB = (pb[0] - start[0]) * dx + (pb[1] - start[1]) * dy;

        return projA - projB;
    });

    sorted.forEach((id, i) => {
        const t = sorted.length === 1 ? 0.5 : i / (sorted.length - 1);
        const target: [number, number] = [start[0] + t * dx, start[1] + t * dy];
        const troopPos = troopTargetPositions.get(id) ?? target;

        // Overwrite any existing draft for this troop.
        drafts.draftPaths = drafts.draftPaths.filter((p) => p.entityId !== id);
        drafts.draftPaths.push({ entityId: id, points: [troopPos, target] });
    });
}

/**
 * Screen-space centroid of currently selected troops, used to position the
 * line-order toolbar above the selection. Reads from reactive store state so
 * Vue tracks the dependency and recomputes on troop movement.
 */
const lineToolbarPos = computed<{ x: number; y: number } | null>(() => {
    if (drafts.selectedTroopIds.length === 0) {
        return null;
    }

    const troops = store.latestState?.troops ?? [];
    const idSet = new Set(drafts.selectedTroopIds);

    let sumX = 0;
    let sumY = 0;
    let count = 0;

    // Also depend on camera so the overlay repositions when panning/zooming.
    const _z = camera.zoom;
    const _cx = camera.camX;
    const _cy = camera.camY;

    for (const troop of troops) {
        if (!idSet.has(troop.id)) {
            continue;
        }

        const [sx, sy] = worldToScreen(troop.position[0], troop.position[1]);
        sumX += sx;
        sumY += sy;
        count++;
    }

    if (count === 0) {
        return null;
    }

    return { x: sumX / count, y: sumY / count };
});

function draw() {
    const canvas = canvasRef.value;

    if (!canvas) {
        return;
    }

    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return;
    }

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    ctx.fillStyle = canvasField();
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.save();
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(camera.camX, camera.camY);

    if (terrainCanvas) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(terrainCanvas, 0, 0);
    }

    const state = store.latestState;

    if (state) {
        drawFog(ctx, state.vision, state.territory);
        drawTerritory(ctx, state.territory, state.playerColors, state.vision);
    }

    for (const city of state?.cities ??
        store.cityPositions.map((p, i) => ({
            position: p,
            id: i,
            ownerColor: null,
            ownerSlot: null,
            markerType: null as string | null,
            recruitmentEnabled: true,
        }))) {
        const isOwn = city.ownerSlot === store.slot;
        const showRing =
            props.recruitmentPanelOpen && isOwn;
        const isHovered = props.hoveredCityId === city.id;

        // Check vision at this city's grid cell.
        const { cellSize } = store.world;
        const cgx = Math.floor(city.position[0] / cellSize);
        const cgy = Math.floor(city.position[1] / cellSize);
        const visionVal = state?.vision?.[cgx]?.[cgy] ?? ENGINE_FOREST_THRESHOLD;
        const isLit = visionVal < ENGINE_FOREST_THRESHOLD;
        const isFullyFogged = visionVal >= ENGINE_FOREST_THRESHOLD;

        // Own cities always visible with full colour.
        // Enemy/neutral cities: hidden when fully fogged, shown as neutral yellow
        // when at the fog edge (lit), and only show true owner colour when lit.
        if (!isOwn && isFullyFogged) {
            continue;
        }

        const revealedColor = isOwn || isLit ? city.ownerColor : null;

        drawCity(
            ctx,
            city.position,
            revealedColor,
            city.markerType,
            showRing ? (city.recruitmentEnabled ?? true) : null,
            isHovered,
        );
    }

    const troops = state?.troops ?? [];
    const troopRenderPositions = separateTroopPositions(troops);

    for (const troop of troops) {
        const isSelected = drafts.selectedTroopIds.includes(troop.id);
        const renderPos = troopRenderPositions.get(troop.id) ?? troopDisplayPositions.get(troop.id) ?? troop.position;
        drawTroop(ctx, { ...troop, position: renderPos }, isSelected);
    }

    for (const draft of drafts.draftPaths) {
        drawArrowPath(ctx, draft.points);
    }

    if (drafts.activeDraft) {
        drawArrowPath(ctx, drafts.activeDraft.points, true);
    }

    ctx.restore();

    // Lasso rectangle overlay (screen-space, outside world transform).
    if (lassoActive && lassoStart && lassoCurrent) {
        const [x1, y1] = lassoStart;
        const [x2, y2] = lassoCurrent;
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 3]);
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
        ctx.setLineDash([]);
        ctx.restore();
    }

    // Line-order preview (screen-space, drawn during drag).
    if (lineDrawing && lineStart && lineCurrent) {
        const isAdvance = drafts.lineOrderMode === 'advance';
        const lineColor = isAdvance ? 'rgba(250,204,21,0.9)' : 'rgba(147,197,253,0.9)';
        const n = drafts.selectedTroopIds.length;

        // Convert world coords to screen for the preview.
        const [sx1, sy1] = worldToScreen(lineStart[0], lineStart[1]);
        const [sx2, sy2] = worldToScreen(lineCurrent[0], lineCurrent[1]);

        ctx.save();

        // Main line.
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = isAdvance ? 2.5 : 2;
        ctx.setLineDash(isAdvance ? [] : [8, 4]);
        ctx.beginPath();
        ctx.moveTo(sx1, sy1);
        ctx.lineTo(sx2, sy2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw evenly-spaced target dots along the line.
        for (let i = 0; i < n; i++) {
            const t = n === 1 ? 0.5 : i / (n - 1);
            const px = sx1 + t * (sx2 - sx1);
            const py = sy1 + t * (sy2 - sy1);

            ctx.fillStyle = lineColor;
            ctx.beginPath();

            if (isAdvance) {
                // Arrowhead pointing along the line direction.
                const angle = Math.atan2(sy2 - sy1, sx2 - sx1);
                ctx.moveTo(px + Math.cos(angle) * 7, py + Math.sin(angle) * 7);
                ctx.lineTo(
                    px + Math.cos(angle + 2.4) * 7,
                    py + Math.sin(angle + 2.4) * 7,
                );
                ctx.lineTo(
                    px + Math.cos(angle - 2.4) * 7,
                    py + Math.sin(angle - 2.4) * 7,
                );
                ctx.closePath();
                ctx.fill();
            } else {
                // Circle dot for defend positions.
                ctx.arc(px, py, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // End-cap circles at both endpoints of the line.
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sx1, sy1, 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(sx2, sy2, 4, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}

/**
 * Fog of war — dims cells outside the viewing player's vision.
 *
 * Vision convention: grid starts at high values (≥ 0.5 = fogged) and
 * friendly brushes drive values toward 0 (lit/clear).  So:
 *   value < ENGINE_FOREST_THRESHOLD  → lit (visible)
 *   value ≥ ENGINE_FOREST_THRESHOLD  → fogged
 *
 * Rendered by writing per-pixel alpha into a small offscreen canvas (one
 * pixel per grid cell) and then scaling it up with bilinear smoothing — this
 * produces a continuous, blurred fog boundary with no grid artifacts.
 * Own-territory cells are always fully clear so players can see their backfield.
 */
function drawFog(
    ctx: CanvasRenderingContext2D,
    vision: number[][] | undefined,
    territory: number[][] | undefined,
) {
    if (!vision?.length || !vision[0]?.length) {
        return;
    }

    const { cellSize, width, height } = store.world;
    const cols = vision.length;
    const rows = vision[0]?.length ?? 0;
    const mySlot = store.slot;

    // Build a small RGBA bitmap — one pixel per grid cell.
    const fogCanvas = document.createElement('canvas');
    fogCanvas.width = cols;
    fogCanvas.height = rows;
    const fogCtx = fogCanvas.getContext('2d')!;
    const imgData = fogCtx.createImageData(cols, rows);
    const data = imgData.data;

    // Fog colour and opacity.
    const [fr, fg, fb] = isDark.value ? [20, 18, 14] : [120, 108, 90];
    const maxAlpha = isDark.value ? 155 : 200; // out of 255

    for (let gx = 0; gx < cols; gx++) {
        for (let gy = 0; gy < rows; gy++) {
            // Own territory is always clear.
            const owner = territory?.[gx]?.[gy] ?? -1;
            if (owner === mySlot) {
                continue;
            }

            const v = vision[gx]?.[gy] ?? ENGINE_FOREST_THRESHOLD;

            // Fogged = at or above threshold. All fogged cells (enemy, neutral,
            // or unowned) get full opacity — no terrain or topology leaks through.
            if (v >= ENGINE_FOREST_THRESHOLD) {
                const idx = (gy * cols + gx) * 4;
                data[idx] = fr;
                data[idx + 1] = fg;
                data[idx + 2] = fb;
                data[idx + 3] = maxAlpha;
                continue;
            }

            // Lit cell — apply a soft fade only in the narrow band just inside
            // the vision radius so the edge isn't a hard pixel step.
            const transitionWidth = ENGINE_FOREST_THRESHOLD * 0.4;
            const raw = Math.max(0, Math.min(1, v / transitionWidth));
            // raw=0 at threshold edge (full fog), raw=1 well inside (clear).
            const clearFraction = Math.pow(raw, 1.5);
            const fogFraction = 1 - clearFraction;

            if (fogFraction <= 0.01) {
                continue;
            }

            // ImageData is row-major: index = (gy * cols + gx) * 4
            const idx = (gy * cols + gx) * 4;
            data[idx] = fr;
            data[idx + 1] = fg;
            data[idx + 2] = fb;
            data[idx + 3] = Math.round(fogFraction * maxAlpha);
        }
    }

    fogCtx.putImageData(imgData, 0, 0);

    // Scale the tiny fog canvas up to world dimensions with bilinear smoothing
    // to eliminate the pixel-grid look and get smooth gradient edges.
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(fogCanvas, 0, 0, width, height);
    ctx.restore();
}

/**
 * Draws smooth territory-boundary lines across the whole map, with each
 * player's borders rendered in their own player color.
 *
 * Every cell is owned by whoever has the highest border influence
 * (no threshold - the whole map is always fully divided).  Only the
 * boundary lines are drawn; no fill, so the terrain stays fully visible.
 *
 * Algorithm
 * ---------
 * 1. For each cell, collect boundary edges (shared sides with differently-owned
 *    neighbours) and assign each edge to the owning player (the cell we are
 *    currently iterating).  This keeps each edge in exactly one player's set.
 * 2. Per player: build a corner adjacency graph, then walk it greedily -
 *    preferring straight continuation at junctions - to assemble edges into
 *    the longest possible polylines.
 * 3. Render each player's polylines using quadratic-Bézier midpoint smoothing
 *    in that player's color:  straight stretches stay perfectly straight;
 *    direction-changes become smooth arcs - the "marker-pen on a map" aesthetic.
 */
function drawTerritory(
    ctx: CanvasRenderingContext2D,
    territory: number[][] | undefined,
    playerColors: Record<number, number[]> | undefined,
    vision: number[][] | undefined,
) {
    if (!territory?.length || !territory[0]?.length || !playerColors) {
        return;
    }

    const { cellSize } = store.world;
    const w = territory.length;
    const h = territory[0].length;
    const mySlot = store.slot;

    const cH = h + 1; // stride for corner-index encoding

    function ci(cx: number, cy: number): number {
        return cx * cH + cy;
    }

    function isCellVisible(gx: number, gy: number, slot: number): boolean {
        if (slot === mySlot) {
            return true;
        }

        const v = vision?.[gx]?.[gy] ?? ENGINE_FOREST_THRESHOLD;

        return v < ENGINE_FOREST_THRESHOLD;
    }

    // ── 1. Collect boundary edges with both side-slots ───────────────────────
    // Each edge stores [slotA, slotB] — the player slots on either side.
    // slotA is the "owner" side (the player whose color draws on that side).
    type BorderEdge = { a: number; b: number; slotA: number; slotB: number };
    const borderEdges: BorderEdge[] = [];

    for (let gx = 0; gx < w; gx++) {
        for (let gy = 0; gy < h; gy++) {
            const owner = territory[gx][gy];

            // Horizontal boundary: between (gx,gy) above and (gx,gy+1) below.
            if (gy + 1 < h && territory[gx][gy + 1] !== owner) {
                const other = territory[gx][gy + 1];
                const hasPlayer = owner >= 0 || other >= 0;
                const visible =
                    isCellVisible(gx, gy, owner) || isCellVisible(gx, gy + 1, other);

                if (hasPlayer && visible) {
                    borderEdges.push({
                        a: ci(gx, gy + 1),
                        b: ci(gx + 1, gy + 1),
                        slotA: owner,   // above the line
                        slotB: other,   // below the line
                    });
                }
            }

            // Vertical boundary: between (gx,gy) left and (gx+1,gy) right.
            if (gx + 1 < w && territory[gx + 1][gy] !== owner) {
                const other = territory[gx + 1][gy];
                const hasPlayer = owner >= 0 || other >= 0;
                const visible =
                    isCellVisible(gx, gy, owner) || isCellVisible(gx + 1, gy, other);

                if (hasPlayer && visible) {
                    borderEdges.push({
                        a: ci(gx + 1, gy),
                        b: ci(gx + 1, gy + 1),
                        slotA: owner,   // left of the line
                        slotB: other,   // right of the line
                    });
                }
            }
        }
    }

    // ── 2. Group edges into polylines per {slotA,slotB} pair ─────────────────
    // Edges with the same pair of facing players are chained into polylines
    // using the same greedy-walk as before, then rendered as dual-colour stripes.
    function ek(a: number, b: number): string {
        return a < b ? `${a}|${b}` : `${b}|${a}`;
    }

    function cpx(idx: number): [number, number] {
        const cx = Math.floor(idx / cH);
        const cy = idx % cH;

        return [cx * cellSize, cy * cellSize];
    }

    // Build per-pair adjacency (keyed by sorted slot pair so A↔B and B↔A merge).
    type PairKey = string;
    const pairAdj = new Map<PairKey, { adj: Map<number, Set<number>>; slotA: number; slotB: number }>();

    for (const edge of borderEdges) {
        const pairKey: PairKey =
            edge.slotA <= edge.slotB
                ? `${edge.slotA}:${edge.slotB}`
                : `${edge.slotB}:${edge.slotA}`;

        if (!pairAdj.has(pairKey)) {
            pairAdj.set(pairKey, {
                adj: new Map(),
                slotA: edge.slotA,
                slotB: edge.slotB,
            });
        }

        const entry = pairAdj.get(pairKey)!;
        const { adj } = entry;

        if (!adj.has(edge.a)) { adj.set(edge.a, new Set()); }
        if (!adj.has(edge.b)) { adj.set(edge.b, new Set()); }
        adj.get(edge.a)!.add(edge.b);
        adj.get(edge.b)!.add(edge.a);
    }

    // ── 3. Render each polyline as a dual-colour border stripe ───────────────
    // Pass 1: dark outline (thicker, drawn first as shadow/separator).
    // Pass 2: two coloured stripes offset ±HALF perpendicular to the path.
    const STRIPE = 1.8; // half-width of each colour stripe in world-units

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    function buildPolylines(adj: Map<number, Set<number>>): [number, number][][] {
        const usedEdges = new Set<string>();
        const polys: [number, number][][] = [];

        const starts: number[] = [];
        for (const [c, nbrs] of adj) {
            if (nbrs.size % 2 !== 0) { starts.push(c); }
        }
        for (const [c] of adj) { starts.push(c); }

        for (const seed of starts) {
            const seedNbrs = adj.get(seed);
            if (!seedNbrs) { continue; }

            for (const firstNbr of seedNbrs) {
                const eKey = ek(seed, firstNbr);
                if (usedEdges.has(eKey)) { continue; }

                const poly: [number, number][] = [cpx(seed)];
                let prev = seed;
                let cur = firstNbr;
                usedEdges.add(eKey);

                while (true) {
                    poly.push(cpx(cur));
                    const nbrs = adj.get(cur);
                    if (!nbrs) { break; }

                    const [px0, py0] = cpx(prev);
                    const [cx0, cy0] = cpx(cur);
                    const ddx = cx0 - px0;
                    const ddy = cy0 - py0;
                    let bestNext = -1;
                    let bestDot = -Infinity;

                    for (const n of nbrs) {
                        if (usedEdges.has(ek(cur, n))) { continue; }
                        const [nx, ny] = cpx(n);
                        const dot = ddx * (nx - cx0) + ddy * (ny - cy0);
                        if (dot > bestDot) { bestDot = dot; bestNext = n; }
                    }

                    if (bestNext === -1) { break; }
                    usedEdges.add(ek(cur, bestNext));
                    prev = cur;
                    cur = bestNext;
                }

                if (poly.length >= 2) { polys.push(poly); }
            }
        }

        return polys;
    }

    // Render each segment individually so the perpendicular offset is computed
    // per-segment — this avoids stripes crossing at polyline bends.
    for (const [, { adj, slotA, slotB }] of pairAdj) {
        const polys = buildPolylines(adj);
        const colorA = slotA >= 0 ? playerColors[slotA] : null;
        const colorB = slotB >= 0 ? playerColors[slotB] : null;

        for (const poly of polys) {
            for (let i = 0; i < poly.length - 1; i++) {
                const [x0, y0] = poly[i];
                const [x1, y1] = poly[i + 1];
                const sdx = x1 - x0;
                const sdy = y1 - y0;
                const sLen = Math.hypot(sdx, sdy) || 1;
                // Perpendicular normal for this segment.
                const nx = -sdy / sLen;
                const ny = sdx / sLen;

                // Dark outline.
                ctx.lineWidth = STRIPE * 4 + 1;
                ctx.strokeStyle = 'rgba(0,0,0,0.6)';
                ctx.globalAlpha = 1;
                ctx.beginPath();
                ctx.moveTo(x0, y0);
                ctx.lineTo(x1, y1);
                ctx.stroke();

                // SlotA colour stripe (offset +normal).
                if (colorA) {
                    ctx.lineWidth = STRIPE * 2;
                    ctx.strokeStyle = `rgb(${colorA[0]},${colorA[1]},${colorA[2]})`;
                    ctx.globalAlpha = 1;
                    ctx.beginPath();
                    ctx.moveTo(x0 + nx * STRIPE, y0 + ny * STRIPE);
                    ctx.lineTo(x1 + nx * STRIPE, y1 + ny * STRIPE);
                    ctx.stroke();
                }

                // SlotB colour stripe (offset −normal).
                if (colorB) {
                    ctx.lineWidth = STRIPE * 2;
                    ctx.strokeStyle = `rgb(${colorB[0]},${colorB[1]},${colorB[2]})`;
                    ctx.globalAlpha = 1;
                    ctx.beginPath();
                    ctx.moveTo(x0 - nx * STRIPE, y0 - ny * STRIPE);
                    ctx.lineTo(x1 - nx * STRIPE, y1 - ny * STRIPE);
                    ctx.stroke();
                }
            }
        }
    }

    ctx.restore();
}

function drawCity(
    ctx: CanvasRenderingContext2D,
    position: [number, number],
    color: number[] | null,
    markerType?: string | null,
    recruitmentEnabled?: boolean | null,
    hovered?: boolean,
) {
    const [x, y] = position;
    const fill = color ? rgb(color) : '#f1c40f';
    const radius = markerType === 'capital' ? 15 : 13;

    // Faint dashed ring showing the exact capture radius (matches CITY_CAPTURE_RADIUS = 24 wu).
    const CAPTURE_RADIUS = 24;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, CAPTURE_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = color ? `rgba(${color[0]},${color[1]},${color[2]},0.35)` : 'rgba(255,220,50,0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    if (markerType === 'capital') {
        drawCapitalAtPixel(ctx, x, y, fill, radius);
    } else {
        drawOutpostAtPixel(ctx, x, y, fill, radius);
    }

    // Recruitment ring: green = enabled, red = disabled. Glow when hovered.
    if (recruitmentEnabled !== null && recruitmentEnabled !== undefined) {
        const ringColor = recruitmentEnabled ? '#22c55e' : '#ef4444';
        const ringRadius = radius + 5;
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = ringColor;
        ctx.lineWidth = hovered ? 3 : 2;
        ctx.globalAlpha = hovered ? 1.0 : 0.8;
        ctx.stroke();

        if (hovered) {
            ctx.beginPath();
            ctx.arc(x, y, ringRadius + 4, 0, Math.PI * 2);
            ctx.strokeStyle = ringColor;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.3;
            ctx.stroke();
        }

        ctx.restore();
    }
}

type TroopDraw = {
    position: [number, number];
    color: number[];
    health: number;
    morale?: number;
    type?: 'infantry' | 'tank';
    maxHealth?: number;
    isShip?: boolean;
    waterMode?: 'wade' | 'embark';
    waterTicks?: number;
    landTicks?: number;
};

/** Radii that match the shared mapMarkers pixel-centre functions. */
const TROOP_R_INFANTRY = 9;
const TROOP_R_TANK = 12;
const TROOP_R_SHIP = 11;

function drawTroop(
    ctx: CanvasRenderingContext2D,
    troop: TroopDraw,
    selected = false,
) {
    const [x, y] = troop.position;
    const morale = troop.morale ?? 100;
    const isTank = troop.type === 'tank';
    const isShip = troop.isShip === true;
    const waterMode = troop.waterMode ?? 'embark';
    const waterTicks = troop.waterTicks ?? 0;
    const landTicks = troop.landTicks ?? 0;
    const isEmbarking = !isShip && waterMode === 'embark' && waterTicks > 0;
    const isDisembarking = isShip && landTicks > 0;
    const maxHp = troop.maxHealth ?? (isTank ? 200 : 100);
    const ink = canvasInk();
    const fillColor = rgb(troop.color);
    const unitR = isTank
        ? TROOP_R_TANK
        : isShip
          ? TROOP_R_SHIP
          : TROOP_R_INFANTRY;

    if (isShip) {
        ctx.fillStyle = fillColor;
        // Hull: pointed oval (almond/boat shape) using two cubic bezier curves.
        ctx.beginPath();
        ctx.moveTo(x - 13, y + 1);
        ctx.bezierCurveTo(x - 8, y - 7, x + 8, y - 7, x + 13, y + 1);
        ctx.bezierCurveTo(x + 8, y + 9, x - 8, y + 9, x - 13, y + 1);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Mast
        ctx.beginPath();
        ctx.moveTo(x, y + 1);
        ctx.lineTo(x, y - 10);
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Sail
        ctx.beginPath();
        ctx.moveTo(x, y - 9);
        ctx.lineTo(x + 7, y - 4);
        ctx.lineTo(x, y);
        ctx.closePath();
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.globalAlpha = 1;
    } else if (isTank) {
        drawTankAtPixel(ctx, x, y, fillColor, TROOP_R_TANK);
    } else {
        drawInfantryAtPixel(ctx, x, y, fillColor, TROOP_R_INFANTRY);
    }

    // Embarkation pulsing ring: shown while a unit is converting to a ship.
    if (isEmbarking) {
        const alpha = 0.35 + 0.3 * Math.sin(Date.now() / 250);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = fillColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(x, y, unitR + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
    }

    // Disembarkation pulsing ring: shown while a ship is converting back to a land unit.
    if (isDisembarking) {
        const alpha = 0.35 + 0.3 * Math.sin(Date.now() / 250);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(x, y, unitR + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
    }

    if (selected) {
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.arc(x, y, unitR + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Health bar — always visible
    const hBarY = y - unitR - 9;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(x - 9, hBarY, 18, 4);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(x - 9, hBarY, (18 * troop.health) / maxHp, 4);

    // Morale bar — always visible
    const mBarY = y - unitR - 4;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(x - 9, mBarY, 18, 3);
    ctx.fillStyle = '#9b59b6';
    ctx.fillRect(x - 9, mBarY, (18 * morale) / 100, 3);
}

function drawArrowPath(
    ctx: CanvasRenderingContext2D,
    points: [number, number][],
    dashed = false,
) {
    if (points.length < 2) {
        return;
    }

    ctx.strokeStyle = canvasInk();
    ctx.lineWidth = 2;
    ctx.setLineDash(dashed ? [6, 4] : []);

    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);

    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
    }

    ctx.stroke();
    ctx.setLineDash([]);

    const last = points.at(-1)!;
    const prev = points.at(-2)!;
    const angle = Math.atan2(last[1] - prev[1], last[0] - prev[0]);
    ctx.beginPath();
    ctx.moveTo(last[0], last[1]);
    ctx.lineTo(
        last[0] - Math.cos(angle - 0.4) * 10,
        last[1] - Math.sin(angle - 0.4) * 10,
    );
    ctx.moveTo(last[0], last[1]);
    ctx.lineTo(
        last[0] - Math.cos(angle + 0.4) * 10,
        last[1] - Math.sin(angle + 0.4) * 10,
    );
    ctx.stroke();
}

function rgb(color: number[]): string {
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

function findEntity(
    world: [number, number],
): { id: number; kind: 'troop' | 'city' } | null {
    const state = store.latestState;

    if (!state) {
        return null;
    }

    /** World radius so the pick target is at least ~22 CSS px (fixed radii vanish when zoomed out). */
    const z = camera.zoom;
    const troopPickR = Math.max(12, 22 / z);

    type PickHit = { id: number; kind: 'troop'; dist: number };

    const hits: PickHit[] = [];

    for (const troop of state.troops) {
        if (troop.ownerSlot !== store.slot) {
            continue;
        }

        // Cannot issue orders during embarkation (converting to ship) or disembarkation (reverting to troop).
        const troopIsEmbarking =
            !troop.isShip &&
            (troop.waterMode ?? 'embark') === 'embark' &&
            (troop.waterTicks ?? 0) > 0;
        const troopIsDisembarking = troop.isShip && (troop.landTicks ?? 0) > 0;
        if (troopIsEmbarking || troopIsDisembarking) {
            continue;
        }

        const dx = troop.position[0] - world[0];
        const dy = troop.position[1] - world[1];
        const dist = Math.hypot(dx, dy);

        if (dist < troopPickR) {
            hits.push({ id: troop.id, kind: 'troop', dist });
        }
    }

    if (hits.length === 0) {
        return null;
    }

    hits.sort((a, b) => a.dist - b.dist);

    const best = hits[0];

    return { id: best.id, kind: best.kind };
}

function onMouseDown(e: MouseEvent) {
    const canvas = canvasRef.value;

    if (!canvas) {
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    lastMouse = [sx, sy];

    if (e.button === 2) {
        panning = true;

        return;
    }

    if (props.readOnly) {
        return;
    }

    const world = screenToWorld(sx, sy);

    // If a line-order mode is active, start drawing the line instead of a troop path.
    if (drafts.lineOrderMode !== null && drafts.selectedTroopIds.length > 1) {
        lineDrawing = true;
        lineStart = world;
        lineCurrent = world;

        return;
    }

    const entity = findEntity(world);

    if (entity) {
        // If a lasso selection is active and the user starts a path from a troop,
        // begin group drafts for all selected troops.
        if (drafts.selectedTroopIds.length > 1) {
            dragging = true;

            for (const id of drafts.selectedTroopIds) {
                const troopState = state.troops.find((t) => t.id === id);
                const groupTroopIsEmbarking =
                    troopState &&
                    !troopState.isShip &&
                    (troopState.waterMode ?? 'embark') === 'embark' &&
                    (troopState.waterTicks ?? 0) > 0;
                const groupTroopIsDisembarking =
                    troopState && troopState.isShip && (troopState.landTicks ?? 0) > 0;
                if (groupTroopIsEmbarking || groupTroopIsDisembarking) {
                    continue;
                }
                // Start from the troop's actual server position, not the mouse click,
                // so the first waypoint doesn't cause a spurious initial movement.
                const troopPos = troopTargetPositions.get(id) ?? world;
                drafts.beginPath(id, [troopPos[0], troopPos[1]]);
            }
        } else {
            drafts.clearSelection();
            dragging = true;
            // Start from the troop's actual server position, not the mouse click.
            const troopPos = troopTargetPositions.get(entity.id) ?? world;
            drafts.beginPath(entity.id, [troopPos[0], troopPos[1]]);
        }
    } else {
        // No entity hit - start lasso selection (clears existing selection first).
        drafts.clearSelection();
        lassoStart = [sx, sy];
        lassoCurrent = [sx, sy];
        lassoActive = true;
    }
}

function onMouseMove(e: MouseEvent) {
    const canvas = canvasRef.value;

    if (!canvas) {
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (panning) {
        camera.camX += (sx - lastMouse[0]) / camera.zoom;
        camera.camY += (sy - lastMouse[1]) / camera.zoom;
        lastMouse = [sx, sy];
        scheduleRedraw();

        return;
    }

    if (lassoActive) {
        lassoCurrent = [sx, sy];
        scheduleRedraw();

        return;
    }

    if (lineDrawing) {
        lineCurrent = screenToWorld(sx, sy);
        scheduleRedraw();

        return;
    }

    if (dragging) {
        drafts.extendPath(screenToWorld(sx, sy));
        scheduleRedraw();
    }
}

function onMouseUp() {
    if (lineDrawing && lineStart && lineCurrent) {
        lineDrawing = false;

        const dx = lineCurrent[0] - lineStart[0];
        const dy = lineCurrent[1] - lineStart[1];
        const minLineLength = 4;

        if (Math.hypot(dx, dy) > minLineLength && !props.readOnly) {
            const assignedIds = [...drafts.selectedTroopIds];
            distributeAlongLine(lineStart, lineCurrent, assignedIds);

            // Show the water-mode modal once if any assigned path crosses water.
            const waterIds = assignedIds.filter((id) => {
                const path = drafts.draftPaths.find((p) => p.entityId === id);

                return path ? pathCrossesWater(path.points) : false;
            });

            if (waterIds.length > 0) {
                waterModalGroupIds = waterIds;
                waterModalVisible.value = true;
            }
        }

        lineStart = null;
        lineCurrent = null;
        drafts.clearLineOrderMode();
        scheduleRedraw();
    }

    if (lassoActive && lassoStart && lassoCurrent) {
        lassoActive = false;

        // Find own troops inside the lasso rectangle (in screen space).
        const x1 = Math.min(lassoStart[0], lassoCurrent[0]);
        const x2 = Math.max(lassoStart[0], lassoCurrent[0]);
        const y1 = Math.min(lassoStart[1], lassoCurrent[1]);
        const y2 = Math.max(lassoStart[1], lassoCurrent[1]);

        const state = store.latestState;

        if (state && (x2 - x1 > 4 || y2 - y1 > 4)) {
            const selected = state.troops
                .filter((t) => {
                    if (t.ownerSlot !== store.slot) {
                        return false;
                    }

                    const [wx, wy] = worldToScreen(
                        t.position[0],
                        t.position[1],
                    );

                    return wx >= x1 && wx <= x2 && wy >= y1 && wy <= y2;
                })
                .map((t) => t.id);
            drafts.setSelection(selected);
        }

        lassoStart = null;
        lassoCurrent = null;
        scheduleRedraw();
    }

    if (dragging) {
        const entityIdBeforeFinish = drafts.activeDraft?.entityId ?? null;
        drafts.finishPath();
        dragging = false;
        scheduleRedraw();

        // After finishing the path, check whether any segment crosses water and
        // prompt the player to choose wade vs embark.
        if (entityIdBeforeFinish !== null && !props.readOnly) {
            const finished = drafts.draftPaths.find(
                (p) => p.entityId === entityIdBeforeFinish,
            );

            if (finished && pathCrossesWater(finished.points)) {
                waterModalEntityId = entityIdBeforeFinish;
                waterModalVisible.value = true;
            }
        }
    }

    panning = false;
}

function onWheel(e: WheelEvent) {
    e.preventDefault();

    const canvas = canvasRef.value;

    if (!canvas) {
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const [wx, wy] = screenToWorld(sx, sy);
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const prevZoom = camera.zoom;
    const nextZoom = Math.min(
        GAME_VIEW_ZOOM_MAX,
        Math.max(GAME_VIEW_ZOOM_MIN, prevZoom * factor),
    );

    if (nextZoom === prevZoom) {
        return;
    }

    camera.zoom = nextZoom;
    camera.camX = sx / nextZoom - wx;
    camera.camY = sy / nextZoom - wy;
    scheduleRedraw();
}

function onKeyDown(e: KeyboardEvent) {
    if (props.readOnly) {
        return;
    }

    if (e.code === 'Space') {
        e.preventDefault();
        const url = props.snapshotFetchUrl?.trim() ?? '';

        store.submitOrders(
            store.gameUuid,
            url.length > 0 ? { snapshotFetchUrl: url } : undefined,
        );
    }

    if (e.key.toLowerCase() === 'c') {
        drafts.clearDrafts();
        draw();
    }

    if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        // Halt all own troops: submit empty-path orders for every own troop.
        store.stopAllTroops(
            store.gameUuid,
            props.snapshotFetchUrl?.trim() || undefined,
        );
    }

    // Line-order shortcuts (only when multiple troops are selected).
    if (e.key.toLowerCase() === 'a' && drafts.selectedTroopIds.length > 1) {
        e.preventDefault();
        drafts.setLineOrderMode('advance');
    }

    if (e.key.toLowerCase() === 'd' && drafts.selectedTroopIds.length > 1) {
        e.preventDefault();
        drafts.setLineOrderMode('defend');
    }

    if (e.code === 'Escape') {
        if (drafts.lineOrderMode !== null) {
            drafts.clearLineOrderMode();
            lineDrawing = false;
            lineStart = null;
            lineCurrent = null;
            scheduleRedraw();
        }
    }
}

function onTouchStart(e: TouchEvent) {
    e.preventDefault();
    const canvas = canvasRef.value;

    if (!canvas) {
        return;
    }

    if (e.touches.length === 1) {
        const [sx, sy] = getTouchCoords(canvas, e.touches[0]);
        lastMouse = [sx, sy];

        if (props.readOnly) {
            touchPanning = true;
            touchDrafting = false;

            return;
        }

        const world = screenToWorld(sx, sy);
        const entity = findEntity(world);

        if (entity) {
            touchDrafting = true;
            touchPanning = false;
            const troopPos = troopTargetPositions.get(entity.id) ?? world;
            drafts.beginPath(entity.id, [troopPos[0], troopPos[1]]);
        } else {
            touchPanning = true;
            touchDrafting = false;
        }
    } else if (e.touches.length === 2) {
        touchDrafting = false;
        touchPanning = false;

        if (drafts.activeDraft) {
            drafts.finishPath();
        }

        lastTouchMid = touchMidpoint(canvas, e.touches[0], e.touches[1]);
        lastTouchDist = touchDistance(e.touches[0], e.touches[1]);
    }
}

function onTouchMove(e: TouchEvent) {
    e.preventDefault();
    const canvas = canvasRef.value;

    if (!canvas) {
        return;
    }

    if (e.touches.length === 1) {
        const [sx, sy] = getTouchCoords(canvas, e.touches[0]);

        if (touchPanning) {
            camera.camX += (sx - lastMouse[0]) / camera.zoom;
            camera.camY += (sy - lastMouse[1]) / camera.zoom;
            lastMouse = [sx, sy];
            scheduleRedraw();
        } else if (touchDrafting) {
            lastMouse = [sx, sy];
            drafts.extendPath(screenToWorld(sx, sy));
            scheduleRedraw();
        }
    } else if (e.touches.length === 2) {
        const newMid = touchMidpoint(canvas, e.touches[0], e.touches[1]);
        const newDist = touchDistance(e.touches[0], e.touches[1]);

        camera.camX += (newMid[0] - lastTouchMid[0]) / camera.zoom;
        camera.camY += (newMid[1] - lastTouchMid[1]) / camera.zoom;

        if (lastTouchDist > 0 && newDist > 0) {
            const factor = newDist / lastTouchDist;
            const [wx, wy] = screenToWorld(newMid[0], newMid[1]);
            const prevZoom = camera.zoom;
            const nextZoom = Math.min(
                GAME_VIEW_ZOOM_MAX,
                Math.max(GAME_VIEW_ZOOM_MIN, prevZoom * factor),
            );

            if (nextZoom !== prevZoom) {
                camera.zoom = nextZoom;
                camera.camX = newMid[0] / nextZoom - wx;
                camera.camY = newMid[1] / nextZoom - wy;
            }
        }

        lastTouchMid = newMid;
        lastTouchDist = newDist;
        scheduleRedraw();
    }
}

function onTouchEnd(e: TouchEvent) {
    e.preventDefault();

    if (e.touches.length === 0) {
        if (touchDrafting) {
            drafts.finishPath();
            touchDrafting = false;
            scheduleRedraw();
        }

        touchPanning = false;
        lastTouchDist = 0;
    } else if (e.touches.length === 1) {
        lastTouchDist = 0;
        touchPanning = false;
        touchDrafting = false;

        const canvas = canvasRef.value;

        if (canvas) {
            lastMouse = getTouchCoords(canvas, e.touches[0]);
        }
    }
}

onMounted(() => {
    terrainCanvas = document.createElement('canvas');
    window.addEventListener('keydown', onKeyDown);

    const canvas = canvasRef.value;

    if (canvas) {
        resizeObserver = new ResizeObserver(() => {
            tryInitialCameraFit();
            scheduleRedraw();
        });
        resizeObserver.observe(canvas);
    }

    tryInitialCameraFit();
    needsRedraw = true;
    rafId = requestAnimationFrame(rafLoop);
});

onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown);
    resizeObserver?.disconnect();
    resizeObserver = null;

    if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }
});

watch(
    () => store.gameUuid,
    () => {
        initialFitDone.value = false;
        nextTick(() => tryInitialCameraFit());
    },
);

watch(
    () => [store.initialized, store.world.width, store.world.height],
    () => {
        nextTick(() => tryInitialCameraFit());
    },
);

watch(
    () => [store.terrain, store.forest, store.terrainCells],
    () => {
        bakeTerrain();
        scheduleRedraw();
    },
    { deep: true },
);

watch(
    () => [store.latestState, drafts.draftPaths, drafts.activeDraft],
    ([newState]) => {
        const troops = (newState as typeof store.latestState)?.troops ?? [];

        for (const t of troops) {
            troopTargetPositions.set(t.id, t.position);

            // Snap display to target on first appearance
            if (!troopDisplayPositions.has(t.id)) {
                troopDisplayPositions.set(t.id, [t.position[0], t.position[1]]);
            }
        }

        scheduleRedraw();
    },
    { deep: true },
);

watch(isDark, () => {
    bakeTerrain();
    scheduleRedraw();
});
</script>

<template>
    <div class="relative h-full w-full">
        <canvas
            ref="canvasRef"
            class="h-full w-full"
            :class="drafts.lineOrderMode !== null ? 'cursor-crosshair' : 'cursor-crosshair'"
            @contextmenu.prevent
            @mousedown="onMouseDown"
            @mousemove="onMouseMove"
            @mouseup="onMouseUp"
            @mouseleave="onMouseUp"
            @wheel.prevent="onWheel"
            @touchstart.prevent="onTouchStart"
            @touchmove.prevent="onTouchMove"
            @touchend.prevent="onTouchEnd"
            @touchcancel.prevent="onTouchEnd"
        />
        <WaterModeModal
            :visible="waterModalVisible"
            @choose="onWaterModeChosen"
            @dismiss="onWaterModalDismiss"
        />
        <LineOrderToolbar
            v-if="drafts.selectedTroopIds.length > 1 && lineToolbarPos"
            :position="lineToolbarPos"
            :active-mode="drafts.lineOrderMode"
            @set-mode="drafts.setLineOrderMode"
            @cancel="drafts.clearSelection()"
        />
    </div>
</template>
