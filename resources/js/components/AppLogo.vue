<script setup lang="ts">
import GameLogoMark from '@/components/GameLogoMark.vue';
</script>

<template>
    <div class="flex min-w-0 items-center gap-2">
        <GameLogoMark class="size-8" />
        <div class="grid min-w-0 flex-1 text-left text-sm">
            <span class="mb-0.5 truncate leading-tight font-semibold">Clash of Dots</span>
            <span class="truncate text-xs text-muted-foreground">Plan first, fight second</span>
        </div>
    </div>
</template>
