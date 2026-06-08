<?php

use App\Games\Services\GuestGameIdentity;
use App\Models\Game;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('game.{gameUuid}.{connection}', function (?User $user, string $gameUuid, string $connection) {
    if (str_starts_with($connection, 'u')) {
        $expectedId = (int) substr($connection, 1);

        if (! $user instanceof User || $user->id !== $expectedId) {
            return false;
        }

        return Game::query()
            ->where('uuid', $gameUuid)
            ->whereHas('players', fn ($query) => $query->where('user_id', $expectedId))
            ->exists();
    }

    if (str_starts_with($connection, 'g')) {
        $uuid = GuestGameIdentity::guestUuidFromBroadcastSegment($connection);

        if ($uuid === null) {
            return false;
        }

        $sessionKey = session(GuestGameIdentity::SESSION_KEY);

        if (! is_string($sessionKey) || $sessionKey !== $uuid) {
            return false;
        }

        return Game::query()
            ->where('uuid', $gameUuid)
            ->whereHas('players', fn ($query) => $query->where('guest_key', $uuid))
            ->exists();
    }

    return false;
});
