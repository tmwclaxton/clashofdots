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

class RecruitTroopTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        try {
            Redis::ping();
        } catch (\Throwable) {
            $this->markTestSkipped('Redis is required for recruit tests.');
        }
    }

    public function test_set_city_recruitment_toggles_enabled_flag(): void
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
            $state = $manager->getLiveState($game);

            // Find a city owned by slot 0.
            $ownedCity = null;
            foreach ($state['environment']['cities'] as $cityData) {
                if (($cityData['ownerSlot'] ?? null) === 0) {
                    $ownedCity = $cityData;
                    break;
                }
            }

            if ($ownedCity === null) {
                $this->markTestSkipped('No city owned by slot 0 at game start.');
            }

            $cityId = $ownedCity['id'];
            $enabledBefore = $ownedCity['recruitmentEnabled'] ?? true;

            // Toggle recruitment off.
            $this->actingAs($host)
                ->post(route('games.city-recruitment', $game), [
                    'city_id' => $cityId,
                    'enabled' => false,
                ])
                ->assertOk();

            $stateAfter = $manager->getLiveState($game);
            $cityAfter = collect($stateAfter['environment']['cities'])->firstWhere('id', $cityId);
            $this->assertFalse((bool) ($cityAfter['recruitmentEnabled'] ?? true), 'City should be toggled off.');

            // Toggle back on.
            $this->actingAs($host)
                ->post(route('games.city-recruitment', $game), [
                    'city_id' => $cityId,
                    'enabled' => true,
                ])
                ->assertOk();

            $stateBack = $manager->getLiveState($game);
            $cityBack = collect($stateBack['environment']['cities'])->firstWhere('id', $cityId);
            $this->assertTrue((bool) ($cityBack['recruitmentEnabled'] ?? true), 'City should be toggled back on.');
        } finally {
            Redis::del('game:live:'.$game->uuid);
            Redis::srem('games:active', $game->uuid);
        }
    }

    public function test_set_player_production_updates_global_sliders(): void
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
        $manager = app(GameManager::class);

        try {
            $this->actingAs($host)
                ->post(route('games.player-production', $game), [
                    'tank_ratio' => 60,
                    'speed_multiplier' => 2.5,
                ])
                ->assertOk();

            $state = $manager->getLiveState($game);
            $playerData = $state['environment']['players'][0];

            $this->assertSame(60, (int) $playerData['productionTankRatio']);
            $this->assertEqualsWithDelta(2.5, (float) $playerData['productionSpeedMultiplier'], 0.01);
        } finally {
            Redis::del('game:live:'.$game->uuid);
            Redis::srem('games:active', $game->uuid);
        }
    }
}
