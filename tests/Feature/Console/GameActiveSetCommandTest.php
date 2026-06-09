<?php

namespace Tests\Feature\Console;

use Predis\Client;
use Tests\TestCase;

class GameActiveSetCommandTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        if (! extension_loaded('redis') && ! class_exists(Client::class)) {
            $this->markTestSkipped('Redis is required for game:active-set tests.');
        }
    }

    public function test_game_active_set_command_runs(): void
    {
        $this->artisan('game:active-set')->assertExitCode(0);
    }
}
