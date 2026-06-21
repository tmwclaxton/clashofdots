<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import Heading from '@/components/Heading.vue';

defineProps<{
    title: string;
    description: string;
    lastUpdated: string;
}>();
</script>

<template>
    <Head :title="title" />

    <div class="flex flex-col gap-8 pb-4">
        <Heading :title="title" :description="description" />

        <article class="wod-panel space-y-8 p-6 sm:p-8">
            <p class="text-sm text-muted-foreground">
                Last updated: {{ lastUpdated }}
            </p>

            <slot />
        </article>
    </div>
</template>
