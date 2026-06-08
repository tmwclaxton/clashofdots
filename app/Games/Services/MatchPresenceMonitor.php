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
     * Commander count for arrays keyed by slot (environment first, then economy, then legacy pause flags).
     *
     * @param  array<string, mixed>  $state
     */
    public static function commanderSlotCount(array $state): int
    {
        $env = $state['environment'] ?? null;
        if (is_array($env) && isset($env['players']) && is_array($env['players'])) {
            $n = count($env['players']);
            if ($n > 0) {
                return $n;
            }
        }

        $economy = $state['economy'] ?? null;
        if (is_array($economy)) {
            $n = count($economy);
            if ($n > 0) {
                return $n;
            }
        }

        $legacyPause = $state['pauseRequests'] ?? null;

        return is_array($legacyPause) ? count($legacyPause) : 0;
    }

    /**
     * Ensures {@see $state} has a per-slot `lastPlayerActivityAt` array aligned with commander slots.
     *
     * @param  array<string, mixed>  $state
     */
    public static function normalizeLastActivity(array &$state): bool
    {
        $count = self::commanderSlotCount($state);
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
