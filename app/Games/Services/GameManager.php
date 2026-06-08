<?php

namespace App\Games\Services;

use App\Enums\GameStatus;
use App\Events\GameEnded;
use App\Events\GameInitialized;
use App\Events\GameStateUpdated;
use App\Games\Engine\Environment;
use App\Games\GameConstants;
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
            'pauseRequests' => array_fill(0, $playerCount, false),
            'lastPlayerActivityAt' => array_fill(0, $playerCount, $now),
        ]);

        Redis::sadd(self::ACTIVE_SET, $game->uuid);

        $game->load('players');

        $terrainInfo = $environment->getTerrainInfo();
        $terrainCells = $this->terrainCellsForSnapshot($game->map_data, $terrainInfo['terrain']);
        if ($terrainCells !== null) {
            $terrainInfo['terrainCells'] = $terrainCells;
        }

        foreach ($game->players as $player) {
            $this->broadcastIgnoringTransportFailure(new GameInitialized(
                $game,
                $player->broadcastConnection(),
                $player->slot,
                $terrainInfo,
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
    }

    public function togglePause(Game $game, GamePlayer $player, bool $paused): void
    {
        if ($game->status !== GameStatus::Playing) {
            abort(422, 'Pause can only be toggled during a live match.');
        }

        if ($player->game_id !== $game->id) {
            abort(403);
        }

        $state = $this->getLiveState($game);

        $state['pauseRequests'][$player->slot] = $paused;
        $player->update(['pause_requested' => $paused]);

        $this->touchPlayerActivityInState($state, $player->slot);
        $this->storeLiveState($game, $state);
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

        return json_decode($raw, true, flags: JSON_THROW_ON_ERROR);
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

    public function broadcastState(Game $game, Environment $environment): void
    {
        foreach ($game->players as $player) {
            $this->broadcastIgnoringTransportFailure(new GameStateUpdated(
                $game,
                $player->broadcastConnection(),
                $environment->drawInfo($player->slot),
            ));
        }
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
        $pauseRequests = $state['pauseRequests'] ?? [];
        $count = count($pauseRequests);
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
            'state' => $environment->drawInfo($player->slot),
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
