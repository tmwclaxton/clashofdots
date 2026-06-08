<?php

namespace App\Games\Services;

use App\Enums\GameStatus;
use App\Games\GameConstants;
use App\Models\Game;

final class GameTickService
{
    public function tick(Game $game, GameManager $manager): void
    {
        if ($game->status !== GameStatus::Playing) {
            return;
        }

        $state = $manager->getLiveState($game);

        $activityDirty = MatchPresenceMonitor::normalizeLastActivity($state);

        if (MatchPresenceMonitor::everyoneIdleForAtLeast($state, GameConstants::MATCH_ALL_PLAYERS_INACTIVE_SECONDS)) {
            $manager->finishWithoutWinner(
                $game,
                GameConstants::ABORTED_MATCH_INACTIVITY,
                'Match ended — all commanders inactive for over two minutes.',
            );

            return;
        }

        if ($activityDirty) {
            $manager->storeLiveState($game, $state);
        }

        $environment = $manager->environmentFromState($state);

        if ($this->allPlayersPaused($state)) {
            return;
        }

        $cityPaths = [];
        foreach ($state['playerCityInputs'] as $inputs) {
            $cityPaths = array_merge($cityPaths, $inputs);
        }
        $state['playerCityInputs'] = array_fill(0, count($state['playerCityInputs']), []);
        $environment->updateCities($cityPaths);

        $troopPaths = [];
        foreach ($state['playerInputs'] as $inputs) {
            $troopPaths = array_merge($troopPaths, $inputs);
        }
        $state['playerInputs'] = array_fill(0, count($state['playerInputs']), []);
        $environment->updateTroops($troopPaths);

        $state['environment'] = $environment->toArray();
        $manager->storeLiveState($game, $state);
        $manager->broadcastState($game, $environment);

        $winnerSlot = $environment->winnerSlot();
        if ($winnerSlot !== null) {
            $manager->finish($game, $winnerSlot);
        }
    }

    /**
     * @param  array<string, mixed>  $state
     */
    private function allPlayersPaused(array $state): bool
    {
        $pauseRequests = $state['pauseRequests'] ?? [];

        if ($pauseRequests === []) {
            return false;
        }

        foreach ($pauseRequests as $paused) {
            if (! $paused) {
                return false;
            }
        }

        return true;
    }
}
