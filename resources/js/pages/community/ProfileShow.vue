<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    History,
    Swords,
    Trophy,
} from 'lucide-vue-next';
import Heading from '@/components/Heading.vue';
import ShareButton from '@/components/ShareButton.vue';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { avatarUrl } from '@/composables/useAvatar';
import { getInitials } from '@/composables/useInitials';
import { mapBuilder } from '@/routes';
import { index as leaderboardIndex } from '@/routes/leaderboard';

type Profile = {
    name: string;
    playerTag: string;
    avatar: string;
    avatarStyle: string;
    avatarSeed: string;
    profileUuid: string;
    memberSince: string | null;
    profileUrl: string;
};

type Stats = {
    wins: number;
    losses: number;
    matchesPlayed: number;
    winRate: number;
    finishedHosts: number;
    publishedMapCount: number;
};

type PaginatorLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PubMap = {
    uuid: string;
    name: string;
    publishedAt: string | null;
};

type PubMapPaginator = {
    data: PubMap[];
    current_page: number;
    last_page: number;
    links: PaginatorLink[];
};

type BattleMatch = {
    uuid: string;
    code: string;
    finishedAt: string | null;
    winnerName: string | null;
    isWinner: boolean;
    players: Array<{ name: string; color: string }>;
    shareLinks: Record<string, string>;
    gameUrl: string;
};

type BattlePaginator = {
    data: BattleMatch[];
    current_page: number;
    last_page: number;
    total: number;
    links: PaginatorLink[];
};

defineProps<{
    profile: Profile;
    stats: Stats;
    publishedMaps: PubMapPaginator | undefined;
    battleHistory: BattlePaginator | undefined;
    isOwnProfile: boolean;
    shareLinks: Record<string, string>;
}>();

function formatDate(iso: string | null): string {
    if (!iso) {
        return '-';
    }

    try {
        return new Intl.DateTimeFormat(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(new Date(iso));
    } catch {
        return iso;
    }
}
</script>

<template>
    <Head :title="`${profile.playerTag} · Profile`" />

    <div class="mx-auto flex max-w-3xl flex-col gap-8">
        <div
            class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
        >
            <div class="flex items-start gap-4">
                <Avatar class="size-20 border-2 border-foreground bg-black">
                    <AvatarImage
                        :src="
                            avatarUrl(profile.avatarSeed, profile.avatarStyle)
                        "
                        :alt="profile.playerTag"
                    />
                    <AvatarFallback class="text-lg font-bold">
                        {{ getInitials(profile.playerTag) }}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h1 class="font-display text-2xl font-bold sm:text-3xl">
                        {{ profile.playerTag }}
                    </h1>
                    <p
                        v-if="profile.memberSince"
                        class="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"
                    >
                        <Calendar class="size-4 shrink-0" />
                        Member since {{ formatDate(profile.memberSince) }}
                    </p>
                    <p
                        v-if="isOwnProfile"
                        class="mt-2 text-xs text-muted-foreground"
                    >
                        This is your public profile - others see the same stats
                        (no email shown).
                    </p>
                </div>
            </div>
            <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button
                    variant="outline"
                    size="sm"
                    as-child
                    class="w-full sm:w-auto"
                >
                    <Link
                        :href="`${leaderboardIndex().url}#${profile.profileUuid}`"
                    >
                        <Trophy class="mr-2 size-4" />
                        Leaderboard
                    </Link>
                </Button>

                <ShareButton
                    :share-links="shareLinks"
                    :copy-url="profile.profileUrl"
                    label="Share Profile"
                />
            </div>
        </div>

        <Heading
            variant="small"
            title="Battle stats"
            description="Finished matches only. Guest-only games you played while logged out are not counted."
        />

        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div class="wod-panel p-4">
                <p
                    class="text-xs font-semibold text-muted-foreground uppercase"
                >
                    Wins
                </p>
                <p class="mt-1 font-display text-3xl font-bold">
                    {{ stats.wins }}
                </p>
            </div>
            <div class="wod-panel p-4">
                <p
                    class="text-xs font-semibold text-muted-foreground uppercase"
                >
                    Losses
                </p>
                <p class="mt-1 font-display text-3xl font-bold">
                    {{ stats.losses }}
                </p>
            </div>
            <div class="wod-panel p-4">
                <p
                    class="text-xs font-semibold text-muted-foreground uppercase"
                >
                    Matches played
                </p>
                <p class="mt-1 font-display text-3xl font-bold">
                    {{ stats.matchesPlayed }}
                </p>
            </div>
            <div class="wod-panel p-4">
                <p
                    class="text-xs font-semibold text-muted-foreground uppercase"
                >
                    Win rate
                </p>
                <p class="mt-1 font-display text-3xl font-bold">
                    {{ stats.winRate }}%
                </p>
            </div>
            <div class="wod-panel p-4">
                <p
                    class="text-xs font-semibold text-muted-foreground uppercase"
                >
                    Hosted (finished)
                </p>
                <p class="mt-1 font-display text-3xl font-bold">
                    {{ stats.finishedHosts }}
                </p>
            </div>
            <div class="wod-panel p-4">
                <p
                    class="text-xs font-semibold text-muted-foreground uppercase"
                >
                    Published maps
                </p>
                <p class="mt-1 font-display text-3xl font-bold">
                    {{ stats.publishedMapCount }}
                </p>
            </div>
        </div>

        <div class="space-y-3">
            <Heading
                variant="small"
                title="Published maps"
                description="Open in the map builder (read-only for visitors when not yours)."
            />

            <template v-if="publishedMaps === undefined">
                <ul class="space-y-2">
                    <li
                        v-for="i in 3"
                        :key="i"
                        class="flex animate-pulse items-center justify-between rounded-md border-2 border-foreground bg-background px-4 py-3"
                    >
                        <div class="h-4 w-40 rounded bg-muted" />
                        <div class="h-4 w-12 rounded bg-muted" />
                    </li>
                </ul>
            </template>

            <template v-else-if="publishedMaps.data.length > 0">
                <ul class="space-y-2">
                    <li
                        v-for="m in publishedMaps.data"
                        :key="m.uuid"
                        class="flex flex-col gap-2 rounded-md border-2 border-foreground bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                    >
                        <span class="font-medium">{{ m.name }}</span>
                        <a
                            :href="mapBuilder.url(m.uuid)"
                            class="inline-flex items-center gap-1 text-sm font-semibold text-foreground underline-offset-4 hover:underline"
                        >
                            View
                            <ExternalLink class="size-3.5 opacity-70" />
                        </a>
                    </li>
                </ul>

                <div
                    v-if="publishedMaps.last_page > 1"
                    class="flex items-center gap-1"
                >
                    <Link
                        v-for="link in publishedMaps.links"
                        :key="link.label"
                        :href="link.url ?? ''"
                        :aria-disabled="!link.url"
                        preserve-scroll
                        class="flex h-8 min-w-8 items-center justify-center rounded-md border-2 border-foreground/20 px-2 font-mono text-xs font-bold transition-colors"
                        :class="[
                            link.active
                                ? 'border-foreground bg-foreground text-background'
                                : 'hover:bg-muted/40',
                            !link.url ? 'pointer-events-none opacity-40' : '',
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
            </template>

            <div
                v-else
                class="wod-panel-dashed p-6 text-center text-sm text-muted-foreground"
            >
                <Swords class="mx-auto mb-2 size-6 opacity-50" />
                No published maps yet.
            </div>
        </div>

        <div class="space-y-3">
            <Heading
                variant="small"
                title="Battle history"
                description="Finished matches, most recent first."
            />

            <template v-if="battleHistory === undefined">
                <div
                    v-for="i in 3"
                    :key="i"
                    class="wod-panel flex animate-pulse flex-col gap-4 p-4"
                >
                    <div class="flex gap-2">
                        <div class="h-5 w-20 rounded bg-muted" />
                        <div class="h-5 w-16 rounded bg-muted" />
                    </div>
                    <div class="h-4 w-48 rounded bg-muted" />
                </div>
            </template>

            <template v-else>
                <div
                    v-if="battleHistory.data.length === 0"
                    class="wod-panel-dashed p-6 text-center text-sm text-muted-foreground"
                >
                    <History class="mx-auto mb-2 size-6 opacity-50" />
                    No finished matches yet.
                </div>

                <article
                    v-for="match in battleHistory.data"
                    :key="match.uuid"
                    class="wod-panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                    <div class="min-w-0">
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="font-bold tracking-widest">{{
                                match.code
                            }}</span>
                            <Badge
                                variant="outline"
                                :class="
                                    match.isWinner
                                        ? 'border-foreground bg-wod-green-lt'
                                        : 'border-foreground'
                                "
                            >
                                {{ match.isWinner ? 'Victory' : 'Defeat' }}
                            </Badge>
                        </div>
                        <p class="mt-1 text-sm text-muted-foreground">
                            Winner:
                            <span class="font-semibold text-foreground">{{
                                match.winnerName ?? 'Unknown'
                            }}</span>
                            <template v-if="match.finishedAt">
                                · {{ formatDate(match.finishedAt) }}
                            </template>
                        </p>
                        <div class="mt-2 flex flex-wrap gap-1.5">
                            <span
                                v-for="player in match.players"
                                :key="player.name"
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

                    <div class="flex shrink-0 gap-2">
                        <Link
                            :href="match.gameUrl"
                            class="flex-1 sm:flex-none"
                        >
                            <Button
                                variant="outline"
                                size="sm"
                                class="w-full sm:w-auto"
                                >View</Button
                            >
                        </Link>
                        <ShareButton
                            :share-links="match.shareLinks"
                            :copy-url="match.gameUrl"
                            label="Share"
                        />
                    </div>
                </article>

                <div
                    v-if="battleHistory.last_page > 1"
                    class="flex items-center justify-between gap-4 text-sm"
                >
                    <p class="text-muted-foreground">
                        Page {{ battleHistory.current_page }} of
                        {{ battleHistory.last_page }} &middot;
                        {{ battleHistory.total }} matches
                    </p>
                    <div class="flex items-center gap-1">
                        <Link
                            v-for="link in battleHistory.links"
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
    </div>
</template>
