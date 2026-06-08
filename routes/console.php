<?php

use App\Games\Services\GameManager;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::call(static fn () => app(GameManager::class)->expireStaleLobbies())
    ->everyMinute()
    ->name('expire-stale-game-lobbies')
    ->withoutOverlapping();
