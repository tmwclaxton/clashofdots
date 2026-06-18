<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import { ChevronLeft, ChevronRight, Trophy } from 'lucide-vue-next';
import { nextTick, onMounted, ref } from 'vue';
import Heading from '@/components/Heading.vue';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { avatarUrl } from '@/composables/useAvatar';
import { getInitials } from '@/composables/useInitials';
import { show as profileShow } from '@/routes/profiles';

type Row = {
    rank: number;
    profileUuid: string;
    avatarSeed: string;
    name: string;
    avatar: string;
    avatarStyle: string;
    wins: number;
    losses: number;
    matchesPlayed: number;
    winRate: number;
    publishedMapCount: number;
};

type PaginatorLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Paginator = {
    data: Row[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginatorLink[];
};

defineProps<{
    leaderboard: Paginator;
}>();

const highlightedUuid = ref<string | null>(null);

onMounted(async () => {
    const hash = window.location.hash.slice(1);

    if (!hash) {
        return;
    }

    highlightedUuid.value = hash;

    await nextTick();

    const el = document.getElementById(hash);

    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
});
</script>

<template>
    <Head title="Leaderboard" />

    <div class="flex flex-col gap-8">
        <Heading
            title="Leaderboard"
            description="Ranked by match wins, then total finished matches."
        />

        <div
            v-if="leaderboard.data.length === 0"
            class="wod-panel-dashed p-10 text-center text-muted-foreground"
        >
            <Trophy class="mx-auto mb-2 size-8 opacity-60" />
            <p class="font-bold">No ranked commanders yet</p>
            <p class="mt-1 text-sm">Finish a match to appear here.</p>
        </div>

        <template v-else>
            <div class="wod-panel overflow-x-auto">
                <table class="w-full min-w-[32rem] text-left text-sm">
                    <thead class="border-b-2 border-foreground bg-muted/40">
                        <tr>
                            <th class="px-4 py-3 font-bold">#</th>
                            <th class="px-4 py-3 font-bold">Commander</th>
                            <th class="px-4 py-3 font-bold">Wins</th>
                            <th class="px-4 py-3 font-bold">Losses</th>
                            <th class="px-4 py-3 font-bold">Played</th>
                            <th class="px-4 py-3 font-bold">Win %</th>
                            <th class="px-4 py-3 font-bold">Maps</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="row in leaderboard.data"
                            :id="row.profileUuid"
                            :key="row.profileUuid"
                            class="border-b border-foreground/15 transition-colors"
                            :class="{
                                'bg-amber-400/15 hover:bg-amber-400/25': row.rank === 1,
                                'bg-zinc-400/25 hover:bg-zinc-400/40': row.rank === 2,
                                'bg-orange-700/15 hover:bg-orange-700/25': row.rank === 3,
                                'hover:bg-muted/30': row.rank > 3,
                                'outline outline-2 outline-foreground/30':
                                    highlightedUuid === row.profileUuid,
                                'bg-wod-green-lt/40':
                                    highlightedUuid === row.profileUuid && row.rank > 3,
                            }"
                        >
                            <td class="px-4 py-3 font-mono font-bold">
                                <span
                                    v-if="row.rank === 1"
                                    class="inline-flex size-6 items-center justify-center rounded-full bg-amber-400 text-xs text-amber-950"
                                    title="1st place"
                                >1</span>
                                <span
                                    v-else-if="row.rank === 2"
                                    class="inline-flex size-6 items-center justify-center rounded-full bg-zinc-400 text-xs text-zinc-950 ring-1 ring-zinc-500"
                                    title="2nd place"
                                >2</span>
                                <span
                                    v-else-if="row.rank === 3"
                                    class="inline-flex size-6 items-center justify-center rounded-full bg-orange-700 text-xs text-orange-100"
                                    title="3rd place"
                                >3</span>
                                <span v-else>{{ row.rank }}</span>
                            </td>
                            <td class="px-4 py-3">
                                <Link
                                    :href="profileShow.url(row.profileUuid)"
                                    class="flex items-center gap-3 font-medium text-foreground underline-offset-4 hover:underline"
                                >
                                    <Avatar
                                        class="size-9 border-2 bg-black"
                                        :class="{
                                            'border-amber-400': row.rank === 1,
                                            'border-zinc-400': row.rank === 2,
                                            'border-orange-700': row.rank === 3,
                                            'border-foreground': row.rank > 3,
                                        }"
                                    >
                                        <AvatarImage
                                            :src="avatarUrl(row.avatarSeed, row.avatarStyle)"
                                            :alt="row.name"
                                        />
                                        <AvatarFallback class="text-xs font-bold">
                                            {{ getInitials(row.name) }}
                                        </AvatarFallback>
                                    </Avatar>
                                    {{ row.name }}
                                </Link>
                            </td>
                            <td class="px-4 py-3">
                                <Badge
                                    v-if="row.rank <= 3"
                                    variant="outline"
                                    class="border-foreground bg-wod-green-lt"
                                >
                                    {{ row.wins }}
                                </Badge>
                                <span v-else>{{ row.wins }}</span>
                            </td>
                            <td class="px-4 py-3 text-muted-foreground">
                                {{ row.losses }}
                            </td>
                            <td class="px-4 py-3">{{ row.matchesPlayed }}</td>
                            <td class="px-4 py-3">{{ row.winRate }}%</td>
                            <td class="px-4 py-3 text-muted-foreground">
                                {{ row.publishedMapCount }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div
                v-if="leaderboard.last_page > 1"
                class="flex items-center justify-between gap-4 text-sm"
            >
                <p class="text-muted-foreground">
                    Page {{ leaderboard.current_page }} of
                    {{ leaderboard.last_page }} &middot;
                    {{ leaderboard.total }} commanders
                </p>

                <div class="flex items-center gap-1">
                    <Link
                        v-for="link in leaderboard.links"
                        :key="link.label"
                        :href="link.url ?? ''"
                        :aria-disabled="!link.url"
                        preserve-scroll
                        class="flex h-8 min-w-8 items-center justify-center rounded-md border-2 border-foreground/20 px-2 font-mono text-xs font-bold transition-colors"
                        :class="[
                            link.active
                                ? 'border-foreground bg-foreground text-background'
                                : 'hover:bg-muted/40',
                            !link.url
                                ? 'pointer-events-none opacity-40'
                                : '',
                        ]"
                    >
                        <ChevronLeft
                            v-if="link.label === '&laquo; Previous'"
                            class="size-3.5"
                        />
                        <ChevronRight
                            v-else-if="link.label === 'Next &raquo;'"
                            class="size-3.5"
                        />
                        <span v-else v-html="link.label" />
                    </Link>
                </div>
            </div>
        </template>
    </div>
</template>
