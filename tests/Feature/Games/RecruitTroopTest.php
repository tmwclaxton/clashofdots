<?php

namespace Tests\Feature\Games;

use App\Enums\GameStatus;
use App\Games\GameConstants;
use App\Games\Services\GameManager;
use App\Models\Game;
use App\Models\Map;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Redis;
use Predis\Client;
use Tests\TestCase;

class RecruitTroopTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        if (! extension_loaded('redis') && ! class_exists(Client::class)) {
            $this->markTestSkipped('Redis is required for recruit tests.');
        }
    }

    public function test_recruit_adds_troop_and_deducts_credits(): void
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
        $this->assertSame(GameStatus::Playing, $game->status);

        $manager = app(GameManager::class);

        try {
            $hostPlayer = $game->players()->where('user_id', $host->id)->firstOrFail();
            $this->assertSame(0, $hostPlayer->slot);

            $before = $manager->getLiveState($game);
            $troopCountBefore = count($before['environment']['players'][0]['troops']);
            $creditsBefore = (int) ($before['economy'][0]['credits'] ?? 0);

            $this->actingAs($host)
                ->post(route('games.recruit', $game))
                ->assertOk();

            $after = $manager->getLiveState($game);
            $troopCountAfter = count($after['environment']['players'][0]['troops']);
            $creditsAfter = (int) ($after['economy'][0]['credits'] ?? 0);

            $this->assertSame($troopCountBefore + 1, $troopCountAfter);
            $this->assertSame($creditsBefore - GameConstants::ECONOMY_RECRUIT_COST, $creditsAfter);
        } finally {
            Redis::del('game:live:'.$game->uuid);
            Redis::srem('games:active', $game->uuid);
        }
    }
}
