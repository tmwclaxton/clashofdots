<script setup lang="ts">
import { Minus, Plus } from 'lucide-vue-next';
import { computed } from 'vue';
import { MAP_EDITOR_BRUSH_SIZES } from '@/composables/useMapEditor';
import type {
    MapEditorBrushSize,
    MapEditorInstance,
} from '@/composables/useMapEditor';
import { cn } from '@/lib/utils';

const props = defineProps<{
    editor: MapEditorInstance;
}>();

const brushRadius = computed(() => props.editor.brushRadius.value);

const brushSizeIndex = computed(() => {
    const radius = props.editor.brushRadius.value as MapEditorBrushSize;

    return MAP_EDITOR_BRUSH_SIZES.indexOf(radius);
});

const canShrinkBrush = computed(() => brushSizeIndex.value > 0);
const canGrowBrush = computed(
    () =>
        brushSizeIndex.value >= 0 &&
        brushSizeIndex.value < MAP_EDITOR_BRUSH_SIZES.length - 1,
);

const visible = computed(
    () =>
        props.editor.activeTool.value === 'brush' ||
        props.editor.activeTool.value === 'eraser',
);

function selectBrushSize(size: MapEditorBrushSize): void {
    props.editor.setBrushRadius(size);
}
</script>

<template>
    <div
        v-if="visible"
        class="absolute top-3 left-3 z-20 flex w-max max-w-[min(16rem,calc(100%-1.5rem))] flex-col gap-1.5 rounded-md border-2 border-foreground bg-card/95 p-2 shadow-sm backdrop-blur-sm"
        role="region"
        aria-label="Brush size"
    >
        <p
            class="text-[10px] font-bold tracking-wide text-muted-foreground uppercase"
        >
            Brush size
        </p>
        <div class="flex items-center gap-1.5">
            <button
                type="button"
                class="flex size-8 shrink-0 items-center justify-center rounded-md border border-transparent text-foreground transition-colors hover:bg-muted/80 disabled:pointer-events-none disabled:opacity-35"
                :disabled="!canShrinkBrush"
                aria-label="Decrease brush size"
                title="Decrease brush size"
                @click="editor.bumpBrush(-1)"
            >
                <Minus class="size-3.5" stroke-width="2.5" />
            </button>
            <span
                class="flex min-w-[3.25rem] flex-1 flex-col items-center justify-center gap-1 rounded-md border border-foreground/15 bg-muted/40 px-2 py-1.5 font-mono text-xs font-semibold tabular-nums"
                :title="`Brush radius: ${brushRadius} tiles`"
            >
                <span
                    class="rounded-full border border-foreground/50 bg-foreground/20"
                    :style="{
                        width: `${6 + brushRadius * 3}px`,
                        height: `${6 + brushRadius * 3}px`,
                    }"
                    aria-hidden="true"
                />
                {{ brushRadius }}
            </span>
            <button
                type="button"
                class="flex size-8 shrink-0 items-center justify-center rounded-md border border-transparent text-foreground transition-colors hover:bg-muted/80 disabled:pointer-events-none disabled:opacity-35"
                :disabled="!canGrowBrush"
                aria-label="Increase brush size"
                title="Increase brush size"
                @click="editor.bumpBrush(1)"
            >
                <Plus class="size-3.5" stroke-width="2.5" />
            </button>
        </div>
        <div
            class="flex flex-wrap gap-0.5"
            role="group"
            aria-label="Brush size presets"
        >
            <button
                v-for="size in MAP_EDITOR_BRUSH_SIZES"
                :key="size"
                type="button"
                :class="
                    cn(
                        'min-w-[1.75rem] rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums transition-colors',
                        brushRadius === size
                            ? 'border-foreground bg-muted shadow-inner'
                            : 'border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted/50 hover:text-foreground',
                    )
                "
                :aria-pressed="brushRadius === size"
                :aria-label="`Brush size ${size}`"
                @click="selectBrushSize(size)"
            >
                {{ size }}
            </button>
        </div>
    </div>
</template>
