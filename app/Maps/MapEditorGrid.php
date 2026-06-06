<?php

namespace App\Maps;

use App\Games\GameConstants;

/**
 * Editor cell grid matches marching-squares vertex grid (see MarchingSquares::emptyGrid).
 */
final class MapEditorGrid
{
    public const int CELL_ROWS = GameConstants::ROWS + 1;

    public const int CELL_COLS = GameConstants::COLS + 1;

    /**
     * @return array{version: int, cellRows: int, cellCols: int, cells: list<list<string>>, bridges: list<list<bool>>}
     */
    public static function emptyData(): array
    {
        $cells = [];
        $bridges = [];

        for ($r = 0; $r < self::CELL_ROWS; $r++) {
            $cells[$r] = array_fill(0, self::CELL_COLS, 'plains');
            $bridges[$r] = array_fill(0, self::CELL_COLS, false);
        }

        return [
            'version' => 1,
            'cellRows' => self::CELL_ROWS,
            'cellCols' => self::CELL_COLS,
            'cells' => $cells,
            'bridges' => $bridges,
        ];
    }
}
