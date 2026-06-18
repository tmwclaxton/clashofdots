<?php

namespace Tests\Feature\Console;

use Illuminate\Support\Facades\Redis;
use Tests\TestCase;

class GameActiveSetCommandTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        try {
            Redis::ping();
        } catch (\Throwable) {
            $this->markTestSkipped('Redis is required for game:active-set tests.');
        }
    }

    public function test_game_active_set_command_runs(): void
    {
        $this->artisan('game:active-set')->assertExitCode(0);
    }
}
