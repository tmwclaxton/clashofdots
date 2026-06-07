<script setup lang="ts">
import { ref, watch } from 'vue';
import AppModal from '@/components/AppModal.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    MAP_GENERATION_TYPE_OPTIONS,
    type MapGenerationType,
} from '@/lib/generateRandomMap';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-vue-next';

const open = defineModel<boolean>('open', { required: true });

const props = defineProps<{
    dirty: boolean;
}>();

const emit = defineEmits<{
    generate: [payload: { seed?: number; type: MapGenerationType }];
}>();

const selectedType = ref<MapGenerationType>('mix');
const seed = ref('');

watch(open, (isOpen) => {
    if (isOpen) {
        selectedType.value = 'mix';
        seed.value = '';
    }
});

function parseSeedInput(raw: string): number | undefined {
    const t = raw.trim();
    if (t === '') {
        return undefined;
    }
    const n = Number.parseInt(t, 10);
    if (!Number.isFinite(n)) {
        return undefined;
    }

    return n;
}

function onGenerate(): void {
    emit('generate', {
        seed: parseSeedInput(seed.value),
        type: selectedType.value,
    });
    open.value = false;
}
</script>

<template>
    <AppModal
        v-model:open="open"
        title="Generate map"
        description="Replace the current map with procedurally generated terrain."
        content-class="sm:max-w-lg"
    >
        <div class="space-y-4" @keydown.stop>
            <p
                v-if="props.dirty"
                class="rounded-md border border-amber-300/80 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-100"
            >
                You have unsaved changes. Generating will discard them.
            </p>

            <div class="space-y-2">
                <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Generation style
                </p>
                <div class="grid gap-2 sm:grid-cols-2">
                    <button
                        v-for="option in MAP_GENERATION_TYPE_OPTIONS"
                        :key="option.id"
                        type="button"
                        :class="
                            cn(
                                'rounded-md border-2 px-3 py-2 text-left transition-shadow',
                                selectedType === option.id
                                    ? 'border-foreground bg-muted ring-2 ring-foreground/15'
                                    : 'border-transparent bg-muted/40 hover:border-muted-foreground/30',
                            )
                        "
                        @click="selectedType = option.id"
                    >
                        <span class="block text-sm font-semibold">{{ option.label }}</span>
                        <span class="mt-0.5 block text-xs text-muted-foreground">
                            {{ option.description }}
                        </span>
                    </button>
                </div>
            </div>

            <div class="space-y-1">
                <label class="text-xs font-semibold" for="map-generate-seed">
                    Random seed (optional)
                </label>
                <Input
                    id="map-generate-seed"
                    v-model="seed"
                    class="h-9 border-2 border-foreground font-mono text-xs"
                    inputmode="numeric"
                    placeholder="Leave empty for random"
                    autocomplete="off"
                />
            </div>
        </div>

        <template #footer>
            <Button type="button" variant="outline" @click="open = false">Cancel</Button>
            <Button type="button" class="gap-1.5" @click="onGenerate">
                <Sparkles class="size-3.5" />
                Generate
            </Button>
        </template>
    </AppModal>
</template>
