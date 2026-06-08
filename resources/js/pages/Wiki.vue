<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import type { LucideIcon } from 'lucide-vue-next';
import {
    BookOpen,
    Circle,
    Coins,
    Flag,
    Info,
    Landmark,
    Layers,
    Map,
    Package,
    Radar,
    RectangleHorizontal,
    Sparkles,
    Swords,
    UserPlus,
    Wallet,
} from 'lucide-vue-next';
import { computed } from 'vue';
import Heading from '@/components/Heading.vue';
import { Button } from '@/components/ui/button';
import { mapBuilder } from '@/routes';

type TroopStat = {
    id: string;
    label: string;
    role: string;
    health: number;
    recruitCost: number;
    upkeepPerSecond: number;
    defense: number;
    summary: string;
};

type SettlementStat = {
    id: string;
    label: string;
    marker: string;
    incomePerSecond: number;
    supplyCapacity: number;
    healMultiplier: number;
    summary: string;
};

type TerrainEffect = {
    speed: number;
    attack: number;
    defense: number;
};

type TerrainStat = {
    id: string;
    label: string;
    color: string;
    isWater: boolean;
    impassable: boolean;
    description: string;
    infantry: TerrainEffect;
    tank: TerrainEffect;
};

type MapGenerationStat = {
    id: string;
    label: string;
    description: string;
    traits: string[];
    preview: string;
};

type EconomyNote = {
    title: string;
    body: string;
    icon: string;
};

defineProps<{
    troops: TroopStat[];
    settlements: SettlementStat[];
    terrain: TerrainStat[];
    mapGeneration: MapGenerationStat[];
    economyNotes: EconomyNote[];
}>();

const economyIconMap: Record<string, LucideIcon> = {
    coins: Coins,
    wallet: Wallet,
    package: Package,
    'user-plus': UserPlus,
    radar: Radar,
};

function economyIcon(slug: string): LucideIcon {
    return economyIconMap[slug] ?? Info;
}

function troopGlyph(troopId: string): LucideIcon {
    return troopId === 'tank' ? RectangleHorizontal : Circle;
}

function settlementGlyph(settlementId: string): LucideIcon {
    return settlementId === 'capital' ? Landmark : Flag;
}

const mapBuilderHref = computed(() => mapBuilder().url);

function formatStat(value: number, digits = 2): string {
    return value.toFixed(digits).replace(/\.?0+$/, '');
}

function attackRatio(infantry: number, tank: number): string {
    if (infantry === 0 && tank === 0) {
        return '-';
    }

    if (infantry === 0) {
        return 'Tank only';
    }

    const ratio = tank / infantry;

    if (Math.abs(ratio - 1) < 0.05) {
        return 'Equal';
    }

    return `${formatStat(ratio, 1)}×`;
}

function speedClass(speed: number, impassable: boolean): string {
    if (impassable || speed <= 0.02) {
        return 'text-muted-foreground';
    }

    if (speed >= 0.45) {
        return 'text-wod-green-dk font-semibold';
    }

    if (speed >= 0.25) {
        return 'text-foreground';
    }

    return 'text-amber-700 dark:text-amber-300';
}
</script>

<template>
    <Head title="Game Wiki" />

    <div class="flex flex-col gap-10 pb-4">
        <Heading
            title="Game Wiki"
            description="Unit stats, terrain effects, economy rules, and procedural maps - tuned from War of Dots community data and adapted for Clash of Dots."
        />

        <div
            class="flex flex-col gap-3 rounded-lg border-2 border-foreground bg-card/80 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
        >
            <div class="flex items-start gap-3">
                <div class="wod-logo-terrain size-10 shrink-0">
                    <BookOpen class="size-5" />
                </div>
                <div>
                    <p class="font-display text-sm font-bold text-foreground">Map Builder</p>
                    <p class="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">
                        Author terrain, place capitals and troops, and roll new maps with the same
                        generation styles documented below. Brush, eraser, and fill work on the
                        vertex grid; marker tools snap to valid tiles.
                    </p>
                </div>
            </div>
            <Button as-child variant="outline" class="shrink-0 self-start sm:self-center">
                <Link :href="mapBuilderHref">Open map builder</Link>
            </Button>
        </div>

        <section class="wod-panel p-6">
            <div class="flex items-start gap-3">
                <div class="wod-logo-terrain size-10 shrink-0">
                    <Swords class="size-5" />
                </div>
                <div>
                    <h2 class="font-display text-xl font-bold">Combat units</h2>
                    <p class="mt-1 text-sm text-muted-foreground">
                        Two unit types share the same upkeep but trade speed for
                        durability. Defense is flat - there is no bonus for holding
                        ground.
                    </p>
                </div>
            </div>

            <div class="mt-6 grid gap-4 md:grid-cols-2">
                <article
                    v-for="troop in troops"
                    :key="troop.id"
                    class="wod-panel-soft p-5"
                >
                    <div class="flex items-center justify-between gap-3">
                        <div class="flex min-w-0 items-center gap-2">
                            <component
                                :is="troopGlyph(troop.id)"
                                class="size-5 shrink-0 text-muted-foreground"
                                stroke-width="2"
                                aria-hidden="true"
                            />
                            <h3 class="font-display text-lg font-bold">
                                {{ troop.label }}
                            </h3>
                        </div>
                        <span class="wod-chip">{{ troop.role }}</span>
                    </div>
                    <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {{ troop.summary }}
                    </p>
                    <dl class="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                            <dt class="text-muted-foreground">Health</dt>
                            <dd class="font-display font-bold">{{ troop.health }}</dd>
                        </div>
                        <div>
                            <dt class="text-muted-foreground">Recruit cost</dt>
                            <dd class="font-display font-bold">
                                {{ troop.recruitCost }} funds
                            </dd>
                        </div>
                        <div>
                            <dt class="text-muted-foreground">Upkeep</dt>
                            <dd class="font-display font-bold">
                                {{ formatStat(troop.upkeepPerSecond, 1) }}/s
                            </dd>
                        </div>
                        <div>
                            <dt class="text-muted-foreground">Defense</dt>
                            <dd class="font-display font-bold">
                                {{ formatStat(troop.defense, 1) }}×
                            </dd>
                        </div>
                    </dl>
                </article>
            </div>
        </section>

        <section class="wod-panel p-6">
            <div class="flex items-start gap-3">
                <div class="wod-logo-terrain size-10 shrink-0">
                    <Coins class="size-5" />
                </div>
                <div>
                    <h2 class="font-display text-xl font-bold">
                        Settlements & economy
                    </h2>
                    <p class="mt-1 text-sm text-muted-foreground">
                        Capitals and outposts (flags) pay your army. Icons match the map editor:
                        <span class="whitespace-nowrap"
                            ><Landmark class="inline size-3.5 align-text-bottom" stroke-width="2" />
                            capital</span
                        >,
                        <span class="whitespace-nowrap"
                            ><Flag class="inline size-3.5 align-text-bottom" stroke-width="2" />
                            outpost</span
                        >.
                    </p>
                </div>
            </div>

            <div class="mt-6 grid gap-4 md:grid-cols-2">
                <article
                    v-for="settlement in settlements"
                    :key="settlement.id"
                    class="wod-panel-soft p-5"
                >
                    <div class="flex items-center justify-between gap-3">
                        <div class="flex min-w-0 items-center gap-2">
                            <component
                                :is="settlementGlyph(settlement.id)"
                                class="size-5 shrink-0 text-muted-foreground"
                                stroke-width="2"
                                aria-hidden="true"
                            />
                            <h3 class="font-display text-lg font-bold">
                                {{ settlement.label }}
                            </h3>
                        </div>
                        <span class="wod-chip text-[0.65rem]">
                            {{ settlement.marker }}
                        </span>
                    </div>
                    <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {{ settlement.summary }}
                    </p>
                    <dl class="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                            <dt class="text-muted-foreground">Income</dt>
                            <dd class="font-display font-bold">
                                {{ settlement.incomePerSecond }} funds/s
                            </dd>
                        </div>
                        <div>
                            <dt class="text-muted-foreground">Supply cap</dt>
                            <dd class="font-display font-bold">
                                {{ settlement.supplyCapacity }} units
                            </dd>
                        </div>
                        <div class="col-span-2">
                            <dt class="text-muted-foreground">Healing</dt>
                            <dd class="font-display font-bold">
                                {{ formatStat(settlement.healMultiplier, 1) }}×
                                near settlements
                            </dd>
                        </div>
                    </dl>
                </article>
            </div>

            <ul class="mt-6 grid gap-3 sm:grid-cols-2">
                <li
                    v-for="note in economyNotes"
                    :key="note.title"
                    class="flex gap-3 rounded-md border-2 border-foreground/15 bg-muted/30 px-4 py-3 text-sm"
                >
                    <div
                        class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border border-foreground/20 bg-card text-foreground"
                    >
                        <component
                            :is="economyIcon(note.icon)"
                            class="size-4"
                            stroke-width="2"
                            aria-hidden="true"
                        />
                    </div>
                    <div class="min-w-0">
                        <p class="font-display font-bold">{{ note.title }}</p>
                        <p class="mt-1 leading-relaxed text-muted-foreground">
                            {{ note.body }}
                        </p>
                    </div>
                </li>
            </ul>
        </section>

        <section class="wod-panel p-6">
            <div class="flex items-start gap-3">
                <div class="wod-logo-terrain size-10 shrink-0">
                    <Layers class="size-5" />
                </div>
                <div>
                    <h2 class="font-display text-xl font-bold">Terrain types</h2>
                    <p class="mt-1 text-sm text-muted-foreground">
                        Speed and attack use the War of Dots scale (plains infantry
                        speed&nbsp;=&nbsp;0.5, attack&nbsp;=&nbsp;0.08). The pixel
                        under a unit’s center determines which terrain applies. Mountains are
                        impassable; water tiles deal damage over time.
                    </p>
                </div>
            </div>

            <div class="mt-6 overflow-x-auto">
                <table class="w-full min-w-[52rem] border-collapse text-sm">
                    <thead>
                        <tr class="border-b-2 border-foreground text-left">
                            <th class="px-3 py-2 font-display font-bold">
                                Terrain
                            </th>
                            <th
                                class="px-3 py-2 text-center font-display font-bold"
                                colspan="3"
                            >
                                Infantry
                            </th>
                            <th
                                class="px-3 py-2 text-center font-display font-bold"
                                colspan="3"
                            >
                                Tank
                            </th>
                            <th class="px-3 py-2 font-display font-bold">
                                Notes
                            </th>
                        </tr>
                        <tr
                            class="border-b border-foreground/20 text-xs text-muted-foreground"
                        >
                            <th class="px-3 py-1" />
                            <th class="px-3 py-1 text-center">Speed</th>
                            <th class="px-3 py-1 text-center">Attack</th>
                            <th class="px-3 py-1 text-center">Def</th>
                            <th class="px-3 py-1 text-center">Speed</th>
                            <th class="px-3 py-1 text-center">Attack</th>
                            <th class="px-3 py-1 text-center">Def</th>
                            <th class="px-3 py-1" />
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="tile in terrain"
                            :key="tile.id"
                            class="border-b border-foreground/10 hover:bg-muted/20"
                        >
                            <td class="px-3 py-2.5">
                                <div class="flex items-center gap-2">
                                    <span
                                        class="size-4 shrink-0 border-2 border-foreground"
                                        :style="{ backgroundColor: tile.color }"
                                        aria-hidden="true"
                                    />
                                    <div>
                                        <p class="font-display font-bold">
                                            {{ tile.label }}
                                        </p>
                                        <p
                                            v-if="tile.isWater"
                                            class="text-xs text-sky-700 dark:text-sky-300"
                                        >
                                            Water · damage over time
                                        </p>
                                        <p
                                            v-else-if="tile.impassable"
                                            class="text-xs text-muted-foreground"
                                        >
                                            Impassable
                                        </p>
                                    </div>
                                </div>
                            </td>
                            <td
                                class="px-3 py-2.5 text-center tabular-nums"
                                :class="speedClass(tile.infantry.speed, tile.impassable)"
                            >
                                {{ formatStat(tile.infantry.speed) }}
                            </td>
                            <td class="px-3 py-2.5 text-center tabular-nums">
                                {{ formatStat(tile.infantry.attack) }}
                            </td>
                            <td class="px-3 py-2.5 text-center tabular-nums">
                                {{ formatStat(tile.infantry.defense, 1) }}
                            </td>
                            <td
                                class="px-3 py-2.5 text-center tabular-nums"
                                :class="speedClass(tile.tank.speed, tile.impassable)"
                            >
                                {{ formatStat(tile.tank.speed) }}
                            </td>
                            <td class="px-3 py-2.5 text-center tabular-nums">
                                {{ formatStat(tile.tank.attack) }}
                            </td>
                            <td class="px-3 py-2.5 text-center tabular-nums">
                                {{ formatStat(tile.tank.defense, 1) }}
                            </td>
                            <td class="max-w-xs px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
                                {{ tile.description }}
                                <span
                                    v-if="!tile.impassable"
                                    class="mt-1 block text-foreground/70"
                                >
                                    Tank attack vs infantry:
                                    {{
                                        attackRatio(
                                            tile.infantry.attack,
                                            tile.tank.attack,
                                        )
                                    }}
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <section class="wod-panel p-6">
            <div class="flex items-start gap-3">
                <div class="wod-logo-terrain size-10 shrink-0">
                    <Sparkles class="size-5" />
                </div>
                <div>
                    <h2 class="font-display text-xl font-bold">
                        Map generation styles
                    </h2>
                    <p class="mt-1 text-sm text-muted-foreground">
                        Choose a style in the Map Builder’s generate dialog (same team count and
                        optional seed as in-game). Previews below are 48×56-cell samples (seed
                        4&nbsp;242&nbsp;42) rendered with the editor terrain palette - not full
                        battlefield dimensions.
                    </p>
                </div>
            </div>

            <div class="mt-6 grid gap-6 sm:grid-cols-2">
                <article
                    v-for="style in mapGeneration"
                    :key="style.id"
                    class="overflow-hidden rounded-lg border-2 border-foreground bg-card shadow-sm"
                >
                    <figure class="border-b-2 border-foreground bg-[var(--wod-editor-void)]">
                        <img
                            :src="style.preview"
                            :alt="`Terrain preview for ${style.label} map generation`"
                            class="mx-auto block h-auto w-full max-h-56 object-contain"
                            width="224"
                            height="192"
                            loading="lazy"
                            decoding="async"
                        />
                    </figure>
                    <div class="p-5">
                        <div class="flex items-center gap-2">
                            <Map class="size-4 shrink-0 text-muted-foreground" stroke-width="2" />
                            <h3 class="font-display text-lg font-bold">
                                {{ style.label }}
                            </h3>
                        </div>
                        <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
                            {{ style.description }}
                        </p>
                        <ul class="mt-3 flex flex-wrap gap-2">
                            <li
                                v-for="trait in style.traits"
                                :key="trait"
                                class="wod-chip"
                            >
                                {{ trait }}
                            </li>
                        </ul>
                    </div>
                </article>
            </div>
        </section>
    </div>
</template>
