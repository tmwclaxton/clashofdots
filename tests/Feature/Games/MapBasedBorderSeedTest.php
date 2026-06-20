<?php

namespace Tests\Feature\Games;

use App\Games\Engine\Environment;
use App\Games\GameConstants;
use Database\Factories\MapFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MapBasedBorderSeedTest extends TestCase
{
    use RefreshDatabase;

    /**
     * When a map-builder game starts, every player's starting troop must sit
     * inside a territory cell that has a connected own-territory path back to
     * their capital — otherwise the supply-cut HP drain fires on tick 1.
     */
    public function test_map_based_game_seeds_initial_borders_so_troops_are_in_supply(): void
    {
        $mapData = (new MapFactory)->playablePublishedTwoTeam()->raw()['data'];

        $environment = Environment::fromMapEditorData(12345, 2, $mapData, []);

        $cs = GameConstants::CELL_SIZE;

        foreach ($environment->players as $player) {
            $this->assertNotEmpty($player->troops, "Player {$player->slot} should have at least one starting troop.");

            foreach ($player->troops as $troop) {
                $gx = max(0, min($environment->gridMaxX, (int) ($troop->position[0] / $cs)));
                $gy = max(0, min($environment->gridMaxY, (int) ($troop->position[1] / $cs)));

                $influence = $player->border->grid[$gx][$gy] ?? 0.0;

                $this->assertGreaterThan(
                    GameConstants::TERRITORY_CLAIM_THRESHOLD,
                    $influence,
                    "Player {$player->slot} troop at [{$troop->position[0]}, {$troop->position[1]}] (grid {$gx},{$gy}) has no border influence ({$influence}). Troops will be supply-cut from tick 1.",
                );
            }
        }
    }

    public function test_map_based_game_seeds_initial_borders_for_owned_cities(): void
    {
        $mapData = (new MapFactory)->playablePublishedTwoTeam()->raw()['data'];

        $environment = Environment::fromMapEditorData(12345, 2, $mapData, []);

        $cs = GameConstants::CELL_SIZE;

        foreach ($environment->players as $player) {
            $ownedCities = array_filter($environment->cities, fn ($c) => $c->owner === $player);
            $this->assertNotEmpty($ownedCities, "Player {$player->slot} should own at least one city.");

            foreach ($ownedCities as $city) {
                $gx = max(0, min($environment->gridMaxX, (int) ($city->position[0] / $cs)));
                $gy = max(0, min($environment->gridMaxY, (int) ($city->position[1] / $cs)));

                $influence = $player->border->grid[$gx][$gy] ?? 0.0;

                $this->assertGreaterThan(
                    GameConstants::TERRITORY_CLAIM_THRESHOLD,
                    $influence,
                    "Player {$player->slot} city at grid {$gx},{$gy} has no border influence ({$influence}).",
                );
            }
        }
    }
}
