<script setup lang="ts">
import { Head, Link, router, useForm, usePage } from '@inertiajs/vue3';
import { Loader2, Lock, Map, Tag, Users, Zap } from 'lucide-vue-next';
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import Heading from '@/components/Heading.vue';
import InputError from '@/components/InputError.vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login as loginRoute } from '@/routes';
import { joinCode, leave, show } from '@/routes/games';
import { explore as mapsExplore } from '@/routes/maps';
import { update as updatePlayerTag } from '@/routes/player-tag';
import {
    join as qsJoin,
    leave as qsLeave,
    status as qsStatus,
} from '@/routes/quick-start';

type Lobby = {
    uuid: string;
    code: string;
    status: string;
    maxPlayers: number;
    playerCount: number;
    isHost: boolean;
    isParticipant: boolean;
    canStart: boolean;
    hostName: string;
    players: Array<{ slot: number; name: string; color: string }>;
};

type QsStatus = {
    status: 'none' | 'queued' | 'matched';
    queueSize: number;
    gameUuid: string | null;
};

const props = defineProps<{
    lobbies: Lobby[] | undefined;
    playerTag: string | null;
}>();

const page = usePage();

let lobbiesPollTimer: ReturnType<typeof setInterval> | null = null;

function startLobbiesPoll(): void {
    if (lobbiesPollTimer !== null) {
        return;
    }

    lobbiesPollTimer = setInterval(() => {
        router.reload({ only: ['lobbies'] });
    }, 2000);
}

function stopLobbiesPoll(): void {
    if (lobbiesPollTimer !== null) {
        clearInterval(lobbiesPollTimer);
        lobbiesPollTimer = null;
    }
}

const playerTagForm = useForm({
    player_tag: props.playerTag ?? '',
});

function savePlayerTag() {
    playerTagForm.patch(updatePlayerTag().url);
}

const joinForm = useForm({
    code: '',
});

const MIN_SKELETON_MS = 800;
const lobbiesReady = ref(false);
const resolvedLobbies = shallowRef<Lobby[] | undefined>(undefined);

const pageLoadedAt = performance.now();

watch(
    () => props.lobbies,
    (incoming) => {
        if (incoming === undefined) {
            return;
        }

        if (lobbiesReady.value) {
            // Subsequent poll updates — apply immediately.
            resolvedLobbies.value = incoming;
            return;
        }

        const elapsed = performance.now() - pageLoadedAt;
        const remaining = Math.max(0, MIN_SKELETON_MS - elapsed);

        setTimeout(() => {
            resolvedLobbies.value = incoming;
            lobbiesReady.value = true;
        }, remaining);
    },
    { immediate: true },
);

const myLobby = computed(
    () => resolvedLobbies.value?.find((l) => l.isParticipant) ?? null,
);
const otherLobbies = computed(() =>
    resolvedLobbies.value?.filter((l) => !l.isParticipant) ?? [],
);

function leaveLobby(uuid: string) {
    router.delete(leave(uuid).url);
}

function joinLobby() {
    joinForm.post(joinCode().url);
}

// ── Quick Start ──────────────────────────────────────────────────────────────

const qsState = ref<QsStatus>({ status: 'none', queueSize: 0, gameUuid: null });
const qsLoading = ref(false);
let qsPollTimer: ReturnType<typeof setInterval> | null = null;
let qsIdlePollTimer: ReturnType<typeof setInterval> | null = null;

function startQsPoll() {
    if (qsPollTimer !== null) {
        return;
    }

    qsPollTimer = setInterval(async () => {
        try {
            const res = await fetch(qsStatus().url, {
                headers: { Accept: 'application/json' },
            });

            if (!res.ok) {
                return;
            }

            const data: QsStatus = await res.json();
            qsState.value = data;

            if (data.status === 'matched' && data.gameUuid) {
                stopQsPoll();
                router.visit(show(data.gameUuid).url);
            } else if (data.status === 'none') {
                stopQsPoll();
            }
        } catch {
            // network blip - keep polling
        }
    }, 2000);
}

function stopQsPoll() {
    if (qsPollTimer !== null) {
        clearInterval(qsPollTimer);
        qsPollTimer = null;
    }
}

async function fetchQueueSize(): Promise<void> {
    try {
        const res = await fetch(qsStatus().url, {
            headers: { Accept: 'application/json' },
        });

        if (!res.ok) {
            return;
        }

        const data: QsStatus = await res.json();

        if (qsState.value.status === 'none') {
            qsState.value = { ...qsState.value, queueSize: data.queueSize };
        }
    } catch {
        // network blip - ignore
    }
}

function startQsIdlePoll(): void {
    if (qsIdlePollTimer !== null) {
        return;
    }

    void fetchQueueSize();
    qsIdlePollTimer = setInterval(fetchQueueSize, 5000);
}

function stopQsIdlePoll(): void {
    if (qsIdlePollTimer !== null) {
        clearInterval(qsIdlePollTimer);
        qsIdlePollTimer = null;
    }
}

async function joinQuickStart() {
    qsLoading.value = true;
    stopQsIdlePoll();

    try {
        const res = await fetch(qsJoin().url, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-XSRF-TOKEN': decodeURIComponent(
                    document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
                ),
            },
        });

        if (!res.ok) {
            startQsIdlePoll();

            return;
        }

        const data: QsStatus = await res.json();
        qsState.value = data;

        if (data.status === 'matched' && data.gameUuid) {
            router.visit(show(data.gameUuid).url);
        } else if (data.status === 'queued') {
            startQsPoll();
        } else {
            startQsIdlePoll();
        }
    } finally {
        qsLoading.value = false;
    }
}

async function leaveQuickStart() {
    stopQsPoll();
    await fetch(qsLeave().url, {
        method: 'DELETE',
        headers: {
            Accept: 'application/json',
            'X-XSRF-TOKEN': decodeURIComponent(
                document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
            ),
        },
    });
    qsState.value = { status: 'none', queueSize: 0, gameUuid: null };
    startQsIdlePoll();
}

watch(lobbiesReady, (ready) => {
    if (ready) {
        startLobbiesPoll();
    }
}, { immediate: true });

onMounted(() => {
    startQsIdlePoll();
});

onBeforeUnmount(() => {
    stopLobbiesPoll();
    stopQsPoll();
    stopQsIdlePoll();
});
</script>

<template>
    <Head title="Lobbies" />

    <div class="flex flex-col gap-8">
        <Heading
            title="Lobby Overview"
            description="Pick a published map - lobby size matches the map’s team count. Everyone must join before the host can start."
            class="!mb-0"
        />

        <!-- Player tag -->
        <div
            v-if="page.props.auth.user"
            class="wod-panel flex flex-col gap-3 px-4 py-2.5 sm:flex-row sm:items-center sm:gap-4"
        >
            <div class="flex items-center gap-2 sm:shrink-0">
                <Tag class="size-4 text-muted-foreground" aria-hidden="true" />
                <span class="font-bold">Your player tag</span>
            </div>
            <div class="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                <div class="flex-1 space-y-1">
                    <Input
                        v-model="playerTagForm.player_tag"
                        maxlength="50"
                        placeholder="Commander#1234"
                        class="w-full sm:max-w-xs"
                        @keydown.enter="savePlayerTag"
                    />
                    <InputError :message="playerTagForm.errors.player_tag" />
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    :disabled="
                        playerTagForm.processing || !playerTagForm.player_tag
                    "
                    class="shrink-0"
                    @click="savePlayerTag"
                >
                    {{
                        playerTagForm.recentlySuccessful ? 'Saved!' : 'Save tag'
                    }}
                </Button>
            </div>
        </div>

        <!-- Your current lobby -->
        <div v-if="myLobby" class="space-y-3">
            <div class="flex items-center gap-2">
                <div class="wod-swatch bg-wod-yellow" aria-hidden="true" />
                <h2 class="font-bold">Your lobby</h2>
            </div>
            <div
                class="wod-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
                <div class="min-w-0">
                    <div class="flex items-center gap-2">
                        <span class="font-bold tracking-widest">{{
                            myLobby.code
                        }}</span>
                        <Badge
                            variant="outline"
                            class="border-foreground bg-wod-green-lt"
                        >
                            {{ myLobby.playerCount }}/{{ myLobby.maxPlayers }}
                        </Badge>
                        <Badge
                            v-if="myLobby.isHost"
                            variant="outline"
                            class="border-foreground"
                        >
                            Host
                        </Badge>
                    </div>
                    <p class="text-sm text-muted-foreground">
                        Host: {{ myLobby.hostName }}
                    </p>
                </div>
                <div class="flex w-full gap-2 sm:w-auto">
                    <Button
                        variant="destructive"
                        class="flex-1 sm:flex-none"
                        @click="leaveLobby(myLobby.uuid)"
                    >
                        Leave
                    </Button>
                    <Link
                        :href="show(myLobby.uuid).url"
                        class="flex-1 sm:flex-none"
                    >
                        <Button variant="outline" class="w-full">View</Button>
                    </Link>
                </div>
            </div>
        </div>

        <!-- Quick Start: queued / matched state (shown when not idle) -->
        <div v-if="!myLobby && qsState.status !== 'none'" class="wod-panel p-5">
            <div class="mb-3 flex items-center gap-2">
                <div class="wod-swatch bg-wod-yellow" aria-hidden="true" />
                <h2 class="font-bold">Quick Start</h2>
            </div>
            <template v-if="qsState.status === 'queued'">
                <div class="mb-4 flex items-center gap-3">
                    <Loader2
                        class="h-5 w-5 animate-spin text-muted-foreground"
                    />
                    <div>
                        <p class="text-sm font-semibold">Finding you a game…</p>
                        <p class="text-xs text-muted-foreground">
                            {{ qsState.queueSize }}
                            {{ qsState.queueSize === 1 ? 'person' : 'people' }}
                            in the pool
                        </p>
                    </div>
                </div>
                <Button variant="outline" size="sm" @click="leaveQuickStart">
                    Cancel
                </Button>
            </template>
            <template v-else-if="qsState.status === 'matched'">
                <p class="text-sm font-semibold text-green-600">
                    Match found - redirecting…
                </p>
            </template>
        </div>

        <!-- Action panels: Create lobby (auth) · Join by code · Quick Start -->
        <div
            v-if="!myLobby && qsState.status === 'none'"
            class="grid gap-4 lg:grid-cols-3"
        >
            <div class="wod-panel relative flex flex-col gap-4 p-5">
                <!-- Frosted glass overlay for guests -->
                <div
                    v-if="!page.props.auth.user"
                    class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-[inherit] bg-background/70 backdrop-blur-sm"
                >
                    <div
                        class="flex flex-col items-center gap-3 p-4 text-center"
                    >
                        <div
                            class="flex size-12 items-center justify-center rounded-lg border-2 border-foreground bg-muted/40"
                            aria-hidden="true"
                        >
                            <Lock class="size-6 text-muted-foreground" />
                        </div>
                        <div class="space-y-1">
                            <p class="font-bold">Log in to create a game</p>
                            <p class="text-xs text-muted-foreground">
                                Host your own lobby and invite friends.
                            </p>
                        </div>
                        <Button as-child size="sm" class="mt-1">
                            <Link :href="loginRoute().url">Log in</Link>
                        </Button>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <div class="wod-swatch bg-wod-red" aria-hidden="true" />
                    <h2 class="font-bold">Create lobby</h2>
                </div>
                <p class="flex-1 text-sm text-muted-foreground">
                    Browse published maps, pick one you like, and start a lobby
                    directly from the map card.
                </p>
                <Button as-child>
                    <Link :href="mapsExplore().url">
                        <Map class="mr-2 h-4 w-4" />
                        Explore maps
                    </Link>
                </Button>
            </div>

            <!-- Quick Start: idle state -->
            <div class="wod-panel flex flex-col gap-4 p-5">
                <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                        <div
                            class="wod-swatch bg-wod-yellow"
                            aria-hidden="true"
                        />
                        <h2 class="font-bold">Quick Start</h2>
                    </div>
                    <span
                        v-if="qsState.queueSize > 0"
                        class="inline-flex items-center gap-1 rounded-full border border-foreground/20 bg-muted/60 px-2 py-0.5 text-xs font-semibold text-muted-foreground tabular-nums"
                    >
                        <Users class="size-3 shrink-0" aria-hidden="true" />
                        {{ qsState.queueSize }} waiting
                    </span>
                </div>
                <p class="flex-1 text-sm text-muted-foreground">
                    Don't mind what you play? Join the pool and we'll drop you
                    straight into a lobby the moment there's a fit - no browsing
                    required.
                </p>
                <Button :disabled="qsLoading" @click="joinQuickStart">
                    <Zap class="mr-2 h-4 w-4" />
                    Quick Start
                </Button>
            </div>

            <div class="wod-panel flex flex-col gap-4 p-5">
                <div class="flex items-center gap-2">
                    <div class="wod-swatch bg-wod-blue" aria-hidden="true" />
                    <h2 class="font-bold">Join by code</h2>
                </div>
                <div class="flex-1 space-y-2">
                    <Label for="code">Lobby code</Label>
                    <Input
                        id="code"
                        v-model="joinForm.code"
                        maxlength="6"
                        class="tracking-widest uppercase"
                        placeholder="ABC123"
                    />
                    <InputError :message="joinForm.errors.code" />
                </div>
                <Button
                    variant="outline"
                    :disabled="joinForm.processing"
                    @click="joinLobby"
                >
                    Join lobby
                </Button>
            </div>
        </div>

        <div class="space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                    <div
                        class="wod-swatch bg-wod-green-lt"
                        aria-hidden="true"
                    />
                    <h2 class="font-bold">Open lobbies</h2>
                </div>
                <div class="wod-chip" role="status">
                    <span
                        class="relative flex size-2 shrink-0"
                        aria-hidden="true"
                    >
                        <span
                            class="absolute inline-flex size-full animate-ping rounded-full bg-wod-green-dk opacity-50"
                        />
                        <span
                            class="relative inline-flex size-2 rounded-full border border-foreground bg-wod-green-dk"
                        />
                    </span>
                    <span
                        class="text-xs font-semibold tracking-wide text-wod-green-dk uppercase"
                    >
                        Live
                    </span>
                </div>
            </div>
            <div
                v-if="!lobbiesReady"
                class="space-y-2"
            >
                <div
                    v-for="i in 3"
                    :key="i"
                    class="wod-panel flex animate-pulse flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                    <div class="space-y-2">
                        <div class="h-4 w-32 rounded bg-muted" />
                        <div class="h-3 w-24 rounded bg-muted" />
                    </div>
                    <div class="h-8 w-20 rounded bg-muted" />
                </div>
            </div>
            <div
                v-else-if="otherLobbies.length === 0"
                class="wod-panel-dashed p-8 text-center text-muted-foreground"
            >
                No open lobbies. Create one to get started.
            </div>
            <div
                v-for="lobby in otherLobbies"
                :key="lobby.uuid"
                class="wod-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
                <div class="min-w-0">
                    <div class="flex items-center gap-2">
                        <span class="font-bold tracking-widest">{{
                            lobby.code
                        }}</span>
                        <Badge
                            variant="outline"
                            class="border-foreground bg-wod-green-lt"
                        >
                            {{ lobby.playerCount }}/{{ lobby.maxPlayers }}
                        </Badge>
                    </div>
                    <p class="text-sm text-muted-foreground">
                        Host: {{ lobby.hostName }}
                    </p>
                </div>
                <div class="flex w-full gap-2 sm:w-auto">
                    <Button
                        v-if="lobby.isParticipant"
                        variant="destructive"
                        class="flex-1 sm:flex-none"
                        @click="leaveLobby(lobby.uuid)"
                    >
                        Leave
                    </Button>
                    <Link
                        :href="show(lobby.uuid).url"
                        class="flex-1 sm:flex-none"
                    >
                        <Button variant="outline" class="w-full">View</Button>
                    </Link>
                </div>
            </div>
        </div>
    </div>
</template>
