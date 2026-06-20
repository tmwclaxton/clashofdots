<?php

namespace Tests\Feature\Console;

use App\Console\Commands\PruneStaleQuickStartEntriesCommand;
use App\Models\QuickStartEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PruneStaleQuickStartEntriesTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_deletes_stale_queued_entries(): void
    {
        $staleUser = User::factory()->create();
        QuickStartEntry::create([
            'user_id' => $staleUser->id,
            'status' => 'queued',
            'created_at' => now()->subMinutes(PruneStaleQuickStartEntriesCommand::STALE_AFTER_MINUTES + 1),
        ]);

        $this->artisan('quick-start:prune-stale')->assertSuccessful();

        $this->assertDatabaseMissing('quick_start_entries', ['user_id' => $staleUser->id]);
    }

    public function test_it_does_not_delete_recent_queued_entries(): void
    {
        $recentUser = User::factory()->create();
        QuickStartEntry::create([
            'user_id' => $recentUser->id,
            'status' => 'queued',
            'created_at' => now()->subMinutes(PruneStaleQuickStartEntriesCommand::STALE_AFTER_MINUTES - 1),
        ]);

        $this->artisan('quick-start:prune-stale')->assertSuccessful();

        $this->assertDatabaseHas('quick_start_entries', ['user_id' => $recentUser->id]);
    }

    public function test_it_does_not_delete_matched_entries(): void
    {
        $matchedUser = User::factory()->create();
        QuickStartEntry::create([
            'user_id' => $matchedUser->id,
            'status' => 'matched',
            'created_at' => now()->subHours(2),
        ]);

        $this->artisan('quick-start:prune-stale')->assertSuccessful();

        $this->assertDatabaseHas('quick_start_entries', ['user_id' => $matchedUser->id]);
    }

    public function test_dry_run_does_not_delete_entries(): void
    {
        $staleUser = User::factory()->create();
        QuickStartEntry::create([
            'user_id' => $staleUser->id,
            'status' => 'queued',
            'created_at' => now()->subMinutes(PruneStaleQuickStartEntriesCommand::STALE_AFTER_MINUTES + 5),
        ]);

        $this->artisan('quick-start:prune-stale', ['--dry-run' => true])->assertSuccessful();

        $this->assertDatabaseHas('quick_start_entries', ['user_id' => $staleUser->id]);
    }

    public function test_it_outputs_pruned_count(): void
    {
        $user = User::factory()->create();
        QuickStartEntry::create([
            'user_id' => $user->id,
            'status' => 'queued',
            'created_at' => now()->subMinutes(PruneStaleQuickStartEntriesCommand::STALE_AFTER_MINUTES + 1),
        ]);

        $this->artisan('quick-start:prune-stale')
            ->expectsOutputToContain('Pruned 1 stale queued entry')
            ->assertSuccessful();
    }
}
