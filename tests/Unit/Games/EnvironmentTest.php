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
