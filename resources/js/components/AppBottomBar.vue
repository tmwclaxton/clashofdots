<script setup lang="ts">
import { usePage } from '@inertiajs/vue3';
import { computed } from 'vue';
import FactionSwatches from '@/components/FactionSwatches.vue';

const page = usePage();

const user = computed(() => page.props.auth.user);
</script>

<template>
    <footer class="wod-bar-bottom font-display px-6">
        <div
            class="relative flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center sm:justify-between sm:text-left"
        >
            <div class="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <FactionSwatches />
                <p>
                    <span class="font-bold text-foreground">War of Spheres</span>
                    <span v-if="user" class="text-foreground/70"> · </span>
                    <span v-if="user">Built with Irish Love ☘️</span>
                </p>
            </div>

            <p class="hidden text-xs font-semibold text-wod-green-dk md:block">
                Draw the plan. Win the war.
            </p>
        </div>
    </footer>
</template>
