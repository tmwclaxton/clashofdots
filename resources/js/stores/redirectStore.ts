import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * Tracks which games the user has already been auto-redirected into the
 * battlefield for. Each game UUID is redirected at most once per session so
 * that after the initial "your battle is ready" jump the user is free to
 * leave the play page and navigate elsewhere without being yanked back.
 */
export const useRedirectStore = defineStore('redirect', () => {
    const redirectedGameUuids = ref<Set<string>>(new Set());

    /** Returns true if we have already auto-redirected into `gameUuid`. */
    function hasRedirected(gameUuid: string): boolean {
        return redirectedGameUuids.value.has(gameUuid);
    }

    /** Marks `gameUuid` as already-redirected. */
    function markRedirected(gameUuid: string): void {
        redirectedGameUuids.value.add(gameUuid);
    }

    return { hasRedirected, markRedirected };
});
