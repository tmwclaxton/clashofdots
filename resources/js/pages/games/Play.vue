<script setup lang="ts">
import { Head, Link, usePage } from '@inertiajs/vue3';
import { MessageSquare, Building2, ChevronDown, Flag } from 'lucide-vue-next';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import GameCanvas from '@/components/game/GameCanvas.vue';
import ThemeToggle from '@/components/ThemeToggle.vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { index as lobbies } from '@/routes/lobbies';
import { show as profileShow } from '@/routes/profiles';
import { useDraftStore } from '@/stores/draftStore';
import { useGameStore } from '@/stores/gameStore';
import { useToastStore } from '@/stores/toastStore';

/** Vite build mode; exposed for Dev HUD (cannot use `import.meta` inside Vue templates). */
const viteMode = import.meta.env.MODE;

type GamePayload = {
    uuid: string;
    code: string;
    maxPlayers: number;
    slot: number;
    color: string;
    players: Array<{
        slot: number;
        name: string;
        color: string;
        teamIndex: number;
        profileUuid: string | null;
    }>;
};

type GameConstants = {
    recruitCost: number;
    recruitCostTank: number;
    upkeepPerTroop: number;
    tickRate: number;
};

const props = withDefaults(
    defineProps<{
        game: GamePayload;
        snapshotUrl: string;
        spectatorMode?: boolean;
        gameConstants: GameConstants;
    }>(),
    {
        spectatorMode: false,
    },
);

const page = usePage();
const store = useGameStore();
const draftStore = useDraftStore();
const toast = useToastStore();

/** How often we pull JSON snapshots during a live match (backs up Reverb / shows tick progress). */
const MATCH_SNAPSHOT_POLL_MS = 1800;

/** Consecutive polls with no `worldTick` advance ⇒ likely tick worker missing. */
const SIMULATION_STALL_POLL_THRESHOLD = 5;

const spectatePollTimer = ref<ReturnType<typeof setInterval> | null>(null);
const participatePollTimer = ref<ReturnType<typeof setInterval> | null>(null);
const participateLivePollTimer = ref<ReturnType<typeof setInterval> | null>(
    null,
);
const showSlowLoadHint = ref(false);
const lastCityOwners = ref<Record<number, number | null>>({});
const simulationStallPolls = ref(0);
let slowLoadHintTimer: ReturnType<typeof setTimeout> | null = null;

const devHudOpen = ref(false);

function hasDevQuery(url: string): boolean {
    const i = url.indexOf('?');

    if (i === -1) {
        return false;
    }

    try {
        return new URLSearchParams(url.slice(i + 1)).get('dev') === '1';
    } catch {
        return false;
    }
}

const devHudEligible = computed((): boolean => {
    if (page.props.appDebug === true) {
        return true;
    }

    if (import.meta.env.DEV) {
        return true;
    }

    return hasDevQuery(page.url);
});

const snapshotPath = computed((): string => {
    const u = props.snapshotUrl;

    if (u.startsWith('http://') || u.startsWith('https://')) {
        try {
            const parsed = new URL(u);

            return parsed.pathname + parsed.search;
        } catch {
            return u;
        }
    }

    return u;
});

function formatTickTime(ms: number | null): string {
    if (ms === null) {
        return '-';
    }

    try {
        return new Date(ms).toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    } catch {
        return '-';
    }
}

watch(devHudOpen, (open) => {
    if (typeof sessionStorage === 'undefined') {
        return;
    }

    sessionStorage.setItem('wod_dev_hud_open', open ? '1' : '0');

    if (open) {
        // Clamp after the panel has rendered.
        nextTick(() => {
            devHudPos.value = clampDevPos(devHudPos.value.x, devHudPos.value.y);
        });
    }
});

// Dev HUD dragging.
const devHudEl = ref<HTMLElement | null>(null);
const devHudPos = ref({ x: 12, y: 80 });
let devDragOffset = { x: 0, y: 0 };
let devDragging = false;

function clampDevPos(x: number, y: number): { x: number; y: number } {
    const el = devHudEl.value;
    const pw = el?.offsetWidth ?? 352;
    const ph = el?.offsetHeight ?? 384;
    return {
        x: Math.max(0, Math.min(window.innerWidth - pw, x)),
        y: Math.max(0, Math.min(window.innerHeight - ph, y)),
    };
}

function onDevDragStart(e: MouseEvent) {
    devDragging = true;
    devDragOffset = { x: e.clientX - devHudPos.value.x, y: e.clientY - devHudPos.value.y };
    window.addEventListener('mousemove', onDevDragMove);
    window.addEventListener('mouseup', onDevDragEnd);
    e.preventDefault();
}

function onDevDragMove(e: MouseEvent) {
    if (!devDragging) { return; }
    devHudPos.value = clampDevPos(e.clientX - devDragOffset.x, e.clientY - devDragOffset.y);
}

function onDevDragEnd() {
    devDragging = false;
    window.removeEventListener('mousemove', onDevDragMove);
    window.removeEventListener('mouseup', onDevDragEnd);
}

const broadcastConnection = computed(() => {
    const uid = page.props.auth.user?.id;

    if (uid !== undefined && uid !== null) {
        return `u${uid}`;
    }

    const g = page.props.guestBroadcast;

    return typeof g === 'string' && g.length > 0 ? g : null;
});

const victoryTitle = computed(() => {
    if (props.spectatorMode) {
        return store.winnerName ? `${store.winnerName} wins` : 'Match over';
    }

    if (
        store.matchEnded &&
        store.winnerSlot === null &&
        store.winnerUserId === null
    ) {
        return store.winnerName ?? 'Match ended';
    }

    if (store.winnerSlot !== null && store.winnerSlot === props.game.slot) {
        return 'Victory!';
    }

    if (
        store.winnerUserId !== null &&
        store.winnerUserId === page.props.auth.user?.id
    ) {
        return 'Victory!';
    }

    return 'Defeat';
});

const myEconomy = computed(() => store.economy?.[props.game.slot] ?? null);

const myCredits = computed(() => myEconomy.value?.credits ?? null);

/** Cities owned by this player, for the recruitment panel. */
const ownedCities = computed(() => {
    const cities = store.latestState?.cities ?? [];

    return cities.filter((c) => c.ownerSlot === props.game.slot);
});

const recruitmentPanelOpen = ref(false);
const chatPanelOpen = ref(false);
const chatInput = ref('');

/** ID of the city currently hovered in the recruitment panel (for canvas highlight). */
const hoveredCityId = ref<number | null>(null);

/** Global production sliders - local copies to avoid snap-back on async saves. */
const localTankRatio = ref(0);
const localSpeedMultiplier = ref(1.0);
let productionSaveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleProductionSave() {
    if (productionSaveTimer !== null) {
        clearTimeout(productionSaveTimer);
    }

    productionSaveTimer = setTimeout(() => {
        store.setPlayerProduction(
            props.game.uuid,
            localTankRatio.value,
            localSpeedMultiplier.value,
        );
        productionSaveTimer = null;
    }, 300);
}

function openChat() {
    chatPanelOpen.value = true;
    recruitmentPanelOpen.value = false;
    store.clearUnreadChat();
}

function openRecruitment() {
    recruitmentPanelOpen.value = true;
    chatPanelOpen.value = false;
}

async function submitChat() {
    const body = chatInput.value.trim();

    if (!body) {
        return;
    }

    const myPlayer = props.game.players.find(
        (p) => p.slot === props.game.slot,
    );
    const senderName = myPlayer?.name ?? 'Commander';

    await store.sendChatMessage(props.game.uuid, body, senderName);
    chatInput.value = '';
}

watch(chatPanelOpen, (open) => {
    if (open) {
        store.clearUnreadChat();
    }
});

const surrenderDialogOpen = ref(false);
const surrendering = ref(false);

async function confirmSurrender() {
    surrendering.value = true;
    const ok = await store.surrender(props.game.uuid);
    surrendering.value = false;
    surrenderDialogOpen.value = false;

    if (ok) {
        store.markSurrendered();
    }
}

const incomePerTick = computed(() => myEconomy.value?.incomePerTick ?? 0);
const troopUpkeep = computed(() => myEconomy.value?.troopUpkeep ?? 0);
const capitalCount = computed(() => myEconomy.value?.capitalCount ?? 0);
const outpostCount = computed(() => myEconomy.value?.outpostCount ?? 0);
const troopCount = computed(() => myEconomy.value?.troopCount ?? 0);

const showSimulationStallHint = computed(
    () =>
        !props.spectatorMode &&
        store.initialized &&
        !store.matchEnded &&
        simulationStallPolls.value >= SIMULATION_STALL_POLL_THRESHOLD,
);

watch(
    () => store.worldTick,
    () => {
        simulationStallPolls.value = 0;
    },
);

watch(
    () => store.latestState?.cities,
    (cities) => {
        if (!cities || props.spectatorMode) {
            return;
        }

        for (const c of cities) {
            const cur = c.ownerSlot ?? null;
            const prev = lastCityOwners.value[c.id];

            if (prev !== undefined && prev !== cur) {
                const isCapital = c.markerType === 'capital';
                const label = isCapital ? 'Capital' : 'Flag';

                if (cur === props.game.slot) {
                    toast.success(`${label} captured.`);
                } else if (prev === props.game.slot) {
                    toast.warning(`${label} lost.`);
                }
            }

            lastCityOwners.value[c.id] = cur;
        }
    },
    { deep: true },
);

onMounted(() => {
    if (
        typeof sessionStorage !== 'undefined' &&
        sessionStorage.getItem('wod_dev_hud_open') === '1'
    ) {
        devHudOpen.value = true;
    }

    if (props.spectatorMode) {
        store.disconnect();
        void store.pullSnapshot(props.snapshotUrl, { treat404AsEnded: true });
        spectatePollTimer.value = setInterval(() => {
            void store.pullSnapshot(props.snapshotUrl, {
                treat404AsEnded: true,
            });
        }, 1500);

        return;
    }

    const conn = broadcastConnection.value;

    if (conn) {
        store.connect(props.game.uuid, conn, props.game.slot, props.game.color);
    } else {
        store.gameUuid = props.game.uuid;
        store.slot = props.game.slot;
        store.color = props.game.color;
    }

    void store.pullSnapshot(props.snapshotUrl);

    participatePollTimer.value = setInterval(() => {
        if (store.initialized || store.matchEnded) {
            if (participatePollTimer.value !== null) {
                clearInterval(participatePollTimer.value);
                participatePollTimer.value = null;
            }

            return;
        }

        void store.pullSnapshot(props.snapshotUrl);
    }, 1200);

    participateLivePollTimer.value = setInterval(() => {
        void (async () => {
            if (store.matchEnded) {
                return;
            }

            if (!store.initialized) {
                return;
            }

            const tickBefore = store.worldTick;
            await store.pullSnapshot(props.snapshotUrl);

            if (store.matchEnded) {
                return;
            }

            if (store.worldTick === tickBefore && store.initialized) {
                simulationStallPolls.value += 1;
            } else {
                simulationStallPolls.value = 0;
            }
        })();
    }, MATCH_SNAPSHOT_POLL_MS);

    slowLoadHintTimer = setTimeout(() => {
        showSlowLoadHint.value = true;
    }, 8000);
});

onUnmounted(() => {
    if (spectatePollTimer.value !== null) {
        clearInterval(spectatePollTimer.value);
        spectatePollTimer.value = null;
    }

    if (participatePollTimer.value !== null) {
        clearInterval(participatePollTimer.value);
        participatePollTimer.value = null;
    }

    if (participateLivePollTimer.value !== null) {
        clearInterval(participateLivePollTimer.value);
        participateLivePollTimer.value = null;
    }

    if (slowLoadHintTimer !== null) {
        clearTimeout(slowLoadHintTimer);
        slowLoadHintTimer = null;
    }

    store.disconnect();
});
</script>

<template>
    <Head title="Battlefield" />

    <div
        class="flex h-svh min-h-0 flex-col overflow-hidden bg-background text-foreground"
    >
        <!-- Slim top bar -->
        <header
            class="wod-bar-top flex shrink-0 items-center gap-3 border-b border-foreground/10 px-3 py-2 sm:px-4"
        >
            <div class="min-w-0 shrink-0">
                <p
                    class="text-[0.55rem] font-semibold tracking-widest text-muted-foreground uppercase"
                >
                    War of Dots
                </p>
                <p
                    class="font-mono text-sm leading-none font-bold tracking-widest"
                >
                    {{ game.code }}
                    <span
                        v-if="spectatorMode"
                        class="ml-1 text-xs font-normal text-muted-foreground"
                    >
                        · spectating
                    </span>
                </p>
            </div>

            <div
                class="flex min-w-0 flex-1 gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                <component
                    :is="player.profileUuid ? Link : 'span'"
                    v-for="player in [...game.players].sort(
                        (a, b) => a.slot - b.slot,
                    )"
                    :key="player.slot"
                    class="wod-chip shrink-0"
                    :href="
                        player.profileUuid
                            ? profileShow(player.profileUuid).url
                            : undefined
                    "
                    :class="
                        player.profileUuid
                            ? 'hover:opacity-80 transition-opacity'
                            : ''
                    "
                >
                    <span
                        class="inline-block size-2 rounded-full"
                        :style="{ backgroundColor: player.color }"
                    />
                    {{ player.name }}
                </component>
            </div>

            <div class="flex shrink-0 items-center gap-2">
                <span
                    v-if="store.initialized"
                    class="hidden font-mono text-[0.65rem] text-muted-foreground sm:inline"
                    title="Server simulation tick"
                >T{{ store.worldTick }}</span>
                <Button
                    v-if="devHudEligible"
                    type="button"
                    size="sm"
                    variant="outline"
                    class="font-mono text-[0.65rem]"
                    @click="devHudOpen = !devHudOpen"
                >
                    Dev
                </Button>
                <ThemeToggle />
                <Link :href="lobbies().url">
                    <Button size="sm" variant="outline">Exit</Button>
                </Link>
            </div>
        </header>

        <!-- Canvas area - fills all remaining height -->
        <div class="relative min-h-0 flex-1">
            <!-- Loading overlays -->
            <div
                v-if="
                    !store.initialized &&
                    !store.matchEnded &&
                    store.winnerUserId === null &&
                    store.winnerSlot === null
                "
                class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/90 text-center"
            >
                <p class="text-sm font-semibold text-muted-foreground">
                    Preparing for battle…
                </p>
                <p
                    v-if="!spectatorMode"
                    class="max-w-xs text-xs text-muted-foreground"
                >
                    Get your troops ready, commander.
                </p>
                <p
                    v-if="
                        !spectatorMode && showSlowLoadHint && !store.initialized
                    "
                    class="max-w-xs text-xs text-muted-foreground"
                >
                    Still loading? Refresh or run
                    <code class="rounded bg-muted px-1 font-mono"
                        >php artisan reverb:start</code
                    >.
                </p>
            </div>

            <GameCanvas
                :read-only="spectatorMode"
                :snapshot-fetch-url="spectatorMode ? '' : snapshotUrl"
                :recruitment-panel-open="recruitmentPanelOpen"
                :hovered-city-id="hoveredCityId"
            />

            <!-- Victory / defeat overlay -->
            <div
                v-if="
                    !spectatorMode &&
                    (store.matchEnded ||
                        store.winnerUserId !== null ||
                        store.winnerSlot !== null)
                "
                class="absolute inset-0 z-20 flex items-center justify-center bg-foreground/50"
            >
                <div
                    class="wod-panel px-6 py-6 text-center shadow-2xl sm:px-10 sm:py-8"
                >
                    <p class="font-display text-3xl font-bold">
                        {{ victoryTitle }}
                    </p>
                    <Link :href="lobbies().url" class="mt-5 inline-block">
                        <Button size="lg">Return to lobbies</Button>
                    </Link>
                </div>
            </div>
            <div
                v-else-if="spectatorMode && store.matchEnded"
                class="absolute inset-0 z-20 flex items-center justify-center bg-foreground/50"
            >
                <div
                    class="wod-panel px-6 py-6 text-center shadow-2xl sm:px-10 sm:py-8"
                >
                    <p class="font-display text-3xl font-bold">Match ended</p>
                    <p class="mt-2 text-sm text-muted-foreground">
                        The live state is no longer available.
                    </p>
                    <Link :href="lobbies().url" class="mt-5 inline-block">
                        <Button size="lg">Return to lobbies</Button>
                    </Link>
                </div>
            </div>

            <!-- Simulation stall alert (canvas overlay) -->
            <div
                v-if="showSimulationStallHint"
                class="absolute top-3 right-3 left-3 z-10 rounded-md border border-destructive/60 bg-background/95 px-3 py-2 text-xs text-destructive shadow-md backdrop-blur-sm"
                role="alert"
            >
                World time is not advancing - ensure
                <code class="rounded bg-muted px-1 font-mono text-foreground"
                    >game:tick --daemon</code
                >
                is running.
            </div>

            <!-- Economy card (top-right of canvas) -->
            <div
                v-if="!spectatorMode && store.initialized && !store.matchEnded"
                class="pointer-events-none absolute top-0 right-0 p-3 z-10"
            >
                <div class="pointer-events-auto wod-panel min-w-[9rem] px-3 py-2 text-[0.6rem]">
                    <div class="flex items-baseline justify-between gap-3">
                        <span class="font-display font-bold tracking-wide text-muted-foreground uppercase">Credits</span>
                        <span
                            class="font-mono text-lg leading-none font-bold"
                            :class="(myCredits ?? 0) < 0 ? 'text-destructive' : 'text-foreground'"
                        >{{ myCredits ?? '-' }}</span>
                    </div>
                    <div class="my-1.5 border-t-2 border-foreground/20" />
                    <div class="space-y-0.5">
                        <div v-if="capitalCount > 0" class="flex justify-between gap-2">
                            <span class="text-muted-foreground">{{ capitalCount }}× capital</span>
                            <span class="font-mono font-bold text-wod-green-dk">+{{ capitalCount * 10 }}</span>
                        </div>
                        <div v-if="outpostCount > 0" class="flex justify-between gap-2">
                            <span class="text-muted-foreground">{{ outpostCount }}× outpost</span>
                            <span class="font-mono font-bold text-wod-green-dk">+{{ outpostCount * 5 }}</span>
                        </div>
                        <div class="flex justify-between gap-2">
                            <span class="text-muted-foreground">{{ troopCount }}× troop</span>
                            <span class="font-mono font-bold text-destructive">-{{ troopUpkeep }}</span>
                        </div>
                    </div>
                    <div class="mt-1.5 border-t-2 border-foreground/20 pt-1.5 flex justify-between gap-2 font-bold">
                        <span class="text-muted-foreground">Net/tick</span>
                        <span
                            class="font-mono"
                            :class="incomePerTick < 0 ? 'text-destructive' : 'text-wod-green-dk'"
                        >{{ incomePerTick > 0 ? '+' : '' }}{{ incomePerTick }}</span>
                    </div>
                </div>
            </div>

            <!-- Left-side panel toggles (Chat & Recruitment) -->
            <div
                v-if="!spectatorMode && store.initialized && !store.matchEnded"
                class="pointer-events-none absolute top-0 left-0 p-3"
            >
                <div class="pointer-events-auto flex flex-col gap-1.5">
                    <Button
                        size="sm"
                        variant="outline"
                        class="relative gap-1.5"
                        @click="
                            chatPanelOpen ? (chatPanelOpen = false) : openChat()
                        "
                    >
                        <MessageSquare class="size-3.5" />
                        <span class="hidden sm:inline">Chat</span>
                        <Badge
                            v-if="store.unreadChatCount > 0 && !chatPanelOpen"
                            class="absolute -top-1.5 -right-1.5 size-4 justify-center p-0 text-[0.55rem]"
                        >
                            {{ store.unreadChatCount }}
                        </Badge>
                    </Button>
                    <Button
                        v-if="ownedCities.length > 0"
                        size="sm"
                        variant="outline"
                        class="gap-1.5"
                        @click="
                            recruitmentPanelOpen
                                ? (recruitmentPanelOpen = false)
                                : openRecruitment()
                        "
                    >
                        <Building2 class="size-3.5" />
                        <span class="hidden sm:inline">Recruit</span>
                    </Button>
                </div>
            </div>

            <!-- Bottom HUD (only in active play, floats over canvas) -->
            <div
                v-if="!spectatorMode && store.initialized && !store.matchEnded"
                class="pointer-events-none absolute inset-x-0 bottom-0 p-3"
            >
                <div class="flex items-end gap-2">
                    <!-- Orders -->
                    <div
                        class="pointer-events-auto flex flex-1 justify-center gap-1.5"
                    >
                        <Button
                            v-if="draftStore.draftPaths.length > 0"
                            size="sm"
                            variant="outline"
                            class="whitespace-nowrap"
                            title="Clear all drafted paths (C)"
                            @click="draftStore.clearDrafts()"
                        >
                            Clear
                        </Button>
                        <Button
                            size="sm"
                            class="whitespace-nowrap"
                            title="Send drafted orders to the server (Space)"
                            @click="
                                store.submitOrders(game.uuid, {
                                    snapshotFetchUrl: snapshotUrl,
                                })
                            "
                        >
                            Execute Orders
                            <span class="ml-1.5 opacity-60">(Spacebar)</span>
                        </Button>
                    </div>

                    <!-- Surrender -->
                    <Button
                        size="sm"
                        variant="outline"
                        class="pointer-events-auto shrink-0 text-destructive/70 hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                        title="Surrender and forfeit the match"
                        @click="surrenderDialogOpen = true"
                    >
                        <Flag class="size-3.5" />
                        <span class="hidden sm:inline">Surrender</span>
                    </Button>
                </div>
            </div>

            <!-- Spectator footer hint -->
            <div
                v-if="spectatorMode && store.initialized"
                class="pointer-events-none absolute inset-x-0 bottom-0 p-3 text-center text-[0.65rem] text-muted-foreground"
            >
                Spectating · slot&nbsp;1 vision · auto-refresh
            </div>

            <!-- Chat floating panel -->
            <div
                v-if="chatPanelOpen && store.initialized"
                class="absolute top-28 left-3 z-10 w-72 wod-panel"
            >
                <div class="flex items-center justify-between border-b-2 border-foreground/20 px-3 py-2">
                    <span class="font-display text-sm font-bold">Chat</span>
                    <button
                        class="text-muted-foreground hover:text-foreground"
                        @click="chatPanelOpen = false"
                    >
                        <ChevronDown class="size-4" />
                    </button>
                </div>
                <div class="flex flex-col gap-2 p-3">
                    <div class="h-36 overflow-y-auto border-2 border-foreground/20 bg-background/60 p-2 text-xs">
                        <p
                            v-if="store.chatMessages.length === 0"
                            class="text-muted-foreground"
                        >
                            No messages yet.
                        </p>
                        <div
                            v-for="msg in store.chatMessages"
                            :key="msg.id"
                            class="mb-1 leading-snug"
                        >
                            <span class="font-bold">{{ msg.senderName }}: </span>
                            <span class="text-muted-foreground">{{ msg.body }}</span>
                        </div>
                    </div>
                    <form
                        v-if="!spectatorMode"
                        class="flex gap-1.5"
                        @submit.prevent="submitChat"
                    >
                        <input
                            v-model="chatInput"
                            maxlength="200"
                            placeholder="Message…"
                            class="min-w-0 flex-1 border-2 border-foreground/30 bg-background px-2 py-1.5 text-xs focus:border-foreground focus:outline-none"
                        />
                        <Button type="submit" size="sm">Send</Button>
                    </form>
                </div>
            </div>

            <!-- Recruitment floating panel -->
            <div
                v-if="recruitmentPanelOpen && !spectatorMode && store.initialized && ownedCities.length > 0"
                class="absolute top-28 left-3 z-10 w-80 wod-panel"
            >
                <div class="flex items-center justify-between border-b-2 border-foreground/20 px-3 py-2">
                    <span class="font-display text-sm font-bold">Recruitment</span>
                    <button
                        class="text-muted-foreground hover:text-foreground"
                        @click="recruitmentPanelOpen = false"
                    >
                        <ChevronDown class="size-4" />
                    </button>
                </div>

                <div class="flex flex-col gap-4 p-4">
                    <!-- Global spawn speed slider -->
                    <div class="space-y-1.5">
                        <div class="flex items-center justify-between">
                            <label class="text-[0.65rem] font-bold tracking-wide text-muted-foreground uppercase">Spawn Speed</label>
                            <span
                                class="text-[0.65rem] font-bold"
                                :class="localSpeedMultiplier <= 0 ? 'text-muted-foreground' : 'text-foreground'"
                            >{{ localSpeedMultiplier <= 0 ? 'Off' : localSpeedMultiplier.toFixed(1) + '×' }}</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="3"
                            step="0.1"
                            :value="localSpeedMultiplier"
                            class="h-2 w-full cursor-pointer appearance-none bg-muted accent-primary"
                            @input="(e) => { localSpeedMultiplier = parseFloat((e.target as HTMLInputElement).value); scheduleProductionSave(); }"
                        />
                        <div class="flex justify-between text-[0.6rem] text-muted-foreground">
                            <span>Off</span>
                            <span>Fast</span>
                        </div>
                    </div>

                    <!-- Global tank/infantry ratio slider -->
                    <div class="space-y-1.5">
                        <div class="flex items-center justify-between">
                            <label class="text-[0.65rem] font-bold tracking-wide text-muted-foreground uppercase">Unit Mix</label>
                            <span class="text-[0.65rem] font-bold text-foreground">
                                {{ localTankRatio === 0 ? 'Infantry only' : localTankRatio === 100 ? 'Tanks only' : localTankRatio + '% Tanks' }}
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="10"
                            :value="localTankRatio"
                            class="h-2 w-full cursor-pointer appearance-none bg-muted accent-primary"
                            @input="(e) => { localTankRatio = parseInt((e.target as HTMLInputElement).value); scheduleProductionSave(); }"
                        />
                        <div class="flex justify-between text-[0.6rem] text-muted-foreground">
                            <span>Infantry</span>
                            <span>Tanks</span>
                        </div>
                    </div>

                    <!-- Per-city recruitment toggles -->
                    <div class="space-y-1">
                        <p class="text-[0.6rem] font-bold tracking-widest text-muted-foreground uppercase">Spawn points</p>
                        <div
                            v-for="city in [...ownedCities].sort((a, b) => a.markerType === 'capital' ? -1 : b.markerType === 'capital' ? 1 : 0)"
                            :key="city.id"
                            class="flex cursor-pointer items-center justify-between border-2 border-foreground/20 bg-muted/20 px-3 py-2 hover:bg-muted/40"
                            @mouseenter="hoveredCityId = city.id"
                            @mouseleave="hoveredCityId = null"
                            @click="store.setCityRecruitment(props.game.uuid, city.id, !(city.recruitmentEnabled ?? true))"
                        >
                            <span class="text-[0.7rem] font-bold text-foreground">
                                {{ city.markerType === 'capital' ? '★ Capital' : '⬠ Outpost' }}
                            </span>
                            <span
                                class="flex size-5 items-center justify-center border-2 text-[0.6rem] font-bold"
                                :class="(city.recruitmentEnabled ?? true) ? 'border-wod-green-dk text-wod-green-dk' : 'border-destructive text-destructive'"
                                :title="(city.recruitmentEnabled ?? true) ? 'Recruitment on - click to disable' : 'Recruitment off - click to enable'"
                            >{{ (city.recruitmentEnabled ?? true) ? '✓' : '✕' }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Dev HUD -->
            <template v-if="devHudEligible">
                <div
                    v-if="devHudOpen"
                    ref="devHudEl"
                    class="absolute z-10 max-h-[min(24rem,55vh)] w-[min(22rem,calc(100vw-1.5rem))] overflow-auto wod-panel p-3 font-mono text-[0.65rem]"
                    :style="{ left: devHudPos.x + 'px', top: devHudPos.y + 'px' }"
                    role="complementary"
                    aria-label="Developer diagnostics"
                >
                    <div
                        class="mb-2 flex items-center justify-between gap-2 border-b-2 border-foreground/20 pb-2 cursor-grab active:cursor-grabbing select-none"
                        @mousedown="onDevDragStart"
                    >
                        <span class="font-display font-bold text-foreground">Sim / net</span>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            class="h-7 px-2 text-xs"
                            @click.stop="devHudOpen = false"
                        >
                            ✕
                        </Button>
                    </div>
                    <dl
                        class="grid grid-cols-[minmax(0,7.5rem)_1fr] gap-x-2 gap-y-1.5 text-muted-foreground"
                    >
                        <dt class="text-foreground/80">worldTick</dt>
                        <dd>{{ store.worldTick }}</dd>
                        <dt class="text-foreground/80">stall polls</dt>
                        <dd>
                            {{ simulationStallPolls }} /
                            {{ SIMULATION_STALL_POLL_THRESHOLD }}
                        </dd>
                        <dt class="text-foreground/80">snapshot poll</dt>
                        <dd>{{ MATCH_SNAPSHOT_POLL_MS }} ms</dd>
                        <dt class="text-foreground/80">Echo</dt>
                        <dd>{{ store.connected ? 'connected' : 'offline' }}</dd>
                        <dt class="text-foreground/80">initialized</dt>
                        <dd>{{ store.initialized }}</dd>
                        <dt class="text-foreground/80">matchEnded</dt>
                        <dd>{{ store.matchEnded }}</dd>
                        <dt class="text-foreground/80">game</dt>
                        <dd class="break-all">{{ game.uuid }}</dd>
                        <dt class="text-foreground/80">broadcast</dt>
                        <dd class="break-all">
                            {{ broadcastConnection ?? '-' }}
                        </dd>
                        <dt class="text-foreground/80">snapshot</dt>
                        <dd class="break-all">{{ snapshotPath }}</dd>
                        <dt class="text-foreground/80">snap Δtick</dt>
                        <dd>
                            {{
                                store.devDiagnostics
                                    .lastWorldTickDeltaViaSnapshot ?? '-'
                            }}
                        </dd>
                        <dt class="text-foreground/80">snap RTT</dt>
                        <dd>
                            {{
                                store.devDiagnostics.lastSnapshotDurationMs !==
                                null
                                    ? `${store.devDiagnostics.lastSnapshotDurationMs} ms`
                                    : '-'
                            }}
                        </dd>
                        <dt class="text-foreground/80">snap HTTP</dt>
                        <dd>
                            {{
                                store.devDiagnostics.lastSnapshotHttpStatus ??
                                '-'
                            }}
                        </dd>
                        <dt class="text-foreground/80">snap @</dt>
                        <dd>
                            {{
                                formatTickTime(
                                    store.devDiagnostics.lastSnapshotAt,
                                )
                            }}
                        </dd>
                        <dt class="text-foreground/80">snap err</dt>
                        <dd class="break-words text-destructive">
                            {{ store.devDiagnostics.lastSnapshotError ?? '-' }}
                        </dd>
                        <dt class="text-foreground/80">echo Δtick</dt>
                        <dd>
                            {{
                                store.devDiagnostics.lastEchoWorldTickDelta ??
                                '-'
                            }}
                        </dd>
                        <dt class="text-foreground/80">echo @</dt>
                        <dd>
                            {{
                                formatTickTime(
                                    store.devDiagnostics.lastEchoPushAt,
                                )
                            }}
                        </dd>
                        <dt class="text-foreground/80">Vite</dt>
                        <dd>{{ viteMode }}</dd>
                        <dt class="text-foreground/80">appDebug</dt>
                        <dd>{{ page.props.appDebug === true }}</dd>
                    </dl>
                    <p
                        class="mt-2 border-t-2 border-foreground/20 pt-2 text-[0.6rem] leading-snug text-muted-foreground"
                    >
                        Open with
                        <code class="bg-muted px-1 text-foreground">?dev=1</code>
                        or local Vite / APP_DEBUG.
                    </p>
                </div>
            </template>
        </div>

        <!-- Thin controls hint bar -->
        <footer
            class="wod-bar-bottom shrink-0 px-3 py-1.5 text-center text-[0.6rem] text-muted-foreground sm:px-4 sm:text-left"
        >
            <template v-if="!spectatorMode">
                <span class="hidden sm:inline">
                    Drag to plan paths · Right-click to pan · Scroll to zoom ·
                    Space to execute · C to clear
                </span>
                <span class="sm:hidden"
                    >Tap-drag to plan · Two-finger pan · Pinch zoom</span
                >
            </template>
        </footer>
    </div>

    <!-- Surrender confirmation dialog -->
    <Dialog v-model:open="surrenderDialogOpen">
        <DialogContent class="sm:max-w-sm">
            <DialogHeader>
                <DialogTitle>Surrender?</DialogTitle>
                <DialogDescription>
                    Your troops will be removed and all your cities will
                    become neutral. This cannot be undone.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter class="gap-2 sm:gap-5">
                <Button
                    variant="outline"
                    :disabled="surrendering"
                    @click="surrenderDialogOpen = false"
                >
                    Cancel
                </Button>
                <Button
                    variant="destructive"
                    :disabled="surrendering"
                    @click="confirmSurrender"
                >
                    {{ surrendering ? 'Surrendering…' : 'Confirm Surrender' }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
