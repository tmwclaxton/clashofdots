<?php

namespace Tests\Feature;

use App\Enums\GameStatus;
use App\Games\GameConstants;
use App\Games\Services\GameManager;
use App\Models\Game;
use App\Models\GamePlayer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class GameLobbyTimeoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_expire_stale_lobbies_marks_old_open_lobbies_finished(): void
    {
        $host = User::factory()->create();
        $game = Game::factory()->create([
            'host_user_id' => $host->id,
            'status' => GameStatus::Lobby,
            'map_data' => [
                'source_uuid' => '00000000-0000-0000-0000-000000000001',
                'source_name' => 'Map',
                'source_author' => 'Author',
                'data' => ['teamCount' => 2],
            ],
        ]);

        DB::table('games')->where('id', $game->id)->update([
            'created_at' => now()->subHours(2),
            'updated_at' => now()->subHours(2),
        ]);
        $game->refresh();

        $n = app(GameManager::class)->expireStaleLobbies();
        $this->assertSame(1, $n);

        $game->refresh();
        $this->assertSame(GameStatus::Finished, $game->status);
        $this->assertSame(GameConstants::ABORTED_LOBBY_TIMEOUT, $game->settings['aborted_reason'] ?? null);
    }

    public function test_join_is_rejected_when_lobby_is_older_than_one_hour(): void
    {
        $host = User::factory()->create();
        $joiner = User::factory()->create();

        $game = Game::factory()->create([
            'host_user_id' => $host->id,
            'status' => GameStatus::Lobby,
            'max_players' => 2,
            'map_data' => [
                'source_uuid' => '00000000-0000-0000-0000-000000000001',
                'source_name' => 'Map',
                'source_author' => 'Author',
                'data' => ['teamCount' => 2],
            ],
        ]);

        GamePlayer::factory()->create([
            'game_id' => $game->id,
            'user_id' => $host->id,
            'slot' => 0,
        ]);

        DB::table('games')->where('id', $game->id)->update([
            'created_at' => now()->subHours(2),
            'updated_at' => now()->subHours(2),
        ]);

        $this->actingAs($joiner)
            ->post(route('games.join', $game))
            ->assertStatus(410);
    }
}
