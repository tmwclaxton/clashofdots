<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import { onMounted, onUnmounted, ref } from 'vue';
import MapEditorCanvas from '@/components/map-editor/MapEditorCanvas.vue';
import MapEditorToolbar from '@/components/map-editor/MapEditorToolbar.vue';
import MapListPanel from '@/components/map-editor/MapListPanel.vue';
import type { MapSummary } from '@/components/map-editor/MapListPanel.vue';
import MapTerrainPalette from '@/components/map-editor/MapTerrainPalette.vue';
import type { TerrainTypeRow } from '@/components/map-editor/MapTerrainPalette.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { MapDataPayload } from '@/composables/useMapEditor';
import { useMapEditor } from '@/composables/useMapEditor';
import { Redo2, Save, Undo2 } from 'lucide-vue-next';

const props = defineProps<{
    maps: MapSummary[];
    terrainTypes: TerrainTypeRow[];
    defaults: MapDataPayload;
}>();

const editor = useMapEditor(props.defaults);
const saving = ref(false);
const saveError = ref<string | null>(null);

async function onSave(): Promise<void> {
    saveError.value = null;
    saving.value = true;
    try {
        await editor.saveMap();
    } catch {
        saveError.value = 'Save failed. Check your connection and try again.';
    } finally {
        saving.value = false;
    }
}

function onBeforeUnload(e: BeforeUnloadEvent): void {
    if (editor.dirty.value) {
        e.preventDefault();
        e.returnValue = '';
    }
}

onMounted(() => {
    window.addEventListener('beforeunload', onBeforeUnload);
});

onUnmounted(() => {
    window.removeEventListener('beforeunload', onBeforeUnload);
});
</script>

<template>
    <Head title="Map Builder" />

    <div class="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-hidden">
        <div
            class="flex flex-wrap items-center gap-2 rounded-lg border-2 border-foreground bg-wod-paper px-3 py-2 shadow-sm"
        >
            <label class="sr-only" for="map-builder-name">Map name</label>
            <Input
                id="map-builder-name"
                v-model="editor.mapName"
                class="h-9 w-48 max-w-full border-2 border-foreground md:w-64"
                maxlength="120"
                placeholder="Map name"
                autocomplete="off"
            />
            <span
                v-if="editor.dirty"
                class="text-xs font-medium text-amber-700 dark:text-amber-400"
            >
                Unsaved changes
            </span>
            <span class="text-xs text-muted-foreground">
                Zoom {{ Math.round(editor.zoom * 100) }}%
            </span>
            <Button
                type="button"
                size="sm"
                variant="ghost"
                class="h-8 px-2 text-xs text-muted-foreground"
                title="Zoom to fit the whole map in the canvas"
                @click="editor.requestMapViewFit()"
            >
                Fit view
            </Button>
            <span class="text-xs text-muted-foreground"> Brush {{ editor.brushRadius }} </span>
            <span class="hidden text-xs text-muted-foreground sm:inline">
                [ / ] brush · right-drag pan
            </span>
            <div class="flex flex-1 flex-wrap items-center justify-end gap-2">
                <p v-if="saveError" class="w-full text-right text-xs text-destructive sm:w-auto">
                    {{ saveError }}
                </p>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    :disabled="!editor.canUndo"
                    class="gap-1"
                    @click="editor.undo()"
                >
                    <Undo2 class="size-3.5" />
                    Undo
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    :disabled="!editor.canRedo"
                    class="gap-1"
                    @click="editor.redo()"
                >
                    <Redo2 class="size-3.5" />
                    Redo
                </Button>
                <Button
                    type="button"
                    size="sm"
                    class="gap-1"
                    :disabled="saving"
                    @click="onSave"
                >
                    <Save class="size-3.5" />
                    {{ saving ? 'Saving…' : 'Save' }}
                </Button>
            </div>
        </div>

        <div class="flex min-h-0 flex-1 gap-2 overflow-hidden">
            <MapListPanel :editor="editor" :maps="maps" />
            <MapEditorToolbar :editor="editor" />
            <MapEditorCanvas :editor="editor" class="min-h-0 flex-1" />
        </div>

        <MapTerrainPalette :editor="editor" :terrain-types="terrainTypes" />
    </div>
</template>
