<?php

namespace Tests\Unit\Games;

use App\Games\Engine\City;
use App\Games\Engine\Environment;
use App\Games\Engine\GameMath;
use App\Games\Engine\Troop;
use App\Games\GameConstants;
use Tests\TestCase;

class RecruitmentTest extends TestCase
{
    /**
     * Build a minimal environment scaffold: two players, one city owned by player 0,
     * and a supplied economy array so updateCities() can check credits.
     *
     * @return array{env: Environment, economy: array<int, array<string, mixed>>}
     */
    private function scaffold(): array
    {
        $env = Environment::create(9001, 2);

        // Give the starting troops full health so they don't interfere.
        foreach ($env->players as $player) {
            foreach ($player->troops as $troop) {
                $troop->health = $troop->maxHealth();
            }
        }

        // Assign the first capital to player 0 and set a max-speed multiplier so any
        // single tick can trigger a spawn when conditions are met.
        $capital = null;
        foreach ($env->cities as $city) {
            if ($city->markerType === 'capital') {
                $capital = $city;
                break;
            }
        }

        if ($capital !== null) {
            $capital->owner = $env->players[0];
            $capital->recruitmentEnabled = true;
        }

        $env->players[0]->productionSpeedMultiplier = 3.0;
        $env->players[0]->productionTankRatio = 0; // infantry only

        $economy = [
            0 => ['credits' => 9999, 'incomePerTick' => 1],
            1 => ['credits' => 9999, 'incomePerTick' => 1],
        ];

        return ['env' => $env, 'economy' => $economy, 'capital' => $capital];
    }

    public function test_troop_spawns_at_25_percent_health(): void
    {
        ['env' => $env, 'economy' => $economy, 'capital' => $capital] = $this->scaffold();

        if ($capital === null) {
            $this->markTestSkipped('Fixture has no capital city.');
        }

        // Remove any troop sitting on the city.
        $env->players[0]->troops = array_values(array_filter(
            $env->players[0]->troops,
            function (Troop $t) use ($capital): bool {
                [, $dist] = GameMath::xyToDirDis([
                    $t->position[0] - $capital->position[0],
                    $t->position[1] - $capital->position[1],
                ]);

                return $dist >= GameConstants::CELL_SIZE;
            }
        ));

        // Advance the city timer well beyond any threshold.
        for ($i = 0; $i < 5000; $i++) {
            $capital->timer++;
        }

        $troopsBefore = count($env->players[0]->troops);
        $env->updateCities(1, $economy);

        $troops = $env->players[0]->troops;
        $this->assertCount($troopsBefore + 1, $troops, 'A troop should have spawned.');

        $newTroop = end($troops);
        $expectedHealth = (int) round($newTroop->maxHealth() * GameConstants::TROOP_SPAWN_HEALTH_FRACTION);
        $this->assertSame($expectedHealth, $newTroop->health, 'New troop should spawn at 25% HP.');
    }

    public function test_spawn_blocked_when_troop_occupies_city(): void
    {
        ['env' => $env, 'economy' => $economy, 'capital' => $capital] = $this->scaffold();

        if ($capital === null) {
            $this->markTestSkipped('Fixture has no capital city.');
        }

        // Park a troop directly on the city — this will populate playersInCities via updateTroops.
        $env->players[0]->troops[0]->position = $capital->position;

        // Run updateTroops to populate playersInCities.
        $env->updateTroops([], 1);

        // Advance the city timer.
        for ($i = 0; $i < 5000; $i++) {
            $capital->timer++;
        }

        $troopsBefore = count($env->players[0]->troops);
        $env->updateCities(2, $economy);

        $this->assertCount($troopsBefore, $env->players[0]->troops, 'No troop should spawn when the city is occupied.');
    }

    public function test_spawn_blocked_when_recruitment_disabled(): void
    {
        ['env' => $env, 'economy' => $economy, 'capital' => $capital] = $this->scaffold();

        if ($capital === null) {
            $this->markTestSkipped('Fixture has no capital city.');
        }

        $capital->recruitmentEnabled = false;

        for ($i = 0; $i < 5000; $i++) {
            $capital->timer++;
        }

        $troopsBefore = count($env->players[0]->troops);
        $env->updateCities(1, $economy);

        $this->assertCount($troopsBefore, $env->players[0]->troops, 'No troop should spawn when recruitment is disabled.');
    }

    public function test_spawn_blocked_when_speed_is_zero(): void
    {
        ['env' => $env, 'economy' => $economy, 'capital' => $capital] = $this->scaffold();

        if ($capital === null) {
            $this->markTestSkipped('Fixture has no capital city.');
        }

        $env->players[0]->productionSpeedMultiplier = 0.0;

        for ($i = 0; $i < 5000; $i++) {
            $capital->timer++;
        }

        $troopsBefore = count($env->players[0]->troops);
        $env->updateCities(1, $economy);

        $this->assertCount($troopsBefore, $env->players[0]->troops, 'No troop should spawn when speed multiplier is 0.');
    }

    public function test_spawn_blocked_when_insufficient_credits(): void
    {
        ['env' => $env, 'economy' => $economy, 'capital' => $capital] = $this->scaffold();

        if ($capital === null) {
            $this->markTestSkipped('Fixture has no capital city.');
        }

        $economy[0]['credits'] = GameConstants::ECONOMY_RECRUIT_COST - 1;

        for ($i = 0; $i < 5000; $i++) {
            $capital->timer++;
        }

        $troopsBefore = count($env->players[0]->troops);
        $env->updateCities(1, $economy);

        $this->assertCount($troopsBefore, $env->players[0]->troops, 'No troop should spawn without enough credits.');
    }

    public function test_spawn_deducts_recruit_cost_from_economy(): void
    {
        ['env' => $env, 'economy' => $economy, 'capital' => $capital] = $this->scaffold();

        if ($capital === null) {
            $this->markTestSkipped('Fixture has no capital city.');
        }

        // Remove troops from city position.
        $env->players[0]->troops = [];

        for ($i = 0; $i < 5000; $i++) {
            $capital->timer++;
        }

        $creditsBefore = $economy[0]['credits'];
        $env->updateCities(1, $economy);

        $this->assertCount(1, $env->players[0]->troops, 'One troop should have spawned.');
        $this->assertSame(
            $creditsBefore - GameConstants::ECONOMY_RECRUIT_COST,
            $economy[0]['credits'],
            'Recruit cost should be deducted from credits.',
        );
    }

    public function test_tank_ratio_100_spawns_tank(): void
    {
        ['env' => $env, 'economy' => $economy, 'capital' => $capital] = $this->scaffold();

        if ($capital === null) {
            $this->markTestSkipped('Fixture has no capital city.');
        }

        $env->players[0]->productionTankRatio = 100;
        $economy[0]['credits'] = GameConstants::ECONOMY_RECRUIT_COST_TANK + 100;
        $env->players[0]->troops = [];

        for ($i = 0; $i < 5000; $i++) {
            $capital->timer++;
        }

        $env->updateCities(1, $economy);

        $this->assertCount(1, $env->players[0]->troops, 'A troop should have spawned.');
        $this->assertSame('tank', $env->players[0]->troops[0]->type, 'Should spawn a tank when ratio is 100.');
    }
}
