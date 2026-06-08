<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import { Clock3, Radio } from 'lucide-vue-next';
import Heading from '@/components/Heading.vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { play, spectate } from '@/routes/games';

type Match = {
    uuid: string;
    code: string;
    status: string;
    maxPlayers: number;
    playerCount: number;
    hostName: string;
    startedAt: string | null;
    players: Array<{ slot: number; name: string; color: string }>;
};

type LobbyCard = {
    uuid: string;
    code: string;
    status: string;
    maxPlayers: number;
    playerCount: number;
    hostName: string;
    players: Array<{ slot: number; name: string; color: string }>;
};

const props = withDefaults(
    defineProps<{
        matches: Match[];
        spectatableMatches?: LobbyCard[];
    }>(),
    {
        spectatableMatches: () => [],
    },
);
</script>

<template>
    <Head title="Ongoing Matches" />

    <div class="flex flex-col gap-8">
        <Heading
            title="Ongoing Matches"
            description="Return to battles you are in, or watch other live games (commander 1 view, refreshed periodically)."
        />

        <div
            v-if="matches.length === 0"
            class="wod-panel-dashed p-10 text-center text-muted-foreground"
        >
            <Clock3 class="mx-auto mb-2 size-7 opacity-60" />
            <p class="font-bold">No active battles for you</p>
            <p class="mt-1 text-sm">Join a lobby — your browser keeps a guest session so you can come back here after a disconnect.</p>
        </div>

        <div v-else class="space-y-3">
            <h2 class="font-bold">Your battles</h2>
            <article
                v-for="match in matches"
                :key="match.uuid"
                class="flex flex-col gap-4 wod-panel p-5 sm:flex-row sm:items-center sm:justify-between"
            >
                <div>
                    <div class="flex flex-wrap items-center gap-2">
                        <span class="font-bold tracking-widest">{{
                            match.code
                        }}</span>
                        <Badge
                            variant="outline"
                            class="border-foreground bg-wod-green-lt"
                        >
                            In progress
                        </Badge>
                        <Badge variant="outline">
                            {{ match.playerCount }}/{{ match.maxPlayers }}
                        </Badge>
                    </div>
                    <p class="mt-1 text-sm text-muted-foreground">
                        Host: {{ match.hostName }}
                    </p>
                    <div class="mt-2 flex flex-wrap gap-2">
                        <span
                            v-for="player in match.players"
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
                </div>
                <Link :href="play(match.uuid).url" class="w-full sm:w-auto">
                    <Button class="w-full sm:w-auto">Return to battle</Button>
                </Link>
            </article>
        </div>

        <div v-if="spectatableMatches.length > 0" class="space-y-3">
            <h2 class="flex items-center gap-2 font-bold">
                <Radio class="size-5 opacity-70" />
                Live now
            </h2>
            <p class="text-sm text-muted-foreground">
                Spectating uses the same map state as commander slot 1 (not a global observer view).
            </p>
            <article
                v-for="match in spectatableMatches"
                :key="`spec-${match.uuid}`"
                class="flex flex-col gap-4 wod-panel p-5 sm:flex-row sm:items-center sm:justify-between"
            >
                <div>
                    <div class="flex flex-wrap items-center gap-2">
                        <span class="font-bold tracking-widest">{{ match.code }}</span>
                        <Badge variant="outline">
                            {{ match.playerCount }}/{{ match.maxPlayers }}
                        </Badge>
                    </div>
                    <p class="mt-1 text-sm text-muted-foreground">
                        Host: {{ match.hostName }}
                    </p>
                </div>
                <Link :href="spectate(match.uuid).url" class="w-full sm:w-auto">
                    <Button variant="outline" class="w-full sm:w-auto">Watch</Button>
                </Link>
            </article>
        </div>
    </div>
</template>
