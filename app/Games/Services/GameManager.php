<?php

namespace App\Games\Services;

use App\Enums\GameStatus;
use App\Events\GameEnded;
use App\Events\GameInitialized;
use App\Events\GameStateUpdated;
use App\Games\Engine\City;
use App\Games\Engine\Environment;
use App\Games\Engine\Player;
use App\Games\GameConstants;
use App\Games\Logging\GameSimLog;
use App\Maps\MapMarkers;
use App\Models\Game;
use App\Models\GamePlayer;
use App\Models\Map;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;

final class GameManager
{
    private const string ACTIVE_SET = 'games:active';

    public function __construct(
        private GameCodeGenerator $codeGenerator,
        private GameTickService $tickService,
    ) {}

    public function create(User $host, Map $sourceMap): Game
    {
        $data = $sourceMap->data;
        if (! is_array($data)) {
            abort(422, 'This map has invalid data.');
        }

        $errors = MapMarkers::validate($data);
        if ($errors !== []) {
            abort(422, implode(' ', $errors));
        }

        $teamCount = (int) $data['teamCount'];
        $teamCount = max(GameConstants::MIN_PLAYERS, min(GameConstants::MAX_PLAYERS, $teamCount));

        $sourceMap->loadMissing('user');

        $snapshot = [
            'source_uuid' => $sourceMap->uuid,
            'source_name' => $sourceMap->name,
            'source_author' => $sourceMap->user?->name ?? 'Unknown',
            'data' => $data,
        ];

        $game = Game::query()->create([
            'uuid' => (string) Str::uuid(),
            'code' => $this->codeGenerator->generate(),
            'status' => GameStatus::Lobby,
            'max_players' => $teamCount,
            'seed' => random_int(1, PHP_INT_MAX),
            'host_user_id' => $host->id,
            'map_id' => $sourceMap->id,
            'map_data' => $snapshot,
            'settings' => [
                'source_map_uuid' => $sourceMap->uuid,
                'source_map_name' => $sourceMap->name,
            ],
        ]);

        $this->join($game, $host);

        return $game->fresh(['players.user']);
    }

    public function join(Game $game, User $user): GamePlayer
    {
        if ($game->status !== GameStatus::Lobby) {
            abort(422, $this->lobbyClosedMessage($game));
        }

        $this->assertLobbyWithinMaxAge($game);

        if ($game->players()->where('user_id', $user->id)->exists()) {
            return $game->players()->where('user_id', $user->id)->firstOrFail();
        }

        if ($game->isFull()) {
            abort(422, 'This lobby is full.');
        }

        $slot = $game->players()->count();

        return $game->players()->create([
            'user_id' => $user->id,
            'guest_key' => null,
            'display_name' => null,
            'slot' => $slot,
            'color' => GameConstants::colorHex($slot),
        ]);
    }

    public function joinAsGuest(Game $game, string $guestUuid, ?string $displayName): GamePlayer
    {
        if (! Str::isUuid($guestUuid)) {
            abort(422, 'Invalid guest session.');
        }

        if ($game->status !== GameStatus::Lobby) {
            abort(422, $this->lobbyClosedMessage($game));
        }

        $this->assertLobbyWithinMaxAge($game);

        $existing = $game->players()->where('guest_key', $guestUuid)->first();
        if ($existing !== null) {
            return $existing;
        }

        if ($game->isFull()) {
            abort(422, 'This lobby is full.');
        }

        $label = $displayName !== null ? trim($displayName) : null;
        if ($label === '') {
            $label = null;
        }

        $slot = $game->players()->count();

        return $game->players()->create([
            'user_id' => null,
            'guest_key' => $guestUuid,
            'display_name' => $label !== null ? Str::limit($label, 50, '') : null,
            'slot' => $slot,
            'color' => GameConstants::colorHex($slot),
        ]);
    }

    public function start(Game $game, User $user): Game
    {
        if ($game->host_user_id !== $user->id) {
            abort(403, 'Only the host can start the game.');
        }

        if ($game->status === GameStatus::Lobby) {
            $this->assertLobbyWithinMaxAge($game);
        }

        if (! $game->canStart()) {
            abort(422, 'Need at least two players to start.');
        }

        $playerCount = $game->players()->count();
        $snapshot = $game->map_data;
        if (! is_array($snapshot) || ! is_array($snapshot['data'] ?? null)) {
            abort(422, 'Lobby has no map snapshot.');
        }

        $mapData = $snapshot['data'];
        $teamCount = (int) ($mapData['teamCount'] ?? 0);
        if ($playerCount !== $teamCount) {
            abort(422, 'Every commander slot must join before starting.');
        }

        $environment = Environment::fromMapEditorData($game->seed, $playerCount, $mapData);

        $game->update([
            'status' => GameStatus::Playing,
            'started_at' => now(),
        ]);

        if ($game->map_id !== null) {
            Map::query()->whereKey($game->map_id)->increment('games_count');
        }

        $now = microtime(true);

        $this->storeLiveState($game, [
            'environment' => $environment->toArray(),
            'playerInputs' => array_fill(0, $playerCount, []),
            'playerCityInputs' => array_fill(0, $playerCount, []),
            'lastPlayerActivityAt' => array_fill(0, $playerCount, $now),
            'worldTick' => 0,
            'economy' => array_fill(0, $playerCount, [
                'credits' => GameConstants::ECONOMY_STARTING_CREDITS,
                'incomePerTick' => 0,
            ]),
        ]);

        Redis::sadd(self::ACTIVE_SET, $game->uuid);

        $game->load('players');

        $terrainInfo = $environment->getTerrainInfo();
        $terrainCells = $this->terrainCellsForSnapshot($game->map_data, $terrainInfo['terrain']);
        if ($terrainCells !== null) {
            $terrainInfo['terrainCells'] = $terrainCells;
        }

        $stateAfterStart = $this->getLiveState($game);
        $worldTick = (int) ($stateAfterStart['worldTick'] ?? 0);
        $economy = $stateAfterStart['economy'] ?? [];

        foreach ($game->players as $player) {
            $this->broadcastIgnoringTransportFailure(new GameInitialized(
                $game,
                $player->broadcastConnection(),
                $player->slot,
                array_merge($terrainInfo, [
                    'economy' => $economy,
                    'worldTick' => $worldTick,
                ]),
            ));
        }

        return $game->fresh(['players.user']);
    }

    /**
     * @param  array{0: list<array{0: int, 1: list<array{0: float, 1: float}>}>, 1: list<array{0: int, 1: list<array{0: float, 1: float}>}>}  $orders
     */
    public function submitOrders(Game $game, GamePlayer $player, array $orders): void
    {
        if ($game->status !== GameStatus::Playing) {
            abort(422, 'Orders can only be submitted during a live match.');
        }

        if ($player->game_id !== $game->id) {
            abort(403);
        }

        $state = $this->getLiveState($game);
        $slot = $player->slot;

        [$troopOrders, $cityOrders] = $orders;
        $state['playerInputs'][$slot] = array_merge($state['playerInputs'][$slot] ?? [], $troopOrders);
        $state['playerCityInputs'][$slot] = array_merge($state['playerCityInputs'][$slot] ?? [], $cityOrders);

        $this->touchPlayerActivityInState($state, $slot);
        $this->storeLiveState($game, $state);

        $environment = $this->environmentFromState($state);

        $mergedTroopPaths = [];

        foreach ($state['playerInputs'] as $inputs) {
            if (is_array($inputs)) {
                $mergedTroopPaths = array_merge($mergedTroopPaths, $inputs);
            }
        }

        $environment->assignTroopPathsFromOrders($mergedTroopPaths);

        $mergedCityPaths = [];

        foreach ($state['playerCityInputs'] as $inputs) {
            if (is_array($inputs)) {
                $mergedCityPaths = array_merge($mergedCityPaths, $inputs);
            }
        }

        $environment->assignCityPathsFromOrders($mergedCityPaths);

        $state['environment'] = $environment->toArray();
        $this->storeLiveState($game, $state);

        $game->loadMissing('players');

        GameSimLog::info('game.orders.accepted', [
            'game_uuid' => $game->uuid,
            'slot' => $slot,
            'world_tick' => (int) ($state['worldTick'] ?? 0),
            'troop_order_rows' => count($troopOrders),
            'city_order_rows' => count($cityOrders),
            'troop_orders' => array_map(static function ($row): array {
                if (! is_array($row) || $row === []) {
                    return ['entity_id' => null, 'path_points' => 0];
                }

                $path = $row[1] ?? [];

                return [
                    'entity_id' => is_numeric($row[0] ?? null) ? (int) $row[0] : null,
                    'path_points' => is_array($path) ? count($path) : 0,
                ];
            }, $troopOrders),
        ]);

        $this->broadcastState($game, $environment, $state);
    }

    /**
     * Marks the given commander slot as active (used for inactivity timeouts).
     */
    public function touchPlayerActivity(Game $game, int $slot): void
    {
        if ($game->status !== GameStatus::Playing) {
            return;
        }

        $state = $this->getLiveState($game);
        $this->touchPlayerActivityInState($state, $slot);
        $this->storeLiveState($game, $state);
    }

    /**
     * Closes lobbies that never started within {@see GameConstants::LOBBY_MAX_AGE_SECONDS}.
     *
     * @return int Number of games updated
     */
    public function expireStaleLobbies(): int
    {
        $cutoff = now()->subSeconds(GameConstants::LOBBY_MAX_AGE_SECONDS);

        $games = Game::query()
            ->where('status', GameStatus::Lobby)
            ->where('created_at', '<', $cutoff)
            ->get();

        $count = 0;

        foreach ($games as $game) {
            $settings = $game->settings ?? [];
            $settings['aborted_reason'] = GameConstants::ABORTED_LOBBY_TIMEOUT;
            $game->update([
                'status' => GameStatus::Finished,
                'finished_at' => now(),
                'winner_user_id' => null,
                'winner_slot' => null,
                'settings' => $settings,
            ]);
            $count++;
        }

        return $count;
    }

    public function tick(Game $game): void
    {
        $this->tickService->tick($game, $this);
    }

    public function finish(Game $game, int $winnerSlot): void
    {
        $winner = $game->players()->where('slot', $winnerSlot)->first();

        $game->update([
            'status' => GameStatus::Finished,
            'winner_user_id' => $winner?->user_id,
            'winner_slot' => $winnerSlot,
            'finished_at' => now(),
        ]);

        Redis::srem(self::ACTIVE_SET, $game->uuid);
        Redis::del($this->redisKey($game));

        $game->load('players');

        $winnerName = $winner?->displayLabel() ?? 'Unknown';

        $this->broadcastIgnoringTransportFailure(new GameEnded(
            $game,
            $winner?->user_id,
            $winner?->slot,
            $winnerName,
        ));
    }

    /**
     * Ends a live match with no winner (abandonment / inactivity).
     */
    public function finishWithoutWinner(Game $game, string $abortedReason, string $publicMessage): void
    {
        if ($game->status !== GameStatus::Playing) {
            return;
        }

        $settings = $game->settings ?? [];
        $settings['aborted_reason'] = $abortedReason;

        $game->update([
            'status' => GameStatus::Finished,
            'winner_user_id' => null,
            'winner_slot' => null,
            'finished_at' => now(),
            'settings' => $settings,
        ]);

        Redis::srem(self::ACTIVE_SET, $game->uuid);
        Redis::del($this->redisKey($game));

        $game->load('players');

        $this->broadcastIgnoringTransportFailure(new GameEnded(
            $game,
            null,
            null,
            $publicMessage,
        ));
    }

    /**
     * @return list<string>
     */
    public function activeGameUuids(): array
    {
        return Redis::smembers(self::ACTIVE_SET) ?: [];
    }

    public function findByUuid(string $uuid): ?Game
    {
        return Game::query()->where('uuid', $uuid)->first();
    }

    /**
     * @return array<string, mixed>
     */
    public function getLiveState(Game $game): array
    {
        $raw = Redis::get($this->redisKey($game));

        if (! $raw) {
            abort(404, 'Live game state not found.');
        }

        $this->ensurePlayingGameTrackedForTicks($game);

        return json_decode($raw, true, flags: JSON_THROW_ON_ERROR);
    }

    /**
     * The tick worker only advances games listed in {@see self::ACTIVE_SET}. If that set was
     * cleared or drifted while Redis still holds live JSON, re-register so `game:tick` picks up
     * the match again (idempotent SADD).
     */
    private function ensurePlayingGameTrackedForTicks(Game $game): void
    {
        if ($game->status !== GameStatus::Playing) {
            return;
        }

        $added = (int) Redis::sadd(self::ACTIVE_SET, $game->uuid);

        if ($added > 0) {
            GameSimLog::info('game.active_set.repaired', [
                'game_uuid' => $game->uuid,
                'added_members' => $added,
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $state
     */
    public function storeLiveState(Game $game, array $state): void
    {
        Redis::set($this->redisKey($game), json_encode($state, JSON_THROW_ON_ERROR));
    }

    public function environmentFromState(array $state): Environment
    {
        return Environment::fromArray($state['environment']);
    }

    /**
     * @param  array<string, mixed>  $state
     */
    public function repairLiveStateEconomy(Game $game, array &$state): bool
    {
        $slotCount = MatchPresenceMonitor::commanderSlotCount($state);
        if ($slotCount < 1) {
            return false;
        }

        $dirty = false;

        if (! isset($state['worldTick'])) {
            $state['worldTick'] = 0;
            $dirty = true;
        }

        if (! isset($state['economy']) || ! is_array($state['economy']) || count($state['economy']) !== $slotCount) {
            $state['economy'] = array_fill(0, $slotCount, [
                'credits' => GameConstants::ECONOMY_STARTING_CREDITS,
                'incomePerTick' => 0,
            ]);
            $dirty = true;
        }

        if ($dirty) {
            $this->storeLiveState($game, $state);
        }

        return $dirty;
    }

    public function recruitInfantry(Game $game, GamePlayer $gamePlayer): void
    {
        if ($game->status !== GameStatus::Playing) {
            abort(422, 'Recruiting is only available during a live match.');
        }

        if ($gamePlayer->game_id !== $game->id) {
            abort(403);
        }

        $state = $this->getLiveState($game);
        $this->repairLiveStateEconomy($game, $state);

        $environment = $this->environmentFromState($state);
        $slot = $gamePlayer->slot;
        $player = $environment->players[$slot] ?? null;

        if ($player === null) {
            abort(500, 'Invalid commander slot.');
        }

        $capital = $this->findOwnedCapitalCity($environment, $player);

        if ($capital === null) {
            abort(422, 'You must control your capital to recruit.');
        }

        if (count($player->troops) >= GameConstants::ECONOMY_MAX_ARMY_PER_PLAYER) {
            abort(422, 'Your army is at maximum size.');
        }

        if (! isset($state['economy'][$slot]) || ! is_array($state['economy'][$slot])) {
            abort(500, 'Economy state is missing for this commander.');
        }

        $credits = (int) ($state['economy'][$slot]['credits'] ?? 0);

        if ($credits < GameConstants::ECONOMY_RECRUIT_COST) {
            abort(422, 'Not enough credits to recruit.');
        }

        $spawn = $this->findRecruitSpawnPosition($environment, $capital->position);

        if ($spawn === null) {
            abort(422, 'No clear rally point near your capital. Move units aside.');
        }

        $worldTick = (int) ($state['worldTick'] ?? 0);
        $troopId = $environment->takeNextTroopId();
        $player->spawnTroop($spawn, [], $troopId, $worldTick);

        $state['economy'][$slot]['credits'] = $credits - GameConstants::ECONOMY_RECRUIT_COST;
        $state['environment'] = $environment->toArray();

        $this->touchPlayerActivityInState($state, $slot);
        $this->storeLiveState($game, $state);

        $game->loadMissing('players');
        $this->broadcastState($game, $environment, $state);
    }

    public function broadcastState(Game $game, Environment $environment, array $state): void
    {
        $worldTick = (int) ($state['worldTick'] ?? 0);
        $economy = $state['economy'] ?? null;

        $game->loadMissing('players');

        foreach ($game->players as $player) {
            $this->broadcastIgnoringTransportFailure(new GameStateUpdated(
                $game,
                $player->broadcastConnection(),
                $environment->drawInfo($player->slot, $worldTick),
                is_array($economy) ? $economy : null,
                $worldTick,
            ));
        }
    }

    private function findOwnedCapitalCity(Environment $environment, Player $player): ?City
    {
        foreach ($environment->cities as $city) {
            if ($city->markerType === MapMarkers::TYPE_CAPITAL && $city->owner === $player) {
                return $city;
            }
        }

        return null;
    }

    /**
     * @param  array{0: float, 1: float}  $capitalPosition
     * @return array{0: float, 1: float}|null
     */
    private function findRecruitSpawnPosition(Environment $environment, array $capitalPosition): ?array
    {
        $blockedTerrain = ['mountain', 'water', 'deep_water', 'river'];
        $offsets = [];

        for ($dx = -15; $dx <= 15; $dx++) {
            for ($dy = -15; $dy <= 15; $dy++) {
                if ($dx === 0 && $dy === 0) {
                    continue;
                }

                $offsets[] = [$dx * GameConstants::CELL_SIZE, $dy * GameConstants::CELL_SIZE];
            }
        }

        usort($offsets, function (array $a, array $b): int {
            $da = $a[0] ** 2 + $a[1] ** 2;
            $db = $b[0] ** 2 + $b[1] ** 2;

            return $da <=> $db;
        });

        foreach ($offsets as [$ox, $oy]) {
            $pos = [(float) $capitalPosition[0] + $ox, (float) $capitalPosition[1] + $oy];
            $name = $environment->terrainNameAtWorldPosition($pos);

            if (in_array($name, $blockedTerrain, true)) {
                continue;
            }

            if (! $this->recruitPositionHasClearance($environment, $pos, (float) GameConstants::ECONOMY_RECRUIT_CLEARANCE)) {
                continue;
            }

            return $pos;
        }

        return null;
    }

    /**
     * @param  array{0: float, 1: float}  $pos
     */
    private function recruitPositionHasClearance(Environment $environment, array $pos, float $minDistance): bool
    {
        foreach ($environment->players as $p) {
            foreach ($p->troops as $t) {
                $dx = $t->position[0] - $pos[0];
                $dy = $t->position[1] - $pos[1];

                if (hypot($dx, $dy) < $minDistance) {
                    return false;
                }
            }
        }

        return true;
    }

    private function redisKey(Game $game): string
    {
        return 'game:live:'.$game->uuid;
    }

    /**
     * Pushes a broadcast event without failing HTTP requests when Reverb/Pusher is unreachable
     * (for example when `php artisan reverb:start` is not running locally).
     */
    private function broadcastIgnoringTransportFailure(object $event): void
    {
        try {
            broadcast($event);
        } catch (\Throwable $e) {
            Log::warning('Game broadcast skipped (transport error).', [
                'event' => $event::class,
                'message' => $e->getMessage(),
            ]);
        }
    }

    private function assertLobbyWithinMaxAge(Game $game): void
    {
        if ($game->created_at->lt(now()->subSeconds(GameConstants::LOBBY_MAX_AGE_SECONDS))) {
            abort(410, 'This lobby expired after one hour without starting.');
        }
    }

    private function lobbyClosedMessage(Game $game): string
    {
        if ($game->status === GameStatus::Finished
            && ($game->settings['aborted_reason'] ?? null) === GameConstants::ABORTED_LOBBY_TIMEOUT) {
            return 'This lobby expired after one hour without starting.';
        }

        return 'This game has already started.';
    }

    /**
     * @param  array<string, mixed>  $state
     */
    private function touchPlayerActivityInState(array &$state, int $slot): void
    {
        $count = MatchPresenceMonitor::commanderSlotCount($state);
        if ($slot < 0 || $slot >= $count) {
            return;
        }

        $now = microtime(true);
        $activity = $state['lastPlayerActivityAt'] ?? [];
        if (! is_array($activity)) {
            $activity = [];
        }

        $normalized = [];
        for ($i = 0; $i < $count; $i++) {
            $normalized[$i] = isset($activity[$i]) && is_numeric($activity[$i])
                ? (float) $activity[$i]
                : $now;
        }
        $normalized[$slot] = $now;
        $state['lastPlayerActivityAt'] = $normalized;
    }

    /**
     * @return array<string, mixed>
     */
    public function snapshotPayloadForSlot(Game $game, int $slot): array
    {
        $player = $game->players()->where('slot', $slot)->firstOrFail();
        $state = $this->getLiveState($game);
        $this->repairLiveStateEconomy($game, $state);
        $worldTick = (int) ($state['worldTick'] ?? 0);
        $environment = $this->environmentFromState($state);
        $terrainInfo = $environment->getTerrainInfo();
        $terrainCells = $this->terrainCellsForSnapshot($game->map_data, $terrainInfo['terrain']);

        return [
            'gameUuid' => $game->uuid,
            'slot' => $player->slot,
            'color' => $player->color,
            'terrain' => $terrainInfo['terrain'],
            'forest' => $terrainInfo['forest'],
            'cityPositions' => $terrainInfo['cityPositions'],
            'world' => $terrainInfo['world'],
            'state' => $environment->drawInfo($player->slot, $worldTick),
            'economy' => $state['economy'] ?? [],
            'worldTick' => $worldTick,
            ...($terrainCells !== null ? ['terrainCells' => $terrainCells] : []),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function snapshotPayloadForPlayer(Game $game, int $userId): array
    {
        $player = $game->players()->where('user_id', $userId)->firstOrFail();

        return $this->snapshotPayloadForSlot($game, $player->slot);
    }

    /**
     * @return array<string, mixed>
     */
    public function snapshotPayloadForGuest(Game $game, string $guestUuid): array
    {
        $player = $game->players()->where('guest_key', $guestUuid)->firstOrFail();

        return $this->snapshotPayloadForSlot($game, $player->slot);
    }

    /**
     * Original Map Builder terrain ids (when dimensions match the live marching-squares grid).
     *
     * @param  array<string, mixed>|null  $mapDataSnapshot
     * @param  list<list<float>>  $terrainGrid
     * @return list<list<string>>|null
     */
    private function terrainCellsForSnapshot(?array $mapDataSnapshot, array $terrainGrid): ?array
    {
        if (! is_array($mapDataSnapshot)) {
            return null;
        }

        $data = $mapDataSnapshot['data'] ?? null;
        if (! is_array($data)) {
            return null;
        }

        $cells = $data['cells'] ?? null;
        if (! is_array($cells) || $cells === []) {
            return null;
        }

        $expectedRows = count($terrainGrid);
        $expectedCols = $expectedRows > 0 && isset($terrainGrid[0]) && is_array($terrainGrid[0])
            ? count($terrainGrid[0])
            : 0;

        if ($expectedRows < 1 || $expectedCols < 1) {
            return null;
        }

        if (count($cells) !== $expectedRows) {
            return null;
        }

        $normalized = [];

        foreach ($cells as $row) {
            if (! is_array($row) || count($row) !== $expectedCols) {
                return null;
            }

            $normalizedRow = [];
            foreach ($row as $cell) {
                $normalizedRow[] = is_string($cell) ? $cell : 'plains';
            }

            $normalized[] = $normalizedRow;
        }

        return $normalized;
    }
}
