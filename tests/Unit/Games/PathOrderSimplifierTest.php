<?php

namespace Tests\Unit\Games;

use App\Games\Engine\PathOrderSimplifier;
use PHPUnit\Framework\TestCase;

class PathOrderSimplifierTest extends TestCase
{
    public function test_simplify_keeps_endpoints_and_caps_point_count(): void
    {
        $path = [[0.0, 0.0]];

        for ($i = 1; $i <= 200; $i++) {
            $path[] = [(float) $i, 0.0];
        }

        $simplified = PathOrderSimplifier::simplify($path);

        $this->assertLessThanOrEqual(48, count($simplified));
        $this->assertSame([0.0, 0.0], $simplified[0]);
        $this->assertSame([200.0, 0.0], $simplified[count($simplified) - 1]);
    }

    public function test_simplify_order_rows_preserves_water_mode(): void
    {
        $rows = PathOrderSimplifier::simplifyOrderRows([
            [7, [[0.0, 0.0], [1.0, 0.0], [2.0, 0.0]], 'wade'],
        ]);

        $this->assertCount(1, $rows);
        $this->assertSame(7, $rows[0][0]);
        $this->assertSame('wade', $rows[0][2] ?? null);
    }
}
