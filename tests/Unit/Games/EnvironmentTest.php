<?php

namespace Tests\Unit\Games;

use App\Games\Engine\Environment;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class EnvironmentTest extends TestCase
{
    #[DataProvider('playerCounts')]
    public function test_environment_generates_for_player_counts(int $count): void
    {
        $environment = Environment::create(12345, $count);

        $this->assertCount(10, $environment->cities);
        $this->assertCount($count, $environment->players);

        foreach ($environment->players as $index => $player) {
            $this->assertSame($index, $player->slot);
            $this->assertNotEmpty($player->troops);
        }
    }

    public function test_draw_info_includes_spawn_troops_before_first_tick(): void
    {
        $environment = Environment::create(999, 2);
        $sampleTroop = null;

        for ($slot = 0; $slot < 2; $slot++) {
            $info = $environment->drawInfo($slot, 0);

            if ($info['troops'] !== []) {
                $sampleTroop = $info['troops'][0];
                break;
            }
        }

        $this->assertNotNull($sampleTroop, 'Expected at least one visible troop for drawInfo in this fixture.');
        $info0 = $environment->drawInfo(0, 0);
        $this->assertNotEmpty($info0['cities']);
        $this->assertArrayHasKey('vision', $info0);
        $this->assertArrayHasKey('border', $info0);
        $this->assertArrayHasKey('morale', $sampleTroop);
        $this->assertArrayHasKey('warmupMultiplier', $sampleTroop);
        $this->assertArrayHasKey('combatMultiplier', $sampleTroop);
    }

    public static function playerCounts(): array
    {
        return [
            [2],
            [4],
            [6],
        ];
    }

    public function test_assign_troop_paths_from_orders_sets_each_troop_in_one_batch(): void
    {
        $environment = Environment::create(777, 2);
        $troopIdA = $environment->players[0]->troops[0]->id;
        $troopIdB = $environment->players[1]->troops[0]->id;
        $this->assertNotSame($troopIdA, $troopIdB);

        $pathA = [[110.0, 120.0], [210.0, 220.0]];
        $pathB = [[310.0, 320.0], [410.0, 420.0]];

        $environment->assignTroopPathsFromOrders([
            [$troopIdA, $pathA],
            [$troopIdB, $pathB],
        ]);

        $this->assertSame($pathA, $environment->players[0]->troops[0]->path);
        $this->assertSame($pathB, $environment->players[1]->troops[0]->path);
    }

    public function test_assign_troop_paths_from_orders_last_row_wins_duplicate_id(): void
    {
        $environment = Environment::create(778, 2);
        $troopIdA = $environment->players[0]->troops[0]->id;
        $first = [[10.0, 10.0], [20.0, 20.0]];
        $second = [[30.0, 30.0], [40.0, 40.0]];

        $environment->assignTroopPathsFromOrders([
            [$troopIdA, $first],
            [$troopIdA, $second],
        ]);

        $this->assertSame($second, $environment->players[0]->troops[0]->path);
    }

    public function test_draw_info_always_includes_own_troops_even_when_vision_is_dark(): void
    {
        $environment = Environment::create(321, 2);
        $player = $environment->players[0];
        $maxX = $environment->gridMaxX;
        $maxY = $environment->gridMaxY;

        for ($x = 0; $x <= $maxX; $x++) {
            $player->vision->grid[$x] = array_fill(0, $maxY + 1, 0.0);
        }

        $info = $environment->drawInfo(0, 0);
        $ownTroops = array_values(array_filter(
            $info['troops'],
            static fn (array $t): bool => ($t['ownerSlot'] ?? -1) === 0,
        ));

        $this->assertNotEmpty($ownTroops, 'Own troops must be visible to the owning player regardless of fog sampling.');
    }

    public function test_from_array_skips_procedural_generation_and_round_trips(): void
    {
        $original = Environment::create(4242, 2);
        $payload = $original->toArray();

        $restored = Environment::fromArray($payload);

        $this->assertSame($original->gridMaxX, $restored->gridMaxX);
        $this->assertSame($original->gridMaxY, $restored->gridMaxY);
        $this->assertCount(count($original->cities), $restored->cities);
        $this->assertCount(count($original->players), $restored->players);
    }

    public function test_from_array_tolerates_absurd_grid_metadata_from_json_floats(): void
    {
        $original = Environment::create(7, 2);
        $payload = $original->toArray();
        $payload['gridMaxX'] = 3.478395492209091E+27;
        $payload['gridMaxY'] = 1.5;

        $restored = Environment::fromArray($payload);

        $this->assertGreaterThanOrEqual(1, $restored->gridMaxX);
        $this->assertGreaterThanOrEqual(1, $restored->gridMaxY);
        $this->assertLessThanOrEqual(4096, $restored->gridMaxX);
        $this->assertLessThanOrEqual(4096, $restored->gridMaxY);
    }
}
