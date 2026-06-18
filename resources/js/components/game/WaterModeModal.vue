<script setup lang="ts">
import { Button } from '@/components/ui/button';

defineProps<{
    visible: boolean;
}>();

const emit = defineEmits<{
    choose: [mode: 'wade' | 'embark'];
    dismiss: [];
}>();
</script>

<template>
    <Transition
        enter-active-class="transition-opacity duration-150"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
    >
        <div
            v-if="visible"
            class="absolute inset-0 z-20 flex items-center justify-center"
            @click.self="emit('dismiss')"
        >
            <div class="w-72 rounded-xl border border-border/60 bg-background/95 shadow-2xl backdrop-blur-sm">
                <div class="border-b border-border/40 px-4 py-3">
                    <p class="text-sm font-semibold">Cross Water</p>
                    <p class="mt-0.5 text-[0.7rem] text-muted-foreground">
                        How should this unit cross the water?
                    </p>
                </div>

                <div class="flex flex-col gap-2 p-4">
                    <!-- Wade option -->
                    <button
                        class="group flex w-full items-start gap-3 rounded-lg border border-border/40 bg-muted/30 px-3 py-2.5 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
                        @click="emit('choose', 'wade')"
                    >
                        <span class="mt-0.5 text-base leading-none">~</span>
                        <div>
                            <p class="text-xs font-semibold group-hover:text-primary">Wade</p>
                            <p class="mt-0.5 text-[0.65rem] leading-snug text-muted-foreground">
                                Move through as a troop. Fast for short river crossings but takes continuous damage. Cannot enter deep water.
                            </p>
                        </div>
                    </button>

                    <!-- Embark option -->
                    <button
                        class="group flex w-full items-start gap-3 rounded-lg border border-border/40 bg-muted/30 px-3 py-2.5 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
                        @click="emit('choose', 'embark')"
                    >
                        <span class="mt-0.5 text-base leading-none">&#9635;</span>
                        <div>
                            <p class="text-xs font-semibold group-hover:text-primary">Embark</p>
                            <p class="mt-0.5 text-[0.65rem] leading-snug text-muted-foreground">
                                Convert to a ship at the shore. Takes ~3 s but moves faster on water and can cross deep water without damage.
                            </p>
                        </div>
                    </button>
                </div>

                <div class="border-t border-border/40 px-4 py-2.5">
                    <Button
                        variant="ghost"
                        size="sm"
                        class="w-full text-xs"
                        @click="emit('dismiss')"
                    >
                        Cancel (default: Embark)
                    </Button>
                </div>
            </div>
        </div>
    </Transition>
</template>
