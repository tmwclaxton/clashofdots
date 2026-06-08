<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';

const props = withDefaults(
    defineProps<{
        class?: HTMLAttributes['class'];
    }>(),
    {},
);
</script>

<template>
    <img
        src="/favicon.svg"
        alt=""
        width="36"
        height="36"
        :class="
            cn(
                'pointer-events-none shrink-0 rounded-md border-2 border-foreground object-contain bg-wod-paper dark:bg-muted',
                props.class ?? 'size-9',
            )
        "
        decoding="async"
    />
</template>
