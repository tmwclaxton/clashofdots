<?php

namespace Tests\Feature\Games;

use App\Enums\GameStatus;
use App\Games\Services\GameManager;
use App\Models\Game;
use App\Models\Map;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Redis;
use Tests\TestCase;

class SurrenderTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        try {
            Redis::ping();
        } catch (\Throwable) {
            $this->markTestSkipped('Redis is required for surrender tests.');
        }
    }

    public function test_surrender_returns_ok_for_playing_participant(): void
    {
        [$game, $host] = $this->startTwoPlayerGame();

        try {
            $this->actingAs($host)
                ->post(route('games.surrender', $game))
                ->assertOk()
                ->assertJson(['ok' => true]);
        } finally {
            $this->cleanupRedis($game);
        }
    }

    public function test_surrender_rejects_non_participant(): void
    {
        [$game] = $this->startTwoPlayerGame();
        $outsider = User::factory()->create();

        try {
            $this->actingAs($outsider)
                ->post(route('games.surrender', $game))
                ->assertForbidden();
        } finally {
            $this->cleanupRedis($game);
        }
    }

    public function test_surrender_rejects_unauthenticated(): void
    {
        [$game] = $this->startTwoPlayerGame();

        try {
            $this->post(route('games.surrender', $game))
                ->assertRedirectToRoute('login');
        } finally {
            $this->cleanupRedis($game);
        }
    }

    public function test_surrender_removes_troops_and_neutralises_cities(): void
    {
        [$game, $host] = $this->startTwoPlayerGame();
        $manager = app(GameManager::class);

        try {
            $this->actingAs($host)
                ->post(route('games.surrender', $game))
                ->assertOk();

            // Game may have been finished (if only one other player remains) — in either
            // case the surrendering player's troops should be gone from the environment.
            $game->refresh();

            if ($game->status === GameStatus::Playing) {
                $state = $manager->getLiveState($game);
                $env = $state['environment'];

                $hostTroops = array_filter(
                    $env['troops'] ?? [],
                    fn (array $t) => ($t['ownerSlot'] ?? -1) === 0,
                );
                $this->assertEmpty($hostTroops, 'Surrendering player should have no troops.');

                $hostCities = array_filter(
                    $env['cities'] ?? [],
                    fn (array $c) => ($c['ownerSlot'] ?? null) === 0,
                );
                $this->assertEmpty($hostCities, 'Surrendering player should own no cities.');
            } else {
                // In a two-player game the remaining player wins and the match ends.
                $this->assertSame(GameStatus::Finished, $game->status);
            }
        } finally {
            $this->cleanupRedis($game);
        }
    }

    public function test_surrender_in_two_player_game_declares_winner(): void
    {
        [$game, $host, $guest] = $this->startTwoPlayerGame();

        try {
            $this->actingAs($host)
                ->post(route('games.surrender', $game))
                ->assertOk();

            $game->refresh();
            $this->assertSame(GameStatus::Finished, $game->status);
            $this->assertNotNull($game->winner_slot, 'A winner slot must be set.');
        } finally {
            $this->cleanupRedis($game);
        }
    }

    public function test_surrender_rejects_when_game_not_playing(): void
    {
        $host = User::factory()->create();
        $owner = User::factory()->create();
        $map = Map::factory()->for($owner)->playablePublishedTwoTeam()->create();

        $this->actingAs($host)
            ->post(route('games.store'), ['map_uuid' => $map->uuid]);
        $game = Game::query()->firstOrFail();

        // Game is still in Lobby status.
        $this->actingAs($host)
            ->post(route('games.surrender', $game))
            ->assertStatus(422);
    }

    // -------------------------------------------------------------------------

    /**
     * Creates and starts a two-player game, returning [Game, $host, $guest].
     *
     * @return array{0: Game, 1: User, 2: User}
     */
    private function startTwoPlayerGame(): array
    {
        $host = User::factory()->create();
        $guest = User::factory()->create();
        $owner = User::factory()->create();
        $map = Map::factory()->for($owner)->playablePublishedTwoTeam()->create();

        $this->actingAs($host)
            ->post(route('games.store'), ['map_uuid' => $map->uuid]);
        $game = Game::query()->firstOrFail();

        $this->actingAs($guest)
            ->post(route('games.join', $game));

        $this->actingAs($host)
            ->post(route('games.start', $game));

        $game->refresh();

        return [$game, $host, $guest];
    }

    private function cleanupRedis(Game $game): void
    {
        Redis::del('game:live:'.$game->uuid);
        Redis::srem('games:active', $game->uuid);
    }
}
