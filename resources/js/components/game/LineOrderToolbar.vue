<script setup lang="ts">
defineProps<{
    /** Screen-space position (pixels from top-left of the canvas container). */
    position: { x: number; y: number };
    /** Currently active line-order mode, or null if no mode is selected. */
    activeMode: null | 'advance' | 'defend';
}>();

const emit = defineEmits<{
    'set-mode': [mode: 'advance' | 'defend'];
    cancel: [];
}>();
</script>

<template>
    <div
        class="absolute z-30 -translate-x-1/2 -translate-y-full"
        :style="{ left: `${position.x}px`, top: `${position.y - 12}px` }"
    >
        <div class="wod-panel flex flex-row gap-0 overflow-hidden p-0">
            <button
                class="flex min-w-[80px] flex-col items-center gap-1 px-3 py-2 text-xs font-bold uppercase transition-colors"
                :class="
                    activeMode === 'advance'
                        ? 'bg-yellow-400 text-black'
                        : 'hover:bg-white/10'
                "
                @click="emit('set-mode', 'advance')"
            >
                <span class="text-base leading-none">&#8594;</span>
                Advance
            </button>
            <div class="w-px self-stretch bg-black/40 dark:bg-white/20" />
            <button
                class="flex min-w-[80px] flex-col items-center gap-1 px-3 py-2 text-xs font-bold uppercase transition-colors"
                :class="
                    activeMode === 'defend'
                        ? 'bg-blue-400 text-black'
                        : 'hover:bg-white/10'
                "
                @click="emit('set-mode', 'defend')"
            >
                <span class="text-base leading-none">&#9632;</span>
                Defend
            </button>
            <div class="w-px self-stretch bg-black/40 dark:bg-white/20" />
            <button
                class="px-2 py-2 text-xs text-muted-foreground transition-colors hover:bg-white/10"
                title="Cancel (Esc)"
                @click="emit('cancel')"
            >
                ✕
            </button>
        </div>
    </div>
</template>
