<?php

namespace Tests\Unit;

use App\Games\GameConstants;
use App\Games\Services\MatchPresenceMonitor;
use PHPUnit\Framework\TestCase;

class MatchPresenceMonitorTest extends TestCase
{
    public function test_everyone_idle_when_all_timestamps_are_old(): void
    {
        $state = [
            'environment' => ['players' => [[], []]],
            'lastPlayerActivityAt' => [
                microtime(true) - GameConstants::MATCH_ALL_PLAYERS_INACTIVE_SECONDS - 10,
                microtime(true) - GameConstants::MATCH_ALL_PLAYERS_INACTIVE_SECONDS - 10,
            ],
        ];

        $this->assertTrue(MatchPresenceMonitor::everyoneIdleForAtLeast(
            $state,
            GameConstants::MATCH_ALL_PLAYERS_INACTIVE_SECONDS,
        ));
    }

    public function test_not_everyone_idle_when_one_player_was_active_recently(): void
    {
        $state = [
            'environment' => ['players' => [[], []]],
            'lastPlayerActivityAt' => [
                microtime(true) - GameConstants::MATCH_ALL_PLAYERS_INACTIVE_SECONDS - 10,
                microtime(true) - 5,
            ],
        ];

        $this->assertFalse(MatchPresenceMonitor::everyoneIdleForAtLeast(
            $state,
            GameConstants::MATCH_ALL_PLAYERS_INACTIVE_SECONDS,
        ));
    }
}
