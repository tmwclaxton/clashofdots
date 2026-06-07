<script setup lang="ts">
/* eslint-disable vue/no-mutating-props -- editor exposes mutable refs shared by map builder */
import type { MapEditorInstance } from '@/composables/useMapEditor';
import type { TerrainId } from '@/lib/terrainCatalog';
import { cn } from '@/lib/utils';

export type TerrainTypeRow = {
    id: string;
    label: string;
    color: string;
    isWater: boolean;
};

const props = defineProps<{
    editor: MapEditorInstance;
    terrainTypes: TerrainTypeRow[];
}>();

function selectTerrain(id: string): void {
    if (!props.terrainTypes.some((t) => t.id === id)) {
        return;
    }

    props.editor.selectedTerrain.value = id as TerrainId;

    if (
        props.editor.activeTool.value === 'pan'
        || props.editor.activeTool.value === 'capital'
        || props.editor.activeTool.value === 'flag'
        || props.editor.activeTool.value === 'infantry'
        || props.editor.activeTool.value === 'tank'
    ) {
        props.editor.activeTool.value = 'brush';
    }
}
</script>

<template>
    <div
        class="wod-panel flex min-h-0 w-full min-w-0 flex-col gap-1.5 overflow-hidden rounded-lg border-2 border-foreground p-2 sm:p-2.5"
    >
        <p
            class="font-display text-[11px] font-bold uppercase tracking-wide text-foreground sm:text-xs"
        >
            Terrain
        </p>
        <div
            class="flex max-w-full min-w-0 flex-wrap content-start gap-1.5"
        >
            <button
                v-for="t in terrainTypes"
                :key="t.id"
                type="button"
                :class="
                    cn(
                        'flex min-w-[3.35rem] shrink-0 flex-col items-center gap-0.5 rounded-md border-2 px-1 py-1 text-[10px] font-semibold leading-tight text-foreground transition-shadow sm:min-w-[3.75rem] sm:gap-0.5 sm:px-1 sm:py-1.5 sm:text-xs',
                        editor.selectedTerrain.value === t.id
                            ? 'border-foreground ring-2 ring-foreground/25'
                            : 'border-transparent hover:border-muted-foreground/50',
                    )
                "
                :title="t.label"
                @click="selectTerrain(t.id)"
            >
                <span
                    class="size-5 shrink-0 rounded border border-foreground/35 shadow-sm sm:size-6"
                    :style="{ backgroundColor: t.color }"
                    aria-hidden="true"
                />
                <span class="max-w-[5.5rem] text-center text-pretty leading-tight">{{ t.label }}</span>
            </button>
        </div>
    </div>
</template>
