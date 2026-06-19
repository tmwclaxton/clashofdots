<script setup lang="ts">
import { Head, Link, router, useForm, usePage } from '@inertiajs/vue3';
import { Copy, Flag, ThumbsDown, ThumbsUp, Users } from 'lucide-vue-next';
import { computed, reactive, ref, watch } from 'vue';
import MapExplorePreview from '@/components/map-explore/MapExplorePreview.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { MapDataPayload } from '@/lib/mapEditorGrid';
import { login, mapBuilder } from '@/routes';
import { store as createGame } from '@/routes/games';
import { explore as mapsExplore, fork, vote } from '@/routes/maps';
import { useToastStore } from '@/stores/toastStore';

export type ExploreMapCard = {
    uuid: string;
    name: string;
    ownerName: string;
    ownerId: number;
    teamCount: number;
    data: MapDataPayload;
    gamesCount: number;
    likesCount: number;
    dislikesCount: number;
    forksCount: number;
    publishedAt: string | null;
    forkAttribution: null | {
        parentName: string;
        parentAuthorName: string;
        parentUuid: string;
    };
    viewerVote: 'like' | 'dislike' | null;
};

export type ExploreFilters = {
    q: string;
    author: string;
    uuid: string;
    sort: string;
    per_page: number;
    teams: number | null;
};

export type ExplorePagination = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_url: string | null;
    next_url: string | null;
    pages: Array<{ page: number; url: string; active: boolean }>;
};

const props = defineProps<{
    maps: ExploreMapCard[] | undefined;
    pagination: ExplorePagination | undefined;
    filters: ExploreFilters;
}>();

const page = usePage();
const toast = useToastStore();
const auth = computed(() => page.props.auth);

const filterForm = reactive({
    q: props.filters.q,
    author: props.filters.author,
    uuid: props.filters.uuid,
    sort: props.filters.sort,
    per_page: props.filters.per_page,
    teams: props.filters.teams,
});

let syncingFromProps = false;

watch(
    () => props.filters,
    (f) => {
        syncingFromProps = true;
        filterForm.q = f.q;
        filterForm.author = f.author;
        filterForm.uuid = f.uuid;
        filterForm.sort = f.sort;
        filterForm.per_page = f.per_page;
        filterForm.teams = f.teams;
        syncingFromProps = false;
    },
    { deep: true },
);

const cards = ref<ExploreMapCard[]>(props.maps ? [...props.maps] : []);

watch(
    () => props.maps,
    (m) => {
        if (m) {
            cards.value = m.map((row) => ({ ...row }));
        }
    },
    { deep: true },
);

const hasActiveFilters = computed(() => {
    return (
        filterForm.q.trim() !== '' ||
        filterForm.author.trim() !== '' ||
        filterForm.uuid.trim() !== '' ||
        filterForm.sort !== 'newest' ||
        filterForm.per_page !== 12 ||
        filterForm.teams !== null
    );
});

const hasUuidFilter = computed(() => filterForm.uuid.trim() !== '');

const lobbyForm = useForm({
    map_uuid: '',
});

function buildExploreQuery(
    overrides: Partial<ExploreFilters> & { page?: number } = {},
): Record<string, string | number | boolean> {
    const q = { ...filterForm, ...overrides };
    const out: Record<string, string | number | boolean> = {};

    if (q.q.trim() !== '') {
        out.q = q.q.trim();
    }

    if (q.author.trim() !== '') {
        out.author = q.author.trim();
    }

    if (q.uuid.trim() !== '') {
        out.uuid = q.uuid.trim();
    }

    if (q.sort !== 'newest') {
        out.sort = q.sort;
    }

    if (q.per_page !== 12) {
        out.per_page = q.per_page;
    }

    if (q.teams !== null && q.teams !== undefined) {
        out.teams = q.teams;
    }

    const pageNum = overrides.page ?? 1;

    if (pageNum > 1) {
        out.page = pageNum;
    }

    return out;
}

function visitExplore(
    overrides: Partial<ExploreFilters> & { page?: number } = {},
): void {
    router.visit(mapsExplore.url({ query: buildExploreQuery(overrides) }), {
        preserveState: true,
        preserveScroll: true,
        replace: true,
    });
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function applyFilters(): void {
    visitExplore({ page: 1 });
}

function applyFiltersDebounced(): void {
    if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
        debounceTimer = null;
        visitExplore({ page: 1 });
    }, 400);
}

watch(() => filterForm.q, () => { if (!syncingFromProps) applyFiltersDebounced(); });
watch(() => filterForm.author, () => { if (!syncingFromProps) applyFiltersDebounced(); });
watch(() => filterForm.sort, () => { if (!syncingFromProps) visitExplore({ page: 1 }); });
watch(() => filterForm.per_page, () => { if (!syncingFromProps) visitExplore({ page: 1 }); });
watch(() => filterForm.teams, () => { if (!syncingFromProps) visitExplore({ page: 1 }); });

function resetFilters(): void {
    syncingFromProps = true;
    filterForm.q = '';
    filterForm.author = '';
    filterForm.uuid = '';
    filterForm.sort = 'newest';
    filterForm.per_page = 12;
    filterForm.teams = null;
    syncingFromProps = false;
    visitExplore({ page: 1 });
}

function getCookie(name: string): string {
    const match = document.cookie.match(new RegExp(`(^|; )${name}=([^;]*)`));

    return match ? decodeURIComponent(match[2] ?? '') : '';
}

function csrfToken(): string {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? getCookie('XSRF-TOKEN')
    );
}

async function jsonPost(
    url: string,
    body: Record<string, unknown>,
): Promise<Response> {
    return fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN': decodeURIComponent(getCookie('XSRF-TOKEN')),
            'X-CSRF-TOKEN': csrfToken(),
        },
        body: JSON.stringify(body),
    });
}

function mergeCard(uuid: string, next: ExploreMapCard): void {
    const i = cards.value.findIndex((c) => c.uuid === uuid);

    if (i !== -1) {
        cards.value[i] = next;
    }
}

async function submitVote(
    mapUuid: string,
    choice: 'like' | 'dislike' | 'clear',
): Promise<void> {
    const res = await jsonPost(vote.url(mapUuid), { vote: choice });

    if (!res.ok) {
        const t = await res.text();
        toast.error(t.slice(0, 400));

        return;
    }

    const body = (await res.json()) as { map: ExploreMapCard };
    mergeCard(mapUuid, body.map);
}

function toggleLike(m: ExploreMapCard): void {
    if (!auth.value.user) {
        toast.info('Sign in to rate maps.');

        return;
    }

    const next = m.viewerVote === 'like' ? 'clear' : 'like';
    void submitVote(m.uuid, next);
}

function toggleDislike(m: ExploreMapCard): void {
    if (!auth.value.user) {
        toast.info('Sign in to rate maps.');

        return;
    }

    const next = m.viewerVote === 'dislike' ? 'clear' : 'dislike';
    void submitVote(m.uuid, next);
}

function startLobby(m: ExploreMapCard): void {
    if (!auth.value.user) {
        toast.info('Sign in to start a lobby from this map.');

        return;
    }

    lobbyForm.map_uuid = m.uuid;
    lobbyForm.post(createGame().url);
}

function copyToBuilder(m: ExploreMapCard): void {
    if (!auth.value.user) {
        toast.info('Sign in to copy a map into your builder.');

        return;
    }

    void (async () => {
        const res = await jsonPost(fork.url(m.uuid), {});

        if (!res.ok) {
            const t = await res.text();
            toast.error(t.slice(0, 400));

            return;
        }

        const body = (await res.json()) as { map: { uuid: string } };
        toast.success('Map copied to your library.');
        router.visit(mapBuilder.url(body.map.uuid));
    })();
}

const sortOptions = [
    { value: 'newest', label: 'Newest published' },
    { value: 'oldest', label: 'Oldest published' },
    { value: 'name_az', label: 'Name A–Z' },
    { value: 'name_za', label: 'Name Z–A' },
    { value: 'most_likes', label: 'Most likes' },
    { value: 'most_forks', label: 'Most forks' },
    { value: 'most_games', label: 'Most games' },
] as const;
</script>

<template>
    <Head title="Explore maps" />

    <div class="flex flex-col gap-8">
        <div class="flex items-center gap-4">
            <h1
                class="font-display text-xl font-bold tracking-tight sm:text-2xl md:text-3xl"
            >
                Explore maps
            </h1>
            <Button size="sm" as-child>
                <Link :href="mapBuilder().url">Map Builder</Link>
            </Button>
        </div>

        <div
            v-if="hasUuidFilter"
            class="wod-panel flex flex-wrap items-center justify-between gap-3 px-4 py-3"
        >
            <p class="text-sm text-muted-foreground">
                Showing one published map from your builder link.
            </p>
            <Button
                type="button"
                size="sm"
                variant="outline"
                @click="resetFilters"
            >
                Show all maps
            </Button>
        </div>

        <form
            class="wod-panel flex flex-col gap-4 p-4"
            @submit.prevent="applyFilters"
        >
            <p
                class="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
            >
                Search &amp; sort
            </p>
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div class="flex flex-col gap-1.5">
                    <label
                        class="text-xs font-medium text-foreground"
                        for="explore-q"
                        >Map name</label
                    >
                    <Input
                        id="explore-q"
                        v-model="filterForm.q"
                        type="search"
                        maxlength="120"
                        placeholder="Contains…"
                        autocomplete="off"
                        class="h-9"
                    />
                </div>
                <div class="flex flex-col gap-1.5">
                    <label
                        class="text-xs font-medium text-foreground"
                        for="explore-author"
                        >Author</label
                    >
                    <Input
                        id="explore-author"
                        v-model="filterForm.author"
                        type="search"
                        maxlength="80"
                        placeholder="Creator name…"
                        autocomplete="off"
                        class="h-9"
                    />
                </div>
                <div class="flex flex-col gap-1.5">
                    <label
                        class="text-xs font-medium text-foreground"
                        for="explore-teams"
                        >Teams</label
                    >
                    <Select
                        :model-value="filterForm.teams !== null ? String(filterForm.teams) : 'any'"
                        @update:model-value="(v) => { filterForm.teams = v === 'any' ? null : Number(v); }"
                    >
                        <SelectTrigger id="explore-teams" class="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="any">Any</SelectItem>
                            <SelectItem value="2">2 teams</SelectItem>
                            <SelectItem value="3">3 teams</SelectItem>
                            <SelectItem value="4">4 teams</SelectItem>
                            <SelectItem value="5">5 teams</SelectItem>
                            <SelectItem value="6">6 teams</SelectItem>
                            <SelectItem value="7">7 teams</SelectItem>
                            <SelectItem value="8">8 teams</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div class="flex flex-col gap-1.5">
                    <label
                        class="text-xs font-medium text-foreground"
                        for="explore-sort"
                        >Sort by</label
                    >
                    <Select
                        :model-value="filterForm.sort"
                        @update:model-value="(v) => { filterForm.sort = v; }"
                    >
                        <SelectTrigger id="explore-sort" class="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem
                                v-for="opt in sortOptions"
                                :key="opt.value"
                                :value="opt.value"
                            >
                                {{ opt.label }}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div class="flex flex-col gap-1.5">
                    <label
                        class="text-xs font-medium text-foreground"
                        for="explore-per"
                        >Per page</label
                    >
                    <Select
                        :model-value="String(filterForm.per_page)"
                        @update:model-value="(v) => { filterForm.per_page = Number(v); }"
                    >
                        <SelectTrigger id="explore-per" class="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="12">12</SelectItem>
                            <SelectItem value="24">24</SelectItem>
                            <SelectItem value="48">48</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </form>

        <p class="text-sm text-muted-foreground">
            Showing
            <span
                class="inline-block font-medium text-foreground"
                :class="!pagination ? 'w-4 animate-pulse rounded bg-muted text-transparent' : ''"
            >{{ pagination ? (pagination.from ?? 0) : '0' }}</span>
            –
            <span
                class="inline-block font-medium text-foreground"
                :class="!pagination ? 'w-4 animate-pulse rounded bg-muted text-transparent' : ''"
            >{{ pagination ? (pagination.to ?? 0) : '0' }}</span>
            of
            <span
                class="inline-block font-medium text-foreground"
                :class="!pagination ? 'w-8 animate-pulse rounded bg-muted text-transparent' : ''"
            >{{ pagination ? pagination.total : '0' }}</span>
            published maps
        </p>

        <div
            v-if="maps === undefined"
            class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
        >
            <div
                v-for="i in 6"
                :key="i"
                class="wod-panel flex animate-pulse flex-col gap-3 p-4"
            >
                <div class="aspect-video w-full rounded-md bg-muted" />
                <div class="flex flex-col gap-2">
                    <div class="h-4 w-2/3 rounded bg-muted" />
                    <div class="h-3 w-1/3 rounded bg-muted" />
                </div>
                <div class="flex gap-2">
                    <div class="h-5 w-16 rounded bg-muted" />
                    <div class="h-5 w-32 rounded bg-muted" />
                </div>
                <div class="mt-auto flex gap-2 border-t border-foreground/10 pt-3">
                    <div class="h-8 w-24 rounded bg-muted" />
                    <div class="h-8 w-28 rounded bg-muted" />
                    <div class="h-8 w-24 rounded bg-muted" />
                </div>
            </div>
        </div>

        <div
            v-else-if="cards.length === 0"
            class="wod-panel-dashed p-10 text-center text-muted-foreground"
        >
            <template v-if="hasActiveFilters">
                <p>No published maps match your filters.</p>
                <button
                    type="button"
                    class="mt-3 font-medium text-foreground underline underline-offset-2"
                    @click="resetFilters"
                >
                    Clear filters
                </button>
            </template>
            <template v-else-if="pagination && pagination.total === 0">
                No published maps yet. Publish yours from the map builder when
                it is ready.
            </template>
            <template v-else>
                <p>No maps on this page.</p>
                <Button
                    type="button"
                    variant="link"
                    class="mt-2 h-auto p-0 text-foreground"
                    @click="visitExplore({ page: 1 })"
                >
                    Back to first page
                </Button>
            </template>
        </div>

        <div v-else class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            <article
                v-for="m in cards"
                :key="m.uuid"
                class="wod-panel flex flex-col gap-3 p-4"
            >
                <Link
                    :href="mapBuilder.url(m.uuid)"
                    class="group block overflow-hidden rounded-md ring-offset-background transition outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    title="View in map builder (read-only)"
                >
                    <MapExplorePreview
                        class="transition group-hover:opacity-95"
                        :data="m.data"
                    />
                </Link>

                <div>
                    <h2 class="leading-tight font-bold">
                        <Link
                            :href="mapBuilder.url(m.uuid)"
                            class="rounded-sm ring-offset-background transition outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            {{ m.name }}
                        </Link>
                    </h2>
                    <p class="mt-1 text-xs text-muted-foreground">
                        By {{ m.ownerName }}
                        <span
                            v-if="m.publishedAt"
                            class="text-muted-foreground/80"
                        >
                            · published
                            {{ new Date(m.publishedAt).toLocaleDateString() }}
                        </span>
                    </p>
                    <p
                        v-if="m.forkAttribution"
                        class="mt-2 rounded border border-dashed border-foreground/20 bg-muted/40 px-2 py-1.5 text-xs text-muted-foreground"
                    >
                        Fork of
                        <span class="font-medium text-foreground">{{
                            m.forkAttribution.parentName
                        }}</span>
                        by {{ m.forkAttribution.parentAuthorName }}
                    </p>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                    <span
                        class="inline-flex items-center gap-1 rounded border border-foreground/20 bg-muted/50 px-1.5 py-0.5 text-xs font-semibold"
                    >
                        <Flag class="size-3 shrink-0" aria-hidden="true" />
                        {{ m.teamCount }}
                        {{ m.teamCount === 1 ? 'team' : 'teams' }}
                    </span>
                    <span class="text-xs text-muted-foreground"
                        >{{ m.gamesCount }} games · {{ m.forksCount }} forks ·
                        {{ m.likesCount }} likes /
                        {{ m.dislikesCount }} dislikes</span
                    >
                </div>

                <div
                    class="mt-auto flex flex-col gap-2 border-t border-foreground/10 pt-3 sm:flex-row sm:flex-wrap"
                >
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        class="w-full gap-1 sm:w-auto"
                        as-child
                    >
                        <Link
                            :href="mapBuilder.url(m.uuid)"
                            title="View in map builder (read-only)"
                        >
                            View in builder
                        </Link>
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        class="w-full gap-1 sm:w-auto"
                        @click="copyToBuilder(m)"
                    >
                        <Copy class="size-3.5" />
                        Copy to my maps
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        class="w-full gap-1 sm:w-auto"
                        @click="startLobby(m)"
                    >
                        <Users class="size-3.5" />
                        Start lobby
                    </Button>
                    <div
                        class="flex items-center justify-center gap-1 sm:ml-auto sm:justify-end"
                    >
                        <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            class="size-8"
                            :class="
                                m.viewerVote === 'like'
                                    ? 'border-green-500 text-green-700 dark:text-green-400'
                                    : ''
                            "
                            :title="auth.user ? 'Like' : 'Sign in to like'"
                            @click="toggleLike(m)"
                        >
                            <ThumbsUp class="size-4" />
                        </Button>
                        <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            class="size-8"
                            :class="
                                m.viewerVote === 'dislike'
                                    ? 'border-red-500 text-red-700 dark:text-red-400'
                                    : ''
                            "
                            :title="
                                auth.user ? 'Dislike' : 'Sign in to dislike'
                            "
                            @click="toggleDislike(m)"
                        >
                            <ThumbsDown class="size-4" />
                        </Button>
                    </div>
                </div>
            </article>
        </div>

        <nav
            v-if="pagination && pagination.last_page > 1"
            class="flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
            aria-label="Pagination"
        >
            <div class="flex flex-wrap items-center justify-center gap-2">
                <Button
                    v-if="pagination.prev_url"
                    variant="outline"
                    size="sm"
                    class="min-w-[5.5rem]"
                    as-child
                >
                    <Link :href="pagination.prev_url"> Previous </Link>
                </Button>
                <Button
                    v-else
                    variant="outline"
                    size="sm"
                    class="min-w-[5.5rem]"
                    disabled
                >
                    Previous
                </Button>
                <div class="flex flex-wrap items-center justify-center gap-1">
                    <Button
                        v-for="p in pagination.pages"
                        :key="p.page"
                        size="sm"
                        :variant="p.active ? 'default' : 'outline'"
                        class="min-w-9 px-2"
                        as-child
                    >
                        <Link :href="p.url">{{ p.page }}</Link>
                    </Button>
                </div>
                <Button
                    v-if="pagination.next_url"
                    variant="outline"
                    size="sm"
                    class="min-w-[5.5rem]"
                    as-child
                >
                    <Link :href="pagination.next_url"> Next </Link>
                </Button>
                <Button
                    v-else
                    variant="outline"
                    size="sm"
                    class="min-w-[5.5rem]"
                    disabled
                >
                    Next
                </Button>
            </div>
            <p class="text-xs text-muted-foreground">
                Page {{ pagination.current_page }} of {{ pagination.last_page }}
            </p>
        </nav>

        <p v-if="!auth.user" class="text-center text-sm text-muted-foreground">
            <Link
                :href="login().url"
                class="font-medium text-foreground underline underline-offset-2"
            >
                Sign in
            </Link>
            to fork maps, vote, or start lobbies.
        </p>
    </div>
</template>
