<?php

namespace App\Games\Engine;

use App\Games\GameConstants;

final class MarchingSquares
{
    /** @var list<list<float>> */
    public array $grid;

    public function __construct()
    {
        $this->grid = self::emptyGrid();
    }

    /**
     * @return list<list<float>>
     */
    public static function emptyGrid(?int $maxXInclusive = null, ?int $maxYInclusive = null): array
    {
        $maxX = $maxXInclusive ?? GameConstants::ROWS;
        $maxY = $maxYInclusive ?? GameConstants::COLS;

        $grid = [];
        for ($x = 0; $x <= $maxX; $x++) {
            $grid[$x] = array_fill(0, $maxY + 1, 0.0);
        }

        return $grid;
    }

    /**
     * @param  list<list<float>>  $newGrid
     */
    public function setGrid(array $newGrid): void
    {
        $this->grid = $newGrid;
    }

    public function getGridValue(float $x, float $y): float
    {
        $maxX = max(0, count($this->grid) - 1);
        $maxY = max(0, count($this->grid[0] ?? []) - 1);

        /** Clamp before indexing — callers may pass world coords outside the scalar field. */
        $xf = max(0.0, min($x, (float) $maxX));
        $yf = max(0.0, min($y, (float) $maxY));

        $x1 = (int) floor($xf);
        $y1 = (int) floor($yf);
        $x2 = min($x1 + 1, $maxX);
        $y2 = min($y1 + 1, $maxY);

        $dx = $xf - (float) $x1;
        $dy = $yf - (float) $y1;

        $p11 = $this->grid[$x1][$y1];
        $p21 = $this->grid[$x2][$y1];
        $p12 = $this->grid[$x1][$y2];
        $p22 = $this->grid[$x2][$y2];

        return ($p11 * (1 - $dx) * (1 - $dy))
            + ($p21 * $dx * (1 - $dy))
            + ($p12 * (1 - $dx) * $dy)
            + ($p22 * $dx * $dy);
    }
}
