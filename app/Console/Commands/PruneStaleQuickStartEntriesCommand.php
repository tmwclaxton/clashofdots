<?php

namespace App\Console\Commands;

use App\Models\QuickStartEntry;
use Illuminate\Console\Command;

class PruneStaleQuickStartEntriesCommand extends Command
{
    /**
     * Minutes a queued entry may remain without being matched before it is pruned.
     * This covers users who close their browser without explicitly leaving the queue.
     */
    public const int STALE_AFTER_MINUTES = 10;

    protected $signature = 'quick-start:prune-stale {--dry-run : Report without deleting}';

    protected $description = 'Remove queued Quick Start entries that have not been matched within '.self::STALE_AFTER_MINUTES.' minutes';

    public function handle(): int
    {
        $cutoff = now()->subMinutes(self::STALE_AFTER_MINUTES);

        $query = QuickStartEntry::query()
            ->where('status', 'queued')
            ->where('created_at', '<', $cutoff);

        $count = $query->count();

        if ($count === 0) {
            $this->line('No stale Quick Start entries found.');

            return self::SUCCESS;
        }

        if ($this->option('dry-run')) {
            $this->line("Would prune {$count} stale queued ".str('entry')->plural($count).'.');

            return self::SUCCESS;
        }

        $query->delete();

        $this->line("Pruned {$count} stale queued ".str('entry')->plural($count).'.');

        return self::SUCCESS;
    }
}
