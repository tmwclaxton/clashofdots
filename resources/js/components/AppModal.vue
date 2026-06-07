<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const open = defineModel<boolean>('open', { required: true });

const props = withDefaults(
    defineProps<{
        title: string;
        description?: string;
        contentClass?: HTMLAttributes['class'];
        showCloseButton?: boolean;
    }>(),
    {
        showCloseButton: true,
    },
);
</script>

<template>
    <Dialog v-model:open="open">
        <DialogContent
            :show-close-button="showCloseButton"
            :class="cn('border-2 border-foreground sm:max-w-md', contentClass)"
        >
            <DialogHeader>
                <DialogTitle class="font-display">{{ title }}</DialogTitle>
                <DialogDescription v-if="description">
                    {{ description }}
                </DialogDescription>
            </DialogHeader>

            <slot />

            <DialogFooter v-if="$slots.footer" class="gap-2 sm:justify-end">
                <slot name="footer" />
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
