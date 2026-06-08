<script setup lang="ts">
import { usePage } from '@inertiajs/vue3';
import { Github } from 'lucide-vue-next';
import { computed } from 'vue';
import FactionSwatches from '@/components/FactionSwatches.vue';
import { GITHUB_REPOSITORY_URL } from '@/lib/site';

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
                    <span class="font-bold text-foreground">Clash of Dots</span>
                    <span v-if="user" class="text-foreground/70"> · </span>
                    <span v-if="user">Built with Irish Love ☘️</span>
                </p>
            </div>

            <div
                class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-semibold md:justify-end"
            >
                <a
                    :href="GITHUB_REPOSITORY_URL"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="wod-link inline-flex items-center gap-1.5"
                >
                    <Github class="size-3.5" />
                    Open source on GitHub
                </a>
                <p class="hidden text-wod-green-dk md:block">
                    Draw the plan. Win the war.
                </p>
            </div>
        </div>
    </footer>
</template>
