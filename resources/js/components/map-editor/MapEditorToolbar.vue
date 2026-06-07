<script setup lang="ts">
/* eslint-disable vue/no-mutating-props -- editor exposes mutable refs shared by map builder */
import {
    Circle,
    Eraser,
    Flag,
    Hand,
    Landmark,
    PaintBucket,
    Paintbrush,
    RectangleHorizontal,
} from 'lucide-vue-next';
import type { LucideIcon } from 'lucide-vue-next';
import type { MapEditorInstance, MapEditorTool } from '@/composables/useMapEditor';
import { cn } from '@/lib/utils';

const props = defineProps<{
    editor: MapEditorInstance;
}>();

const tools: { id: MapEditorTool; label: string; icon: LucideIcon }[] = [
    { id: 'brush', label: 'Brush', icon: Paintbrush },
    { id: 'eraser', label: 'Eraser', icon: Eraser },
    { id: 'fill', label: 'Fill', icon: PaintBucket },
    { id: 'capital', label: 'Capital', icon: Landmark },
    { id: 'flag', label: 'Flag', icon: Flag },
    { id: 'infantry', label: 'Infantry spawn', icon: Circle },
    { id: 'tank', label: 'Tank spawn', icon: RectangleHorizontal },
    { id: 'pan', label: 'Pan', icon: Hand },
];

function setTool(id: MapEditorTool): void {
    props.editor.activeTool.value = id;
}
</script>

<template>
    <div
        class="flex w-14 shrink-0 flex-col gap-1 wod-surface p-1"
        role="toolbar"
        aria-label="Map tools"
    >
        <button
            v-for="tool in tools"
            :key="tool.id"
            type="button"
            :class="
                cn(
                    'flex size-9 items-center justify-center rounded-md border border-transparent text-foreground transition-colors hover:bg-muted/80',
                    props.editor.activeTool.value === tool.id &&
                        'border-foreground bg-muted shadow-inner',
                )
            "
            :aria-pressed="props.editor.activeTool.value === tool.id"
            :aria-label="tool.label"
            :title="tool.label"
            @click="setTool(tool.id)"
        >
            <component :is="tool.icon" class="size-4" stroke-width="2" />
        </button>
    </div>
</template>
