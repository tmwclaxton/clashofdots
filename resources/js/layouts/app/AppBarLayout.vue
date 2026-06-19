<script setup lang="ts">
import { Link, router, usePage } from '@inertiajs/vue3';
import { useMediaQuery } from '@vueuse/core';
import { Swords, Users } from 'lucide-vue-next';
import { computed, onBeforeUnmount, onMounted, watch } from 'vue';
import AppBottomBar from '@/components/AppBottomBar.vue';
import AppContent from '@/components/AppContent.vue';
import AppShell from '@/components/AppShell.vue';
import AppToast from '@/components/AppToast.vue';
import AppTopBar from '@/components/AppTopBar.vue';
import { play, show } from '@/routes/games';
import { useRedirectStore } from '@/stores/redirectStore';

const page = usePage<{ activeGame: { uuid: string; status: string } | null }>();
const isLargeScreen = useMediaQuery('(min-width: 1024px)');
const redirectStore = useRedirectStore();

const isMapBuilder = computed(() => page.component === 'MapBuilder');
const useMapBuilderChrome = computed(
    () => isMapBuilder.value && isLargeScreen.value,
);

const contentClass = computed(() =>
    useMapBuilderChrome.value
        ? 'mx-auto flex h-full min-h-0 w-full max-w-none flex-1 flex-col overflow-hidden px-2 py-2'
        : 'mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-5 sm:px-6 sm:py-8',
);

/** When away from the lobby page, poll for active game status changes and redirect if game starts. */
let lobbyPoll: ReturnType<typeof setInterval> | null = null;

function isOnGameShowPage(): boolean {
    return page.component === 'games/Show';
}

function isOnPlayPage(): boolean {
    return page.component === 'games/Play';
}

/** Returns true if the user is currently on the play page for `gameUuid`. */
function isOnPlayPageFor(gameUuid: string): boolean {
    return isOnPlayPage() && page.props.activeGame?.uuid === gameUuid;
}

function startLobbyPoll(): void {
    if (lobbyPoll !== null) {
        return;
    }

    lobbyPoll = setInterval(() => {
        // Show.vue polls its own 'game' prop; don't double-poll there.
        if (isOnGameShowPage() || isOnPlayPage()) {
            return;
        }

        if (page.props.activeGame?.status === 'lobby') {
            router.reload({ only: ['activeGame'] });
        } else {
            clearInterval(lobbyPoll!);
            lobbyPoll = null;
        }
    }, 3000);
}

/**
 * Sends the user to the battlefield for the given game, once per game UUID.
 * After the first redirect they are free to leave the play page; we won't
 * yank them back because the UUID is recorded in the redirect store.
 */
function redirectToBattlefield(gameUuid: string): void {
    if (redirectStore.hasRedirected(gameUuid) || isOnPlayPageFor(gameUuid)) {
        return;
    }

    redirectStore.markRedirected(gameUuid);
    router.visit(play(gameUuid).url);
}

watch(
    () => page.props.activeGame,
    (ag) => {
        if (!ag) {
            if (lobbyPoll !== null) {
                clearInterval(lobbyPoll);
                lobbyPoll = null;
            }

            return;
        }

        if (ag.status === 'playing') {
            redirectToBattlefield(ag.uuid);
        } else if (ag.status === 'lobby' && !isOnGameShowPage()) {
            startLobbyPoll();
        }
    },
);

onMounted(() => {
    const ag = page.props.activeGame;

    if (!ag) {
        return;
    }

    if (ag.status === 'playing') {
        redirectToBattlefield(ag.uuid);
    } else if (ag.status === 'lobby' && !isOnGameShowPage()) {
        startLobbyPoll();
    }
});

onBeforeUnmount(() => {
    if (lobbyPoll !== null) {
        clearInterval(lobbyPoll);
        lobbyPoll = null;
    }
});

// ── Active-game banner ────────────────────────────────────────────────────

const activeGameHref = computed(() => {
    const ag = page.props.activeGame;

    if (!ag) {
        return null;
    }

    if (ag.status === 'lobby') {
        return show(ag.uuid).url;
    }

    if (ag.status === 'playing') {
        return play(ag.uuid).url;
    }

    return null;
});

const showBanner = computed(() => {
    const ag = page.props.activeGame;

    if (!ag || !activeGameHref.value) {
        return false;
    }

    // Don't show the banner when already on the relevant page.
    if (ag.status === 'lobby' && isOnGameShowPage()) {
        return false;
    }

    if (ag.status === 'playing' && isOnPlayPage()) {
        return false;
    }

    return true;
});
</script>

<template>
    <AppShell variant="header">
        <div
            :class="
                useMapBuilderChrome
                    ? 'wod-page wod-page-map-builder flex h-svh max-h-svh min-h-0 flex-col overflow-hidden'
                    : 'wod-page flex min-h-svh min-w-0 flex-col overflow-x-hidden'
            "
        >
            <AppTopBar />

            <!-- Active-game return banner -->
            <div
                v-if="showBanner && activeGameHref"
                class="sticky top-0 z-40 border-b border-foreground/15 bg-wod-cream px-4 py-2 sm:px-6"
            >
                <div class="mx-auto flex max-w-6xl items-center justify-between gap-3">
                    <div class="flex items-center gap-2 text-sm font-semibold">
                        <component
                            :is="page.props.activeGame?.status === 'playing' ? Swords : Users"
                            class="size-4 shrink-0"
                            aria-hidden="true"
                        />
                        <span>
                            {{
                                page.props.activeGame?.status === 'playing'
                                    ? 'Battle in progress'
                                    : 'Waiting in lobby'
                            }}
                        </span>
                    </div>
                    <Link
                        :href="activeGameHref"
                        class="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-foreground/30 bg-background px-3 py-1 text-xs font-semibold transition-colors hover:bg-muted"
                    >
                        {{
                            page.props.activeGame?.status === 'playing'
                                ? 'Return to battlefield'
                                : 'Return to lobby'
                        }}
                    </Link>
                </div>
            </div>

            <AppContent variant="header" :class="contentClass">
                <slot />
            </AppContent>
            <AppBottomBar />
            <AppToast />
        </div>
    </AppShell>
</template>
