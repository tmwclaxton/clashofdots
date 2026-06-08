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
        void store.fetchSnapshotIfNeeded(props.snapshotUrl);
        setTimeout(() => {
            void store.fetchSnapshotIfNeeded(props.snapshotUrl);
        }, 2200);
    }
});

onUnmounted(() => {
    if (spectatePollTimer.value !== null) {
        clearInterval(spectatePollTimer.value);
        spectatePollTimer.value = null;
    }
    store.disconnect();
});
</script>

<template>
    <Head title="Battlefield" />

    <div class="flex h-screen flex-col bg-background text-foreground">
        <header
            class="wod-bar-top relative flex shrink-0 items-center justify-between px-4 py-2"
        >
            <div>
                <p class="font-display text-xs font-bold text-foreground">
                    Clash of Dots
                </p>
                <p class="text-sm font-bold tracking-widest text-foreground">
                    {{ game.code }}
                    <span
                        v-if="spectatorMode"
                        class="ml-2 text-xs font-normal text-muted-foreground"
                    >
                        (spectating · slot 1 vision)
                    </span>
                </p>
            </div>
            <div class="flex items-center gap-2">
                <span
                    v-for="player in [...game.players].sort((a, b) => a.slot - b.slot)"
                    :key="player.slot"
                    class="wod-chip"
                >
                    <span
                        class="wod-swatch !size-2.5 rounded-full"
                        :style="{ backgroundColor: player.color }"
                    />
                    {{ player.name }}
                </span>
            </div>
            <div class="flex items-center gap-2">
                <ThemeToggle />
                <template v-if="!spectatorMode">
                    <Button
                        size="sm"
                        variant="outline"
                        @click="store.clearDrafts()"
                    >
                        Clear (C)
                    </Button>
                    <Button size="sm" @click="store.submitOrders(game.uuid)">
                        Execute (Space)
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        @click="store.togglePause(game.uuid)"
                    >
                        Pause (P)
                    </Button>
                </template>
                <Link :href="lobbies().url">
                    <Button size="sm" variant="ghost">Exit</Button>
                </Link>
            </div>
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
                v-if="!spectatorMode && !store.initialized && store.winnerUserId === null && store.winnerSlot === null"
                class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/90 text-center"
            >
                <p class="text-sm font-semibold text-muted-foreground">
                    Connecting to battlefield…
                </p>
                <p
                    v-if="!store.connected"
                    class="max-w-sm text-xs text-muted-foreground"
                >
                    If this hangs, ensure Reverb is running and your `.env` matches
                    `VITE_REVERB_*`.
                </p>
            </div>
            <GameCanvas :read-only="spectatorMode" />
            <div
                v-if="
                    !spectatorMode &&
                    (store.winnerUserId !== null || store.winnerSlot !== null)
                "
                class="absolute inset-0 flex items-center justify-center bg-foreground/40"
            >
                <div class="wod-panel px-8 py-6 text-center">
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
                <div class="wod-panel px-8 py-6 text-center">
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

        <footer class="wod-bar-bottom px-4 py-2 text-xs font-medium">
            <template v-if="spectatorMode">
                Watching via timed refresh · Commander 1 fog-of-war view
            </template>
            <template v-else>
                Left-click drag to plan paths · Right-click drag to pan · Scroll
                to zoom
            </template>
        </footer>
    </div>
</template>
