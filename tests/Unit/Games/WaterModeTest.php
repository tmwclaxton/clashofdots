<?php

namespace Tests\Unit\Games;

use App\Games\Engine\Environment;
use App\Games\Engine\Troop;
use App\Games\GameConstants;
use Tests\TestCase;

class WaterModeTest extends TestCase
{
    /**
     * Teleport a troop into a water grid cell by mutating the terrain marching grid
     * and moving the troop to the center of that cell.
     */
    private function placeOnWater(Environment $environment, Troop $troop): void
    {
        $cs = GameConstants::CELL_SIZE;
        // Use grid cell (1,1) - well within the grid.
        $gx = 1;
        $gy = 1;
        // Set a value clearly below the water threshold (-0.1).
        $environment->terrainMarching->grid[$gx][$gy] = -0.15;
        // Clear forest overlay so the cell isn't classified as forest.
        $environment->forestMarching->grid[$gx][$gy] = 0.0;

        $troop->position = [(float) ($gx * $cs), (float) ($gy * $cs)];
        $troop->path = [];
    }

    /**
     * Teleport a troop onto a deep_water grid cell.
     * Deep water elevation must be ≤ DEEP_WATER_ELEVATION_THRESHOLD (-0.2).
     */
    private function placeOnDeepWater(Environment $environment, Troop $troop): void
    {
        $cs = GameConstants::CELL_SIZE;
        $gx = 2;
        $gy = 1;
        $environment->terrainMarching->grid[$gx][$gy] = GameConstants::DEEP_WATER_ELEVATION;
        $environment->forestMarching->grid[$gx][$gy] = 0.0;

        $troop->position = [(float) ($gx * $cs), (float) ($gy * $cs)];
        $troop->path = [];
    }

    // -------------------------------------------------------------------------
    // waterMode field serialization
    // -------------------------------------------------------------------------

    public function test_troop_default_water_mode_is_embark(): void
    {
        $environment = Environment::create(100, 2);
        $troop = $environment->players[0]->troops[0];

        $this->assertSame('embark', $troop->waterMode);
    }

    public function test_troop_serializes_and_deserializes_water_mode(): void
    {
        $environment = Environment::create(101, 2);
        $troop = $environment->players[0]->troops[0];
        $troop->waterMode = 'wade';

        $data = $troop->toArray();
        $this->assertSame('wade', $data['waterMode']);

        $restored = Troop::fromArray($data, $troop->owner);
        $this->assertSame('wade', $restored->waterMode);
    }

    public function test_troop_from_array_defaults_unknown_water_mode_to_embark(): void
    {
        $environment = Environment::create(102, 2);
        $troop = $environment->players[0]->troops[0];
        $data = $troop->toArray();
        $data['waterMode'] = 'invalid_value';

        $restored = Troop::fromArray($data, $troop->owner);

        $this->assertSame('embark', $restored->waterMode);
    }

    // -------------------------------------------------------------------------
    // assignTroopPathsFromOrders - waterMode protocol
    // -------------------------------------------------------------------------

    public function test_assign_orders_sets_water_mode_from_third_tuple_element(): void
    {
        $environment = Environment::create(200, 2);
        $troop = $environment->players[0]->troops[0];

        $environment->assignTroopPathsFromOrders([
            [$troop->id, [[100.0, 100.0]], 'wade'],
        ]);

        $this->assertSame('wade', $troop->waterMode);
    }

    public function test_assign_orders_defaults_to_embark_when_third_element_absent(): void
    {
        $environment = Environment::create(201, 2);
        $troop = $environment->players[0]->troops[0];
        $troop->waterMode = 'wade';

        // Two-element tuple with no waterMode third element.
        $environment->assignTroopPathsFromOrders([
            [$troop->id, [[100.0, 100.0]]],
        ]);

        $this->assertSame('embark', $troop->waterMode);
    }

    public function test_assign_orders_rejects_invalid_water_mode_and_defaults_to_embark(): void
    {
        $environment = Environment::create(202, 2);
        $troop = $environment->players[0]->troops[0];

        $environment->assignTroopPathsFromOrders([
            [$troop->id, [[100.0, 100.0]], 'swim'],
        ]);

        $this->assertSame('embark', $troop->waterMode);
    }

    // -------------------------------------------------------------------------
    // drawInfo exposes waterMode and waterTicks
    // -------------------------------------------------------------------------

    public function test_draw_info_exposes_water_mode_and_water_ticks(): void
    {
        $environment = Environment::create(300, 2);
        $troop = $environment->players[0]->troops[0];
        $troop->waterMode = 'wade';
        $troop->waterTicks = 5;

        $environment->recomputeVision();
        $info = $environment->drawInfo(0, 0);

        $ownTroop = current(array_filter($info['troops'], fn (array $t) => $t['id'] === $troop->id));
        $this->assertNotFalse($ownTroop, 'Own troop must appear in drawInfo.');
        $this->assertSame('wade', $ownTroop['waterMode']);
        $this->assertSame(5, $ownTroop['waterTicks']);
    }

    // -------------------------------------------------------------------------
    // getTerrainName fallback fix
    // -------------------------------------------------------------------------

    public function test_get_terrain_name_returns_water_for_values_below_water_threshold(): void
    {
        $environment = Environment::create(400, 2);

        // Values just below the water threshold (-0.1) should be 'water', not 'forest'.
        $this->assertSame('water', $environment->getTerrainName(-0.15, 0.0));
        $this->assertSame('water', $environment->getTerrainName(-0.12, 0.0));
    }

    public function test_get_terrain_name_returns_deep_water_for_very_low_values(): void
    {
        $environment = Environment::create(401, 2);

        // Values at or below DEEP_WATER_ELEVATION_THRESHOLD (-0.2) should be 'deep_water'.
        $this->assertSame('deep_water', $environment->getTerrainName(GameConstants::DEEP_WATER_ELEVATION, 0.0));
        $this->assertSame('deep_water', $environment->getTerrainName(-0.25, 0.0));
        $this->assertSame('deep_water', $environment->getTerrainName(-0.5, 0.0));
    }

    // -------------------------------------------------------------------------
    // Wade mode: HP damage, no ship conversion
    // -------------------------------------------------------------------------

    public function test_wade_mode_takes_hp_damage_per_tick_on_water(): void
    {
        $environment = Environment::create(500, 2);
        $troop = $environment->players[0]->troops[0];
        $troop->waterMode = 'wade';
        $troop->health = $troop->maxHealth();
        $this->placeOnWater($environment, $troop);

        $environment->updateTroops([], 1);

        $this->assertLessThan(
            $troop->maxHealth(),
            $troop->health,
            'Wade mode troop on water should lose HP from water damage.',
        );
    }

    public function test_wade_mode_never_converts_to_ship(): void
    {
        $environment = Environment::create(501, 2);
        $troop = $environment->players[0]->troops[0];
        $troop->waterMode = 'wade';
        $troop->health = $troop->maxHealth();
        $troop->health = 10_000; // effectively invincible for this tick count
        $this->placeOnWater($environment, $troop);

        for ($i = 0; $i <= GameConstants::SHIP_CONVERSION_TICKS + 10; $i++) {
            $troop->health = $troop->maxHealth(); // reset HP each tick to prevent death
            $environment->updateTroops([], $i);
        }

        $this->assertFalse($troop->isShip, 'Wade mode troop must never become a ship.');
        $this->assertSame(0, $troop->waterTicks, 'Wade mode troop should not accumulate waterTicks.');
    }

    // -------------------------------------------------------------------------
    // Embark mode: waterTicks accumulate, ship conversion
    // -------------------------------------------------------------------------

    public function test_embark_mode_accumulates_water_ticks_on_water(): void
    {
        $environment = Environment::create(600, 2);
        $troop = $environment->players[0]->troops[0];
        $troop->waterMode = 'embark';
        $troop->health = $troop->maxHealth();
        $this->placeOnWater($environment, $troop);

        $environment->updateTroops([], 1);

        $this->assertGreaterThan(0, $troop->waterTicks, 'Embark mode troop on water must accumulate waterTicks.');
    }

    public function test_embark_mode_converts_to_ship_after_conversion_ticks(): void
    {
        $environment = Environment::create(601, 2);
        $troop = $environment->players[0]->troops[0];
        $troop->waterMode = 'embark';
        $this->placeOnWater($environment, $troop);

        for ($i = 1; $i <= GameConstants::SHIP_CONVERSION_TICKS; $i++) {
            $troop->health = $troop->maxHealth(); // prevent death from embarkation damage
            $environment->updateTroops([], $i);
        }

        $this->assertTrue($troop->isShip, 'Embark mode troop must become a ship after SHIP_CONVERSION_TICKS consecutive water ticks.');
    }

    public function test_embark_mode_ship_takes_no_hp_damage_on_water(): void
    {
        $environment = Environment::create(602, 2);
        $troop = $environment->players[0]->troops[0];
        $troop->waterMode = 'embark';
        $troop->isShip = true;
        $troop->waterTicks = GameConstants::SHIP_CONVERSION_TICKS;
        $troop->health = $troop->maxHealth();
        $this->placeOnWater($environment, $troop);

        $healthBefore = $troop->health;
        $environment->updateTroops([], 1);

        $this->assertSame($healthBefore, $troop->health, 'A converted ship must not take water HP damage.');
    }

    // -------------------------------------------------------------------------
    // Leaving water resets waterTicks and isShip
    // -------------------------------------------------------------------------

    public function test_leaving_water_resets_water_ticks_and_is_ship(): void
    {
        $environment = Environment::create(700, 2);
        $troop = $environment->players[0]->troops[0];
        $troop->waterMode = 'embark';
        $troop->isShip = true;
        $troop->waterTicks = GameConstants::SHIP_CONVERSION_TICKS;

        // Place the troop on dry land.
        $cs = GameConstants::CELL_SIZE;
        $gx = 5;
        $gy = 5;
        $environment->terrainMarching->grid[$gx][$gy] = 0.5; // plains
        $environment->forestMarching->grid[$gx][$gy] = 0.0;
        $troop->position = [(float) ($gx * $cs), (float) ($gy * $cs)];
        $troop->path = [];

        $environment->updateTroops([], 1);

        $this->assertSame(0, $troop->waterTicks, 'waterTicks must reset to 0 when the troop leaves water.');
        $this->assertFalse($troop->isShip, 'isShip must reset to false when the troop leaves water.');
    }

    // -------------------------------------------------------------------------
    // Deep water blocking for wade mode
    // -------------------------------------------------------------------------

    public function test_wade_mode_cannot_move_into_deep_water(): void
    {
        $environment = Environment::create(800, 2);
        $player = $environment->players[0];
        $troop = $player->troops[0];

        // Remove player 1 troops to avoid combat interference.
        $environment->players[1]->troops = [];

        $troop->waterMode = 'wade';

        $cs = GameConstants::CELL_SIZE;
        // Place troop on dry land adjacent to deep_water.
        $landGx = 3;
        $landGy = 3;
        $environment->terrainMarching->grid[$landGx][$landGy] = 0.5;
        $environment->forestMarching->grid[$landGx][$landGy] = 0.0;
        $troop->position = [(float) ($landGx * $cs), (float) ($landGy * $cs)];

        // Mark the target cell (and several beyond it) as deep_water so the troop
        // cannot path through them regardless of direction.
        for ($gx = 4; $gx <= 10; $gx++) {
            $environment->terrainMarching->grid[$gx][$landGy] = GameConstants::DEEP_WATER_ELEVATION;
            $environment->forestMarching->grid[$gx][$landGy] = 0.0;
        }

        // Set a path pointing well into the deep_water region.
        $troop->path = [[(float) (10 * $cs), (float) ($landGy * $cs)]];

        // Run enough ticks to allow the troop to reach the deep_water boundary.
        for ($i = 1; $i <= 120; $i++) {
            $environment->updateTroops([], $i);
        }

        // The troop must remain in the land cell - its X should never exceed the
        // start of the first deep_water cell (gx=4 → world x = 80).
        $deepWaterWorldX = 4 * $cs;
        $this->assertLessThanOrEqual(
            $deepWaterWorldX,
            $troop->position[0],
            'Wade mode troop must not enter the deep_water tile region.',
        );
    }

    public function test_embark_mode_can_move_into_deep_water(): void
    {
        $environment = Environment::create(801, 2);
        $player = $environment->players[0];
        $troop = $player->troops[0];

        // Remove player 1 troops to avoid combat interference.
        $environment->players[1]->troops = [];

        $troop->waterMode = 'embark';
        $troop->isShip = true;
        $troop->waterTicks = GameConstants::SHIP_CONVERSION_TICKS;

        $cs = GameConstants::CELL_SIZE;
        $landGx = 3;
        $landGy = 4;
        $environment->terrainMarching->grid[$landGx][$landGy] = 0.5;
        $environment->forestMarching->grid[$landGx][$landGy] = 0.0;
        $troop->position = [(float) ($landGx * $cs), (float) ($landGy * $cs)];

        $deepGx = 4;
        $deepGy = 4;
        $environment->terrainMarching->grid[$deepGx][$deepGy] = GameConstants::DEEP_WATER_ELEVATION;
        $environment->forestMarching->grid[$deepGx][$deepGy] = 0.0;
        $troop->path = [[(float) ($deepGx * $cs + $cs * 2), (float) ($deepGy * $cs)]];

        $positionBefore = $troop->position;
        $environment->updateTroops([], 1);

        $moved = abs($troop->position[0] - $positionBefore[0]) > 0.1
            || abs($troop->position[1] - $positionBefore[1]) > 0.1;

        $this->assertTrue($moved, 'Embark mode ship should be able to move into deep_water tiles.');
    }
}
