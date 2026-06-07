<script setup lang="ts">
import { computed } from 'vue';
import { usePage } from '@inertiajs/vue3';
import AppBottomBar from '@/components/AppBottomBar.vue';
import AppContent from '@/components/AppContent.vue';
import AppShell from '@/components/AppShell.vue';
import AppToast from '@/components/AppToast.vue';
import AppTopBar from '@/components/AppTopBar.vue';

const page = usePage();

const contentClass = computed(() =>
    page.component === 'MapBuilder'
        ? 'mx-auto flex h-full min-h-0 w-full max-w-none flex-1 flex-col overflow-hidden px-2 py-2'
        : 'mx-auto w-full max-w-6xl flex-1 px-6 py-8',
);
</script>

<template>
    <AppShell variant="header">
        <div
            :class="
                page.component === 'MapBuilder'
                    ? 'wod-page wod-page-map-builder flex h-svh max-h-svh min-h-0 flex-col overflow-hidden'
                    : 'wod-page flex min-h-svh flex-col'
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
