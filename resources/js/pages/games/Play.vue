<script setup lang="ts">
import { Head, Link, usePage } from '@inertiajs/vue3';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import GameCanvas from '@/components/game/GameCanvas.vue';
import ThemeToggle from '@/components/ThemeToggle.vue';
import { Button } from '@/components/ui/button';
import { index as lobbies } from '@/routes/lobbies';
import { useGameStore } from '@/stores/gameStore';

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

const spectatePollTimer = ref<ReturnType<typeof setInterval> | null>(null);
const participatePollTimer = ref<ReturnType<typeof setInterval> | null>(null);
const showSlowLoadHint = ref(false);
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
                class="flex flex-wrap items-center gap-1.5 sm:gap-2"
            >
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
                    @click="store.submitOrders(game.uuid)"
                >
                    Execute (Space)
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    class="min-w-0 flex-1 sm:flex-none"
                    @click="store.togglePause(game.uuid)"
                >
                    Pause (P)
                </Button>
            </div>
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
            <GameCanvas :read-only="spectatorMode" />
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
