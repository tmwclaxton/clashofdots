<?php

namespace App\Games\Services;

use App\Enums\GameStatus;
use App\Games\Engine\City;
use App\Games\Engine\Environment;
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
        $manager->repairLiveStateEconomy($game, $state);

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

        $worldTick = (int) ($state['worldTick'] ?? 0);

        $cityPaths = [];
        foreach ($state['playerCityInputs'] as $inputs) {
            $cityPaths = array_merge($cityPaths, $inputs);
        }
        $state['playerCityInputs'] = array_fill(0, count($state['playerCityInputs']), []);
        $environment->updateCities($cityPaths, $worldTick);

        $troopPaths = [];
        foreach ($state['playerInputs'] as $inputs) {
            $troopPaths = array_merge($troopPaths, $inputs);
        }
        $state['playerInputs'] = array_fill(0, count($state['playerInputs']), []);
        $environment->updateTroops($troopPaths, $worldTick);

        $state['environment'] = $environment->toArray();
        $state['worldTick'] = $worldTick + 1;
        $this->applyEconomyTick($state, $environment);
        $manager->storeLiveState($game, $state);
        $manager->broadcastState($game, $environment, $state);

        $winnerSlot = $environment->winnerSlot();
        if ($winnerSlot !== null) {
            $manager->finish($game, $winnerSlot);
        }
    }

    /**
     * @param  array<string, mixed>  $state
     */
    private function applyEconomyTick(array &$state, Environment $environment): void
    {
        $economy = $state['economy'] ?? null;
        if (! is_array($economy)) {
            return;
        }

        $playerCount = count($economy);
        for ($slot = 0; $slot < $playerCount; $slot++) {
            if (! isset($economy[$slot]) || ! is_array($economy[$slot])) {
                continue;
            }

            $player = $environment->players[$slot] ?? null;
            if ($player === null) {
                continue;
            }

            $ownedCities = count(array_filter($environment->cities, fn (City $c) => $c->owner === $player));
            $income = $ownedCities * GameConstants::ECONOMY_INCOME_PER_CITY_PER_TICK;
            $credits = (int) ($economy[$slot]['credits'] ?? 0);
            $credits += $income;
            $economy[$slot]['credits'] = $credits;
            $economy[$slot]['incomePerTick'] = $income;
        }

        $state['economy'] = $economy;
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
