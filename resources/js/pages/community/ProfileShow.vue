<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import {
    Calendar,
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

type PubMap = {
    uuid: string;
    name: string;
    publishedAt: string | null;
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

defineProps<{
    profile: Profile;
    stats: Stats;
    publishedMaps: PubMap[];
    battleHistory: BattleMatch[];
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

        <div v-if="publishedMaps.length > 0" class="space-y-3">
            <Heading
                variant="small"
                title="Published maps"
                description="Open in the map builder (read-only for visitors when not yours)."
            />
            <ul class="space-y-2">
                <li
                    v-for="m in publishedMaps"
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
        </div>

        <div
            v-else
            class="wod-panel-dashed p-6 text-center text-sm text-muted-foreground"
        >
            <Swords class="mx-auto mb-2 size-6 opacity-50" />
            No published maps yet.
        </div>

        <div class="space-y-3">
            <Heading
                variant="small"
                title="Battle history"
                description="Last 20 finished matches."
            />

            <div
                v-if="battleHistory.length === 0"
                class="wod-panel-dashed p-6 text-center text-sm text-muted-foreground"
            >
                <History class="mx-auto mb-2 size-6 opacity-50" />
                No finished matches yet.
            </div>

            <article
                v-for="match in battleHistory"
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
                    <Link :href="match.gameUrl" class="flex-1 sm:flex-none">
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
        </div>
    </div>
</template>
