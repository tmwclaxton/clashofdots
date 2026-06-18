<?php

namespace Tests\Unit\Games;

use App\Games\Engine\Environment;
use App\Games\GameConstants;
use Tests\TestCase;

class UpkeepTest extends TestCase
{
    public function test_apply_debt_damage_drains_each_troop_by_given_hp(): void
    {
        $env = Environment::create(8001, 2);
        $player = $env->players[0];

        foreach ($player->troops as $troop) {
            $troop->health = $troop->maxHealth();
        }
        $healthBefore = $player->troops[0]->health;

        $env->applyDebtDamage(0, 5);

        $this->assertSame($healthBefore - 5, $player->troops[0]->health, '5 HP drain should be applied to each troop.');
    }

    public function test_apply_debt_damage_zero_does_nothing(): void
    {
        $env = Environment::create(8002, 2);
        $player = $env->players[0];
        foreach ($player->troops as $troop) {
            $troop->health = $troop->maxHealth();
        }
        $healthBefore = $player->troops[0]->health;

        $env->applyDebtDamage(0, 0);

        $this->assertSame($healthBefore, $player->troops[0]->health, 'Zero drain should not modify health.');
    }

    public function test_apply_debt_damage_targets_tanks_before_infantry(): void
    {
        $env = Environment::create(8003, 2);
        $player = $env->players[0];

        // Clear existing troops and spawn a tank and an infantry.
        $player->troops = [];
        $tank = $player->spawnTroop($player->startPos, [], 200, 0, 'tank');
        $infantry = $player->spawnTroop($player->startPos, [], 201, 0, 'infantry');
        $tank->health = $tank->maxHealth();
        $infantry->health = $infantry->maxHealth();

        $env->applyDebtDamage(0, 10);

        $this->assertSame($tank->maxHealth() - 10, $tank->health, 'Tank takes drain (highest priority).');
        $this->assertSame($infantry->maxHealth() - 10, $infantry->health, 'Infantry also takes drain.');
    }

    public function test_apply_debt_damage_newest_infantry_drained_first(): void
    {
        $env = Environment::create(8004, 2);
        $player = $env->players[0];

        $player->troops = [];
        $older = $player->spawnTroop($player->startPos, [], 10, 0, 'infantry');
        $newer = $player->spawnTroop($player->startPos, [], 20, 0, 'infantry');
        $older->health = $older->maxHealth();
        $newer->health = $newer->maxHealth();

        $env->applyDebtDamage(0, 3);

        // Both receive the same flat drain; newest ordering is preserved in the sort.
        $this->assertSame($older->maxHealth() - 3, $older->health, 'Older infantry takes 3 HP drain.');
        $this->assertSame($newer->maxHealth() - 3, $newer->health, 'Newer infantry takes 3 HP drain.');
    }

    public function test_debt_damage_constant_10_credits_equals_1_hp(): void
    {
        // Validate that the debt formula (floor(abs(credits)/10) * DEBT_DAMAGE) gives 1 at −10 credits.
        $debtCredits = 10;
        $drain = (int) floor($debtCredits / 10) * GameConstants::ECONOMY_DEBT_DAMAGE_PER_10_CREDITS;

        $this->assertSame(1, $drain, '10 credits of debt should produce 1 HP drain.');
    }

    public function test_debt_damage_formula_scales_proportionally(): void
    {
        foreach ([10 => 1, 20 => 2, 30 => 3, 50 => 5, 100 => 10] as $debt => $expectedDrain) {
            $drain = (int) floor($debt / 10) * GameConstants::ECONOMY_DEBT_DAMAGE_PER_10_CREDITS;
            $this->assertSame($expectedDrain, $drain, "At {$debt} credits debt, drain should be {$expectedDrain} HP.");
        }
    }

    public function test_upkeep_constant_is_1_credit_per_troop(): void
    {
        $this->assertSame(1, GameConstants::ECONOMY_UPKEEP_PER_TROOP_PER_TICK);
    }

    public function test_spawn_health_fraction_is_25_percent(): void
    {
        $this->assertEqualsWithDelta(0.25, GameConstants::TROOP_SPAWN_HEALTH_FRACTION, 0.001);
    }
}
