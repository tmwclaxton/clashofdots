<?php

namespace App\Games\Engine;

/**
 * Reduces move-order waypoint count before persistence and simulation.
 *
 * Long hand-drawn paths (especially group orders) can carry hundreds of points;
 * the sim only needs enough resolution for terrain and combat, not every mouse sample.
 */
final class PathOrderSimplifier
{
    private const float MIN_SEGMENT_LENGTH = 8.0;

    private const int MAX_POINTS = 48;

    /**
     * @param  list<array{0: float, 1: float}>  $path
     * @return list<array{0: float, 1: float}>
     */
    public static function simplify(array $path): array
    {
        if ($path === []) {
            return [];
        }

        if (count($path) === 1) {
            return [[(float) $path[0][0], (float) $path[0][1]]];
        }

        /** @var list<array{0: float, 1: float}> $reduced */
        $reduced = [[(float) $path[0][0], (float) $path[0][1]]];
        $lastKept = $reduced[0];

        for ($i = 1; $i < count($path) - 1; $i++) {
            $point = $path[$i];
            $dx = (float) $point[0] - $lastKept[0];
            $dy = (float) $point[1] - $lastKept[1];

            if (sqrt($dx ** 2 + $dy ** 2) >= self::MIN_SEGMENT_LENGTH) {
                $lastKept = [(float) $point[0], (float) $point[1]];
                $reduced[] = $lastKept;
            }
        }

        $end = $path[count($path) - 1];
        $reduced[] = [(float) $end[0], (float) $end[1]];

        while (count($reduced) > self::MAX_POINTS) {
            /** @var list<array{0: float, 1: float}> $decimated */
            $decimated = [$reduced[0]];

            for ($i = 1; $i < count($reduced) - 1; $i++) {
                if ($i % 2 === 0) {
                    $decimated[] = $reduced[$i];
                }
            }

            $decimated[] = $reduced[count($reduced) - 1];
            $reduced = $decimated;
        }

        return $reduced;
    }

    /**
     * @param  list<array{0: mixed, 1: mixed, 2?: mixed}>  $orders
     * @return list<array{0: mixed, 1: mixed, 2?: mixed}>
     */
    public static function simplifyOrderRows(array $orders): array
    {
        $simplified = [];

        foreach ($orders as $row) {
            if (! is_array($row) || count($row) < 2 || ! is_array($row[1])) {
                continue;
            }

            /** @var list<array{0: float, 1: float}> $points */
            $points = [];
            foreach ($row[1] as $point) {
                if (! is_array($point) || count($point) < 2) {
                    continue;
                }

                $points[] = [(float) $point[0], (float) $point[1]];
            }

            if ($points === []) {
                continue;
            }

            $entry = [(int) $row[0], self::simplify($points)];

            if (isset($row[2]) && $row[2] === 'wade') {
                $entry[] = 'wade';
            }

            $simplified[] = $entry;
        }

        return $simplified;
    }
}
