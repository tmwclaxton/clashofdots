<script setup lang="ts">
import type { MapEditorInstance, MapEditorTool } from '@/composables/useMapEditor';
import { cn } from '@/lib/utils';
import {
    type LucideIcon,
    Eraser,
    Hand,
    Link2,
    PaintBucket,
    Paintbrush,
} from 'lucide-vue-next';

const props = defineProps<{
    editor: MapEditorInstance;
}>();

const tools: { id: MapEditorTool; label: string; icon: LucideIcon }[] = [
    { id: 'brush', label: 'Brush', icon: Paintbrush },
    { id: 'eraser', label: 'Eraser', icon: Eraser },
    { id: 'fill', label: 'Fill', icon: PaintBucket },
    { id: 'bridge', label: 'Bridge overlay', icon: Link2 },
    { id: 'pan', label: 'Pan', icon: Hand },
];

function setTool(id: MapEditorTool): void {
    props.editor.activeTool.value = id;
}
</script>

<template>
    <div
        class="flex w-12 shrink-0 flex-col gap-1 rounded-lg border-2 border-foreground bg-wod-paper p-1 shadow-sm"
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
