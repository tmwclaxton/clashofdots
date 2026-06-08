<?php

namespace App\Console\Commands;

use App\Games\GameConstants;
use App\Games\Logging\GameSimLog;
use App\Games\Services\GameManager;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class GameTickCommand extends Command
{
    private static float $lastEmptyActiveLogAt = 0.0;

    private static float $lastLobbySweepAt = 0.0;

    protected $signature = 'game:tick {--daemon : Run continuously}';

    protected $description = 'Run the Clash of Dots simulation tick loop';

    public function handle(GameManager $gameManager): int
    {
        $frameTime = 1 / GameConstants::TICK_RATE;

        do {
            $started = microtime(true);

            $now = microtime(true);
            if ($now - self::$lastLobbySweepAt >= 15.0) {
                $gameManager->expireStaleLobbies();
                self::$lastLobbySweepAt = $now;
            }

            $activeUuids = $gameManager->activeGameUuids();

            if ($activeUuids === [] && GameSimLog::enabled()) {
                $nowLoop = microtime(true);
                if ($nowLoop - self::$lastEmptyActiveLogAt >= 10.0) {
                    self::$lastEmptyActiveLogAt = $nowLoop;
                    GameSimLog::info('game.tick.loop_no_active_games', []);
                }
            }

            foreach ($activeUuids as $uuid) {
                $game = $gameManager->findByUuid($uuid);

                if ($game) {
                    try {
                        $gameManager->tick($game);
                    } catch (\Throwable $e) {
                        Log::error('Game tick failed; continuing loop.', [
                            'game_uuid' => $uuid,
                            'exception' => $e::class,
                            'message' => $e->getMessage(),
                        ]);
                    }
                }
            }

            $elapsed = microtime(true) - $started;
            $sleep = $frameTime - $elapsed;

            if ($sleep > 0) {
                usleep((int) ($sleep * 1_000_000));
            }
        } while ($this->option('daemon'));

        return self::SUCCESS;
    }
}
