<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import { Map } from 'lucide-vue-next';
import Heading from '@/components/Heading.vue';

const terrainTypes = [
    {
        name: 'Water',
        description: 'Slows movement and weakens attacks.',
        swatch: 'bg-wod-blue',
    },
    {
        name: 'Forest',
        description: 'Moderate cover with reduced speed.',
        swatch: 'bg-wod-green-dk',
    },
    {
        name: 'Mountains',
        description: 'Impassable barriers that shape the front line.',
        swatch: 'bg-wod-gray-dk',
    },
];
</script>

<template>
    <Head title="Map Builder" />

    <div class="flex flex-col gap-8">
        <Heading
            title="Map Builder"
            description="Design custom battlefields with terrain, cities, and spawn zones."
        />

        <div class="wod-panel-dashed p-10 text-center">
            <div class="wod-logo mx-auto mb-4 size-14">
                <Map class="size-7" />
            </div>
            <h2 class="font-display text-2xl font-bold">Coming soon</h2>
            <p class="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
                Paint terrain, place cities, and publish scenarios for your
                team to fight over.
            </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
            <article
                v-for="terrain in terrainTypes"
                :key="terrain.name"
                class="wod-panel flex gap-3 p-4"
            >
                <div
                    :class="['wod-swatch mt-0.5', terrain.swatch]"
                    aria-hidden="true"
                />
                <div>
                    <h3 class="font-bold">{{ terrain.name }}</h3>
                    <p class="mt-1 text-sm text-muted-foreground">
                        {{ terrain.description }}
                    </p>
                </div>
            </article>
        </div>
    </div>
</template>
