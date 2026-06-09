<?php

namespace App\Console\Commands;

use App\Games\GameConstants;
use App\Games\Logging\GameSimLog;
use App\Games\Services\GameManager;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class GameTickCommand extends Command
{
    private static float $lastEmptyActiveLogAt = 0.0;

    private static float $lastLobbySweepAt = 0.0;

    private static float $lastActiveSetSyncAt = 0.0;

    protected $signature = 'game:tick {--daemon : Run continuously}';

    protected $description = 'Run the Clash of Dots simulation tick loop';

    public function handle(GameManager $gameManager): int
    {
        $frameTime = 1 / GameConstants::TICK_RATE;

        do {
            $started = microtime(true);

            Redis::set(GameManager::TICK_DAEMON_HEARTBEAT_KEY, '1', 'EX', 2);

            $now = microtime(true);
            if ($now - self::$lastLobbySweepAt >= 15.0) {
                try {
                    $gameManager->expireStaleLobbies();
                } catch (\Throwable $e) {
                    Log::warning('Lobby expiry sweep failed; continuing tick loop.', [
                        'exception' => $e::class,
                        'message' => $e->getMessage(),
                    ]);
                }
                self::$lastLobbySweepAt = $now;
            }

            if ($now - self::$lastActiveSetSyncAt >= 5.0) {
                try {
                    $gameManager->syncActiveSetWithPlayingMatches();
                } catch (\Throwable $e) {
                    Log::warning('Active tick set sync failed; continuing tick loop.', [
                        'exception' => $e::class,
                        'message' => $e->getMessage(),
                    ]);
                }
                self::$lastActiveSetSyncAt = $now;
            }

            try {
                $gameManager->pruneStaleActiveGameUuids();
            } catch (\Throwable $e) {
                Log::warning('Active tick set prune failed; continuing tick loop.', [
                    'exception' => $e::class,
                    'message' => $e->getMessage(),
                ]);
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
