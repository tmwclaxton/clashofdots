<script setup lang="ts">
defineProps<{
    title: string;
}>();
</script>

<template>
    <section class="space-y-3">
        <h2 class="font-display text-lg font-bold text-foreground">
            {{ title }}
        </h2>
        <div class="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <slot />
        </div>
    </section>
</template>
