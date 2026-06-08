<?php

namespace App\Games\Services;

/**
 * Per-commander wall-clock activity for abandoning stalled matches.
 *
 * @internal
 */
final class MatchPresenceMonitor
{
    /**
     * Ensures {@see $state} has a per-slot `lastPlayerActivityAt` array aligned with `pauseRequests`.
     *
     * @param  array<string, mixed>  $state
     */
    public static function normalizeLastActivity(array &$state): bool
    {
        $pauseRequests = $state['pauseRequests'] ?? [];
        $count = count($pauseRequests);
        if ($count === 0) {
            return false;
        }

        $now = microtime(true);
        $raw = $state['lastPlayerActivityAt'] ?? [];
        if (! is_array($raw)) {
            $raw = [];
        }

        $dirty = ! isset($state['lastPlayerActivityAt']) || count($raw) !== $count;

        $normalized = [];
        for ($i = 0; $i < $count; $i++) {
            $normalized[$i] = isset($raw[$i]) && is_numeric($raw[$i])
                ? (float) $raw[$i]
                : $now;
            if (! isset($raw[$i]) || ! is_numeric($raw[$i])) {
                $dirty = true;
            }
        }

        $state['lastPlayerActivityAt'] = $normalized;

        return $dirty;
    }

    /**
     * @param  array<string, mixed>  $state
     */
    public static function everyoneIdleForAtLeast(array $state, int $seconds): bool
    {
        $timestamps = $state['lastPlayerActivityAt'] ?? [];
        if ($timestamps === []) {
            return false;
        }

        $now = microtime(true);
        foreach ($timestamps as $t) {
            if (($now - (float) $t) < $seconds) {
                return false;
            }
        }

        return true;
    }
}
