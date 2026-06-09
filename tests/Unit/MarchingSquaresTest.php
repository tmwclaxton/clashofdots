<?php

namespace Tests\Unit;

use App\Games\Engine\MarchingSquares;
use PHPUnit\Framework\TestCase;

class MarchingSquaresTest extends TestCase
{
    public function test_get_grid_value_clamps_coordinates_before_indexing(): void
    {
        $ms = new MarchingSquares;
        $ms->setGrid([
            [1.0, 2.0],
            [3.0, 4.0],
        ]);

        $this->assertSame(1.0, $ms->getGridValue(-50.0, -50.0));
        $this->assertSame(4.0, $ms->getGridValue(999.0, 999.0));
        $this->assertSame(4.0, $ms->getGridValue(184.0, 184.0));
    }
}
