<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import { Clock3 } from 'lucide-vue-next';
import Heading from '@/components/Heading.vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { play } from '@/routes/games';

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

defineProps<{
    matches: Match[];
}>();
</script>

<template>
    <Head title="Ongoing Matches" />

    <div class="flex flex-col gap-8">
        <Heading
            title="Ongoing Matches"
            description="Battles you are currently fighting."
        />

        <div
            v-if="matches.length === 0"
            class="wod-panel-dashed p-10 text-center text-muted-foreground"
        >
            <Clock3 class="mx-auto mb-2 size-7 opacity-60" />
            <p class="font-bold">No active battles</p>
            <p class="mt-1 text-sm">Join a lobby to get on the map.</p>
        </div>

        <div v-else class="space-y-3">
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
                <Link :href="play(match.uuid).url">
                    <Button>Return to battle</Button>
                </Link>
            </article>
        </div>
    </div>
</template>
