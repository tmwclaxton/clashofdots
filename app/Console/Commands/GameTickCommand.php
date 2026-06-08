<?php

namespace App\Console\Commands;

use App\Games\GameConstants;
use App\Games\Services\GameManager;
use Illuminate\Console\Command;

class GameTickCommand extends Command
{
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

            foreach ($gameManager->activeGameUuids() as $uuid) {
                $game = $gameManager->findByUuid($uuid);

                if ($game) {
                    $gameManager->tick($game);
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
