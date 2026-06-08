<?php

namespace App\Games\Logging;

use Illuminate\Support\Facades\Log;

/**
 * Opt-in simulation / match diagnostics (orders, ticks, active-set repair).
 *
 * Enable with {@see config('app.debug')} or `GAME_SIM_LOG=true` in `.env`.
 */
final class GameSimLog
{
    public static function enabled(): bool
    {
        if (config('app.debug')) {
            return true;
        }

        return filter_var(env('GAME_SIM_LOG', false), FILTER_VALIDATE_BOOL);
    }

    /**
     * @param  array<string, mixed>  $context
     */
    public static function info(string $message, array $context = []): void
    {
        if (! self::enabled()) {
            return;
        }

        Log::info($message, $context);
    }

    /**
     * @param  array<string, mixed>  $context
     */
    public static function warning(string $message, array $context = []): void
    {
        if (! self::enabled()) {
            return;
        }

        Log::warning($message, $context);
    }
}
