<script setup lang="ts">
type Props = {
    title: string;
    description?: string;
    variant?: 'default' | 'small';
};

withDefaults(defineProps<Props>(), {
    variant: 'default',
});
</script>

<template>
    <header :class="variant === 'small' ? '' : 'mb-8 space-y-1'">
        <h2
            :class="
                variant === 'small'
                    ? 'font-display mb-0.5 text-base font-bold'
                    : 'font-display text-2xl font-bold tracking-tight md:text-3xl'
            "
        >
            {{ title }}
        </h2>
        <p
            v-if="description"
            class="max-w-2xl text-sm leading-relaxed text-muted-foreground"
        >
            {{ description }}
        </p>
    </header>
</template>
