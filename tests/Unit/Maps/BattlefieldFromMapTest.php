<?php

namespace Tests\Unit\Maps;

use App\Games\Engine\Environment;
use App\Games\GameConstants;
use App\Maps\MapMarkers;
use App\Models\Map;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BattlefieldFromMapTest extends TestCase
{
    use RefreshDatabase;

    public function test_builds_environment_from_valid_published_style_map(): void
    {
        $owner = User::factory()->create();
        $map = Map::factory()->for($owner)->playablePublishedTwoTeam()->create();

        $this->assertSame([], MapMarkers::validate($map->data));

        $environment = Environment::fromMapEditorData(42_424, 2, $map->data);

        $this->assertCount(4, $environment->cities);
        $this->assertCount(2, $environment->players);
        $this->assertGreaterThan(0, count($environment->terrainMarching->grid));
    }

    public function test_uses_full_vertex_grid_without_cropping_for_large_maps(): void
    {
        $rows = 120;
        $cols = 80;
        $cells = array_fill(0, $rows, array_fill(0, $cols, 'plains'));
        $mapData = [
            'version' => 2,
            'cellRows' => $rows,
            'cellCols' => $cols,
            'cells' => $cells,
            'teamCount' => 2,
            'markers' => [
                ['type' => MapMarkers::TYPE_CAPITAL, 'team' => 0, 'row' => 10, 'col' => 5],
                ['type' => MapMarkers::TYPE_CAPITAL, 'team' => 1, 'row' => 115, 'col' => 70],
            ],
        ];

        $environment = Environment::fromMapEditorData(99_001, 2, $mapData);

        $this->assertSame($rows - 1, $environment->gridMaxX);
        $this->assertSame($cols - 1, $environment->gridMaxY);
        $this->assertCount($rows, $environment->terrainMarching->grid);
        $this->assertCount($cols, $environment->terrainMarching->grid[0]);
        $this->assertCount(2, $environment->players);
    }

    public function test_throws_when_capital_is_outside_declared_cell_grid(): void
    {
        $rows = 20;
        $cols = 20;
        $cells = array_fill(0, $rows, array_fill(0, $cols, 'plains'));
        $mapData = [
            'version' => 2,
            'cellRows' => $rows,
            'cellCols' => $cols,
            'cells' => $cells,
            'teamCount' => 2,
            'markers' => [
                ['type' => MapMarkers::TYPE_CAPITAL, 'team' => 0, 'row' => 5, 'col' => 5],
                ['type' => MapMarkers::TYPE_CAPITAL, 'team' => 1, 'row' => 5 + GameConstants::ROWS + 50, 'col' => 10],
            ],
        ];

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('outside the map grid');

        Environment::fromMapEditorData(99_002, 2, $mapData);
    }
}
