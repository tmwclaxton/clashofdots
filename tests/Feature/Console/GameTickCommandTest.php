<?php

namespace Tests\Feature\Console;

use App\Games\Services\GameManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Redis;
use Tests\TestCase;

class GameTickCommandTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        try {
            Redis::ping();
        } catch (\Throwable) {
            $this->markTestSkipped('Redis is required for the game tick command.');
        }
    }

    public function test_game_tick_single_iteration_exits_successfully(): void
    {
        $this->artisan('game:tick')->assertExitCode(0);
    }

    public function test_game_tick_refreshes_daemon_heartbeat_key(): void
    {
        Redis::del(GameManager::TICK_DAEMON_HEARTBEAT_KEY);

        $this->artisan('game:tick')->assertExitCode(0);

        $this->assertTrue((bool) Redis::exists(GameManager::TICK_DAEMON_HEARTBEAT_KEY));
    }
}
