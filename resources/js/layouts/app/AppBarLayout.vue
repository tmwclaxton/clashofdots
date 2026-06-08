<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core';
import { usePage } from '@inertiajs/vue3';
import { computed } from 'vue';
import AppBottomBar from '@/components/AppBottomBar.vue';
import AppContent from '@/components/AppContent.vue';
import AppShell from '@/components/AppShell.vue';
import AppToast from '@/components/AppToast.vue';
import AppTopBar from '@/components/AppTopBar.vue';

const page = usePage();
const isLargeScreen = useMediaQuery('(min-width: 1024px)');

const isMapBuilder = computed(() => page.component === 'MapBuilder');
const useMapBuilderChrome = computed(
    () => isMapBuilder.value && isLargeScreen.value,
);

const contentClass = computed(() =>
    useMapBuilderChrome.value
        ? 'mx-auto flex h-full min-h-0 w-full max-w-none flex-1 flex-col overflow-hidden px-2 py-2'
        : 'mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-5 sm:px-6 sm:py-8',
);
</script>

<template>
    <AppShell variant="header">
        <div
            :class="
                useMapBuilderChrome
                    ? 'wod-page wod-page-map-builder flex h-svh max-h-svh min-h-0 flex-col overflow-hidden'
                    : 'wod-page flex min-h-svh min-w-0 flex-col overflow-x-hidden'
            "
        >
            <AppTopBar />
            <AppContent variant="header" :class="contentClass">
                <slot />
            </AppContent>
            <AppBottomBar />
            <AppToast />
        </div>
    </AppShell>
</template>
