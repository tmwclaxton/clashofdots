<?php

namespace Tests\Feature;

use App\Enums\GameStatus;
use App\Models\Game;
use App\Models\GamePlayer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class ProfileLeaderboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_leaderboard_page_is_public(): void
    {
        $this->get(route('leaderboard.index'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('community/Leaderboard')
                ->has('leaderboard'));
    }

    public function test_unknown_profile_returns_404(): void
    {
        $this->get(route('profiles.show', ['profile' => (string) Str::uuid()]))
            ->assertNotFound();
    }

    public function test_profile_and_leaderboard_reflect_finished_matches(): void
    {
        $alice = User::factory()->create(['name' => 'Alice Leader']);
        $bob = User::factory()->create(['name' => 'Bob Loser']);

        $game = Game::factory()->create([
            'host_user_id' => $alice->id,
            'status' => GameStatus::Finished,
            'winner_user_id' => $alice->id,
            'winner_slot' => 0,
            'finished_at' => now(),
        ]);

        GamePlayer::factory()->for($game)->create([
            'user_id' => $alice->id,
            'slot' => 0,
            'color' => '#ff0000',
        ]);
        GamePlayer::factory()->for($game)->create([
            'user_id' => $bob->id,
            'slot' => 1,
            'color' => '#0000ff',
        ]);

        $this->get(route('profiles.show', ['profile' => $alice->profile_uuid]))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('community/ProfileShow')
                ->where('profile.name', 'Alice Leader')
                ->where('stats.wins', 1)
                ->where('stats.matchesPlayed', 1)
                ->where('stats.losses', 0));

        $this->get(route('profiles.show', ['profile' => $bob->profile_uuid]))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('stats.wins', 0)
                ->where('stats.matchesPlayed', 1)
                ->where('stats.losses', 1));

        $this->get(route('leaderboard.index'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('community/Leaderboard')
                ->has('leaderboard', 2));
    }
}
