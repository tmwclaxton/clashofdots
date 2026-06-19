<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import { History } from 'lucide-vue-next';
import { ref, shallowRef, watch } from 'vue';
import Heading from '@/components/Heading.vue';
import ShareButton from '@/components/ShareButton.vue';
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
    shareLinks: Record<string, string>;
    gameUrl: string;
};

const props = defineProps<{
    matches: Match[] | undefined;
}>();

const MIN_SKELETON_MS = 800;
const pageLoadedAt = performance.now();
const ready = ref(false);
const resolvedMatches = shallowRef<Match[] | undefined>(undefined);

watch(
    () => props.matches,
    (incoming) => {
        if (incoming === undefined) {
            return;
        }

        const remaining = Math.max(0, MIN_SKELETON_MS - (performance.now() - pageLoadedAt));

        setTimeout(() => {
            resolvedMatches.value = incoming;
            ready.value = true;
        }, remaining);
    },
    { immediate: true },
);

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
        <Heading title="Past Matches" description="Your campaign history." />

        <div v-if="!ready" class="space-y-3">
            <div
                v-for="i in 3"
                :key="i"
                class="wod-panel flex animate-pulse flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
                <div class="space-y-2">
                    <div class="flex gap-2">
                        <div class="h-5 w-20 rounded bg-muted" />
                        <div class="h-5 w-16 rounded bg-muted" />
                    </div>
                    <div class="h-4 w-48 rounded bg-muted" />
                    <div class="mt-1 flex gap-2">
                        <div class="h-5 w-20 rounded-full bg-muted" />
                        <div class="h-5 w-20 rounded-full bg-muted" />
                    </div>
                </div>
                <div class="flex gap-2">
                    <div class="h-9 w-28 rounded bg-muted" />
                    <div class="h-9 w-20 rounded bg-muted" />
                </div>
            </div>
        </div>

        <div
            v-else-if="resolvedMatches!.length === 0"
            class="wod-panel-dashed p-10 text-center text-muted-foreground"
        >
            <History class="mx-auto mb-2 size-7 opacity-60" />
            <p class="font-bold">No completed matches yet</p>
        </div>

        <div v-else class="space-y-3">
            <article
                v-for="match in resolvedMatches"
                :key="match.uuid"
                class="wod-panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
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
                <div class="flex w-full gap-2 sm:w-auto">
                    <Link
                        :href="show(match.uuid).url"
                        class="flex-1 sm:flex-none"
                    >
                        <Button variant="outline" class="w-full sm:w-auto"
                            >View summary</Button
                        >
                    </Link>
                    <ShareButton
                        :share-links="match.shareLinks"
                        :copy-url="match.gameUrl"
                        label="Share"
                        size="default"
                    />
                </div>
            </article>
        </div>
    </div>
</template>
