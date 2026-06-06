<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import { History } from 'lucide-vue-next';
import Heading from '@/components/Heading.vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { show } from '@/routes/games';

type Match = {
    uuid: string;
    code: string;
    status: string;
    maxPlayers: number;
    playerCount: number;
    hostName: string;
    winnerName: string | null;
    isWinner: boolean;
    finishedAt: string | null;
    players: Array<{ slot: number; name: string; color: string }>;
};

defineProps<{
    matches: Match[];
}>();

function formatDate(value: string | null): string {
    if (!value) {
        return 'Unknown';
    }

    return new Date(value).toLocaleString();
}
</script>

<template>
    <Head title="Past Matches" />

    <div class="flex flex-col gap-8">
        <Heading
            title="Past Matches"
            description="Your campaign history."
        />

        <div
            v-if="matches.length === 0"
            class="wod-panel-dashed p-10 text-center text-muted-foreground"
        >
            <History class="mx-auto mb-2 size-7 opacity-60" />
            <p class="font-bold">No completed matches yet</p>
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
                            v-if="match.isWinner"
                            variant="outline"
                            class="border-foreground bg-wod-green-lt"
                        >
                            Victory
                        </Badge>
                        <Badge
                            v-else
                            variant="outline"
                            class="border-foreground"
                        >
                            Defeat
                        </Badge>
                    </div>
                    <p class="mt-1 text-sm text-muted-foreground">
                        Winner:
                        <span class="font-semibold text-foreground">{{
                            match.winnerName ?? 'Unknown'
                        }}</span>
                        · {{ formatDate(match.finishedAt) }}
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
                <Link :href="show(match.uuid).url">
                    <Button variant="outline">View summary</Button>
                </Link>
            </article>
        </div>
    </div>
</template>
