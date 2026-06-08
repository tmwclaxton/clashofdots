<script setup lang="ts">
import { Head, Link, usePage } from '@inertiajs/vue3';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import GameCanvas from '@/components/game/GameCanvas.vue';
import ThemeToggle from '@/components/ThemeToggle.vue';
import { Button } from '@/components/ui/button';
import { index as lobbies } from '@/routes/lobbies';
import { useGameStore } from '@/stores/gameStore';
import { useToastStore } from '@/stores/toastStore';

/** Mirrors {@see GameConstants::ECONOMY_RECRUIT_COST} */
const RECRUIT_COST = 45;

/** Mirrors {@see GameConstants::ECONOMY_MAX_ARMY_PER_PLAYER} */
const MAX_ARMY = 24;

/** Mirrors {@see GameConstants::TICK_RATE} — used only for credits/sec hint in the HUD. */
const TICK_RATE = 30;

type GamePayload = {
    uuid: string;
    code: string;
    maxPlayers: number;
    slot: number;
    color: string;
    players: Array<{ slot: number; name: string; color: string }>;
};

const props = withDefaults(
    defineProps<{
        game: GamePayload;
        snapshotUrl: string;
        spectatorMode?: boolean;
    }>(),
    {
        spectatorMode: false,
    },
);

const page = usePage();
const store = useGameStore();
const toast = useToastStore();

/** How often we pull JSON snapshots during a live match (backs up Reverb / shows tick progress). */
const MATCH_SNAPSHOT_POLL_MS = 1800;

/** Consecutive polls with no `worldTick` advance ⇒ likely tick worker missing. */
const SIMULATION_STALL_POLL_THRESHOLD = 5;

const spectatePollTimer = ref<ReturnType<typeof setInterval> | null>(null);
const participatePollTimer = ref<ReturnType<typeof setInterval> | null>(null);
const participateLivePollTimer = ref<ReturnType<typeof setInterval> | null>(null);
const showSlowLoadHint = ref(false);
const lastCityOwners = ref<Record<number, number | null>>({});
const simulationStallPolls = ref(0);
let slowLoadHintTimer: ReturnType<typeof setTimeout> | null = null;

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

    if (store.matchEnded && store.winnerSlot === null && store.winnerUserId === null) {
        return store.winnerName ?? 'Match ended';
    }

    if (store.winnerSlot !== null && store.winnerSlot === props.game.slot) {
        return 'Victory!';
    }

    if (store.winnerUserId !== null && store.winnerUserId === page.props.auth.user?.id) {
        return 'Victory!';
    }

    return 'Defeat';
});

const myEconomy = computed(() => store.economy?.[props.game.slot] ?? null);

const myCredits = computed(() => myEconomy.value?.credits ?? null);

const incomePerTick = computed(() => myEconomy.value?.incomePerTick ?? 0);

const incomePerSecondHint = computed(
    () => Math.round((incomePerTick.value / TICK_RATE) * 100) / 100,
);

const showSimulationStallHint = computed(
    () =>
        !props.spectatorMode
        && store.initialized
        && !store.matchEnded
        && simulationStallPolls.value >= SIMULATION_STALL_POLL_THRESHOLD,
);

const myArmyCount = computed(() => {
    const st = store.latestState;

    if (!st) {
        return 0;
    }

    return st.troops.filter((t) => t.ownerSlot === props.game.slot).length;
});

const recruitDisabled = computed(() => {
    if (props.spectatorMode || !store.initialized) {
        return true;
    }

    const c = myCredits.value;

    if (c === null) {
        return true;
    }

    return c < RECRUIT_COST || myArmyCount.value >= MAX_ARMY;
});

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
    if (props.spectatorMode) {
        store.disconnect();
        void store.pullSnapshot(props.snapshotUrl, { treat404AsEnded: true });
        spectatePollTimer.value = setInterval(() => {
            void store.pullSnapshot(props.snapshotUrl, { treat404AsEnded: true });
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

    <div class="flex h-svh min-h-0 flex-col overflow-hidden bg-background text-foreground">
        <header
            class="wod-bar-top relative flex shrink-0 flex-col gap-2 px-3 py-2 sm:gap-3 sm:px-4"
        >
            <div class="flex min-w-0 items-start justify-between gap-2">
                <div class="min-w-0">
                    <p class="font-display text-xs font-bold text-foreground">
                        Clash of Dots
                    </p>
                    <p class="truncate text-sm font-bold tracking-widest text-foreground">
                        {{ game.code }}
                        <span
                            v-if="spectatorMode"
                            class="ml-1 text-xs font-normal text-muted-foreground sm:ml-2"
                        >
                            (spectating)
                        </span>
                    </p>
                </div>
                <div class="flex shrink-0 items-center gap-1.5 sm:gap-2">
                    <ThemeToggle />
                    <Link :href="lobbies().url">
                        <Button size="sm" variant="ghost">Exit</Button>
                    </Link>
                </div>
            </div>

            <div
                class="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden"
            >
                <span
                    v-for="player in [...game.players].sort((a, b) => a.slot - b.slot)"
                    :key="player.slot"
                    class="wod-chip shrink-0"
                >
                    <span
                        class="wod-swatch !size-2.5 rounded-full"
                        :style="{ backgroundColor: player.color }"
                    />
                    {{ player.name }}
                </span>
            </div>

            <div
                v-if="!spectatorMode"
                class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
            >
                <span
                    v-if="myCredits !== null"
                    class="wod-chip shrink-0 font-mono text-foreground"
                    title="Bank balance and passive income (per simulation tick)."
                >
                    {{ myCredits }} credits
                    <span v-if="incomePerTick > 0" class="text-muted-foreground">
                        · +{{ incomePerTick }}/tick (~{{ incomePerSecondHint }}/s)
                    </span>
                </span>
                <span class="hidden text-[0.65rem] sm:inline" title="Map markers">
                    Square = capital · pentagon = flag
                </span>
            </div>

            <div
                v-if="!spectatorMode"
                class="flex flex-wrap items-center gap-1.5 sm:gap-2"
            >
                <Button
                    size="sm"
                    variant="secondary"
                    class="min-w-0 flex-1 sm:flex-none"
                    :disabled="recruitDisabled"
                    :title="
                        recruitDisabled
                            ? myArmyCount >= MAX_ARMY
                                ? 'Army at maximum size.'
                                : (myCredits ?? 0) < RECRUIT_COST
                                  ? `Need ${RECRUIT_COST} credits.`
                                  : 'Recruit requires controlling your capital.'
                            : `Spend ${RECRUIT_COST} credits to train one infantry at your capital.`
                    "
                    @click="store.recruitInfantry(game.uuid)"
                >
                    Recruit ({{ RECRUIT_COST }})
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    class="min-w-0 flex-1 sm:flex-none"
                    @click="store.clearDrafts()"
                >
                    Clear (C)
                </Button>
                <Button
                    size="sm"
                    class="min-w-0 flex-1 sm:flex-none"
                    @click="store.submitOrders(game.uuid, { snapshotFetchUrl: snapshotUrl })"
                >
                    Execute (Space)
                </Button>
            </div>

            <div
                v-if="showSimulationStallHint"
                class="rounded-md border border-destructive/50 bg-destructive/10 px-2 py-1.5 text-[0.7rem] text-destructive"
                role="alert"
            >
                World time is not advancing. If you use Sail, run
                <code class="rounded bg-muted px-1 py-px font-mono text-[0.65rem] text-foreground">
                    ./vendor/bin/sail ps
                </code>
                and ensure
                <code class="rounded bg-muted px-1 py-px font-mono text-[0.65rem] text-foreground">game-tick</code>
                is Up. Otherwise start
                <code class="rounded bg-muted px-1 py-px font-mono text-[0.65rem] text-foreground">
                    php artisan game:tick --daemon
                </code>
                or
                <code class="rounded bg-muted px-1 py-px font-mono text-[0.65rem] text-foreground">
                    composer run dev
                </code>
                (~{{ TICK_RATE }}&nbsp;Hz). Reloading this page re-registers the match if Redis lost the
                active-game list.
            </div>
            <p
                v-if="!spectatorMode"
                class="text-[0.65rem] leading-snug text-muted-foreground"
            >
                The map also refreshes over HTTP every few seconds. Live pushes need Reverb +
                <code class="rounded bg-muted px-1 py-px font-mono text-[0.6rem]">VITE_REVERB_*</code>
                . Units advance only while
                <code class="rounded bg-muted px-1 py-px font-mono text-[0.6rem]">php artisan game:tick --daemon</code>
                runs (included in
                <code class="rounded bg-muted px-1 py-px font-mono text-[0.6rem]">composer run dev</code>
                ).
            </p>
            <p
                v-else
                class="text-xs text-muted-foreground"
            >
                Watching via timed refresh · Commander 1 fog-of-war view
            </p>
        </header>

        <div class="relative min-h-0 flex-1 border-y-2 border-foreground">
            <div
                v-if="spectatorMode && !store.initialized && !store.matchEnded"
                class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/90 text-center"
            >
                <p class="text-sm font-semibold text-muted-foreground">
                    Loading battlefield…
                </p>
            </div>
            <div
                v-if="
                    !spectatorMode &&
                    !store.initialized &&
                    !store.matchEnded &&
                    store.winnerUserId === null &&
                    store.winnerSlot === null
                "
                class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/90 text-center"
            >
                <p class="text-sm font-semibold text-muted-foreground">
                    Loading battlefield…
                </p>
                <p class="max-w-sm text-xs text-muted-foreground">
                    Map data loads over HTTP even without websockets. Reverb is only
                    needed for live pushes between players.
                </p>
                <p
                    v-if="showSlowLoadHint && !store.initialized"
                    class="max-w-sm text-xs text-muted-foreground"
                >
                    Still stuck? Confirm the match is running, then refresh. If
                    websockets never connect, run
                    <code class="rounded bg-muted px-1 font-mono text-[0.7rem]">
                        php artisan reverb:start
                    </code>
                    and rebuild the frontend so
                    <code class="rounded bg-muted px-1 font-mono text-[0.7rem]">
                        VITE_REVERB_*
                    </code>
                    matches your
                    <code class="rounded bg-muted px-1 font-mono text-[0.7rem]">
                        .env
                    </code>
                    .
                </p>
            </div>
            <GameCanvas
                :read-only="spectatorMode"
                :snapshot-fetch-url="spectatorMode ? '' : snapshotUrl"
            />
            <div
                v-if="
                    !spectatorMode &&
                    (store.matchEnded ||
                        store.winnerUserId !== null ||
                        store.winnerSlot !== null)
                "
                class="absolute inset-0 flex items-center justify-center bg-foreground/40"
            >
                <div class="wod-panel px-5 py-5 text-center sm:px-8 sm:py-6">
                    <p class="font-display text-2xl font-bold">
                        {{ victoryTitle }}
                    </p>
                    <Link :href="lobbies().url" class="mt-4 inline-block">
                        <Button>Return to lobbies</Button>
                    </Link>
                </div>
            </div>
            <div
                v-else-if="spectatorMode && store.matchEnded"
                class="absolute inset-0 flex items-center justify-center bg-foreground/40"
            >
                <div class="wod-panel px-5 py-5 text-center sm:px-8 sm:py-6">
                    <p class="font-display text-2xl font-bold">Match ended</p>
                    <p class="mt-2 text-sm text-muted-foreground">
                        The live state is no longer available.
                    </p>
                    <Link :href="lobbies().url" class="mt-4 inline-block">
                        <Button>Return to lobbies</Button>
                    </Link>
                </div>
            </div>
        </div>

        <footer class="wod-bar-bottom shrink-0 px-3 py-2 text-center text-[0.65rem] font-medium leading-snug sm:px-4 sm:text-left sm:text-xs">
            <template v-if="spectatorMode">
                Spectating · slot 1 vision · auto-refresh
            </template>
            <template v-else>
                <span class="hidden sm:inline">
                    Left-click drag to plan paths · Right-click drag to pan · Scroll to zoom
                </span>
                <span class="sm:hidden">
                    Drag to plan · Two-finger pan · Pinch to zoom
                </span>
            </template>
        </footer>
    </div>
</template>
