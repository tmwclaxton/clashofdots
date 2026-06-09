<?php

namespace App\Console\Commands;

use App\Enums\GameStatus;
use App\Games\Services\GameManager;
use App\Models\Game;
use Illuminate\Console\Command;

class GameActiveSetCommand extends Command
{
    protected $signature = 'game:active-set {--repair : Re-register Playing matches that have live Redis JSON, then prune stale UUIDs}';

    protected $description = 'Show Redis key prefix and tick-loop active set (logical key: games:active). Raw redis-cli must include the Laravel prefix.';

    public function handle(GameManager $gameManager): int
    {
        $prefix = (string) config('database.redis.options.prefix', '');
        $logicalKey = 'games:active';
        $rawKey = $prefix.$logicalKey;

        $this->info('Logical Redis set key: '.$logicalKey);
        $this->info('Laravel key prefix (from config): '.($prefix !== '' ? $prefix : '(empty)'));
        $this->info('Full key for redis-cli: '.$rawKey);
        $this->newLine();

        try {
            $uuids = $gameManager->activeGameUuids();
            $this->line('Active tick UUIDs (via app Redis, '.count($uuids).'): '.json_encode(array_values($uuids)));
        } catch (\Throwable $e) {
            $this->error('Could not read active set from Redis: '.$e->getMessage());

            return self::FAILURE;
        }

        try {
            $playing = Game::query()->where('status', GameStatus::Playing)->count();
            $this->line('Playing matches (DB): '.$playing);
        } catch (\Throwable $e) {
            $this->warn('Could not query Playing matches (run inside Sail if DB is in Docker): '.$e->getMessage());
        }

        $this->newLine();

        $this->comment('Example: ./vendor/bin/sail exec redis redis-cli SMEMBERS "'.$rawKey.'"');
        $this->comment('Or search: ./vendor/bin/sail exec redis redis-cli KEYS "*games:active*"');

        if ($this->option('repair')) {
            try {
                $gameManager->syncActiveSetWithPlayingMatches();
            } catch (\Throwable $e) {
                $this->error('syncActiveSetWithPlayingMatches failed: '.$e->getMessage());

                return self::FAILURE;
            }
            try {
                $gameManager->pruneStaleActiveGameUuids();
            } catch (\Throwable $e) {
                $this->error('pruneStaleActiveGameUuids failed: '.$e->getMessage());

                return self::FAILURE;
            }
            $after = $gameManager->activeGameUuids();
            $this->newLine();
            $this->info('After --repair: '.json_encode(array_values($after)));
        }

        return self::SUCCESS;
    }
}
