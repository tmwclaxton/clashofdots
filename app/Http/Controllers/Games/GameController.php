<?php

namespace App\Http\Controllers\Games;

use App\Enums\GameStatus;
use App\Events\ChatMessageSent;
use App\Games\GameConstants;
use App\Games\Services\GameManager;
use App\Games\Services\GuestGameIdentity;
use App\Http\Controllers\Controller;
use App\Http\Requests\Games\CreateGameRequest;
use App\Http\Requests\Games\SubmitOrdersRequest;
use App\Models\ChatMessage;
use App\Models\Game;
use App\Models\GamePlayer;
use App\Models\GameReplaySnapshot;
use App\Models\Map;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Jorenvh\Share\ShareFacade as Share;

class GameController extends Controller
{
    public function lobbies(Request $request): Response
    {
        $userId = $request->user()?->id;
        $guestKey = $this->guestKeyFromSession($request);

        return Inertia::render('games/Lobby', [
            'lobbies' => Inertia::defer(function () use ($userId, $guestKey) {
                return Game::query()
                    ->where('status', GameStatus::Lobby)
                    ->where('created_at', '>=', now()->subSeconds(GameConstants::LOBBY_MAX_AGE_SECONDS))
                    ->with(['players.user', 'host', 'map.user'])
                    ->latest()
                    ->limit(20)
                    ->get()
                    ->map(fn (Game $game) => $this->serializeLobby($game, $userId, $guestKey));
            }),
            'playerTag' => $request->user()?->game_display_name,
        ]);
    }

    public function ongoing(Request $request, GameManager $gameManager): Response
    {
        $user = $request->user();
        $guestKey = $this->guestKeyFromSession($request);
        $activeUuids = $gameManager->activeGameUuids();

        return Inertia::render('matches/Ongoing', [
            'matches' => Inertia::defer(function () use ($user, $guestKey) {
                if ($user === null && $guestKey === null) {
                    return collect();
                }

                return Game::query()
                    ->where('status', GameStatus::Playing)
                    ->where(function ($query) use ($user, $guestKey) {
                        if ($user !== null) {
                            $query->whereHas('players', fn ($q) => $q->where('user_id', $user->id));
                        }
                        if ($guestKey !== null) {
                            if ($user !== null) {
                                $query->orWhereHas('players', fn ($q) => $q->where('guest_key', $guestKey));
                            } else {
                                $query->whereHas('players', fn ($q) => $q->where('guest_key', $guestKey));
                            }
                        }
                    })
                    ->with(['players.user', 'host', 'map.user'])
                    ->latest('started_at')
                    ->limit(20)
                    ->get()
                    ->map(fn (Game $game) => $this->serializeMatch($game, $user?->id, $guestKey));
            }),
            'spectatableMatches' => Inertia::defer(function () use ($user, $guestKey, $activeUuids) {
                $matches = $user === null && $guestKey === null
                    ? collect()
                    : Game::query()
                        ->where('status', GameStatus::Playing)
                        ->where(function ($query) use ($user, $guestKey) {
                            if ($user !== null) {
                                $query->whereHas('players', fn ($q) => $q->where('user_id', $user->id));
                            }
                            if ($guestKey !== null) {
                                if ($user !== null) {
                                    $query->orWhereHas('players', fn ($q) => $q->where('guest_key', $guestKey));
                                } else {
                                    $query->whereHas('players', fn ($q) => $q->where('guest_key', $guestKey));
                                }
                            }
                        })
                        ->latest('started_at')
                        ->limit(20)
                        ->pluck('uuid');

                $matchUuids = $matches->all();

                $liveSpectatable = collect($activeUuids)
                    ->filter()
                    ->unique()
                    ->reject(fn (string $uuid) => in_array($uuid, $matchUuids, true))
                    ->values();

                if ($liveSpectatable->isEmpty()) {
                    return collect();
                }

                return Game::query()
                    ->where('status', GameStatus::Playing)
                    ->whereIn('uuid', $liveSpectatable->all())
                    ->with(['players.user', 'host', 'map.user'])
                    ->latest('started_at')
                    ->limit(20)
                    ->get()
                    ->map(fn (Game $game) => $this->serializeLobby($game, $user?->id, $guestKey));
            }),
        ]);
    }

    public function past(Request $request): Response
    {
        $userId = $request->user()->id;

        return Inertia::render('matches/Past', [
            'matches' => Inertia::defer(function () use ($userId) {
                return Game::query()
                    ->where('status', GameStatus::Finished)
                    ->whereHas('players', fn ($query) => $query->where('user_id', $userId))
                    ->with(['players.user', 'host', 'winner', 'map.user'])
                    ->latest('finished_at')
                    ->limit(20)
                    ->get()
                    ->map(function (Game $game) use ($userId): array {
                        $gameUrl = route('games.show', $game);

                        /** @var array<string, string> $shareLinks */
                        $shareLinks = Share::page($gameUrl, "Check out this War of Dots match - code {$game->code}!")
                            ->facebook()
                            ->twitter()
                            ->linkedin()
                            ->whatsapp()
                            ->telegram()
                            ->reddit()
                            ->pinterest()
                            ->getRawLinks();

                        return array_merge($this->serializeMatch($game, $userId, null), [
                            'shareLinks' => $shareLinks,
                            'gameUrl' => $gameUrl,
                        ]);
                    });
            }),
        ]);
    }

    public function store(CreateGameRequest $request, GameManager $gameManager): RedirectResponse
    {
        $map = Map::query()
            ->where('uuid', $request->string('map_uuid'))
            ->where('published', true)
            ->firstOrFail();

        $game = $gameManager->create(
            $request->user(),
            $map,
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Lobby created.']);

        return to_route('games.show', $game);
    }

    public function show(Request $request, Game $game): Response
    {
        $game->load(['players.user', 'host', 'map.user']);

        $gameUrl = route('games.show', $game);

        /** @var array<string, string> $shareLinks */
        $shareLinks = Share::page($gameUrl, "Join my War of Dots lobby - code {$game->code}!")
            ->facebook()
            ->twitter()
            ->linkedin()
            ->whatsapp()
            ->telegram()
            ->reddit()
            ->pinterest()
            ->getRawLinks();

        $userId = $request->user()?->id;
        $guestKey = $this->guestKeyFromSession($request);

        $gamePayload = $game->status === GameStatus::Finished
            ? $this->serializeMatch($game, $userId, $guestKey)
            : $this->serializeLobby($game, $userId, $guestKey);

        return Inertia::render('games/Show', [
            'game' => $gamePayload,
            'shareLinks' => $shareLinks,
            'gameUrl' => $gameUrl,
        ]);
    }

    public function join(Request $request, Game $game, GameManager $gameManager): RedirectResponse
    {
        $validated = $request->validate([
            'display_name' => ['nullable', 'string', 'max:50'],
        ]);

        if ($request->user() !== null) {
            $gameManager->join($game, $request->user());
        } else {
            $guestKey = GuestGameIdentity::ensure($request);
            $gameManager->joinAsGuest($game, $guestKey, $validated['display_name'] ?? null);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Joined lobby.']);

        return to_route('games.show', $game);
    }

    public function joinByCode(Request $request, GameManager $gameManager): RedirectResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'size:6'],
            'display_name' => ['nullable', 'string', 'max:50'],
        ]);

        $game = Game::query()->where('code', strtoupper($request->string('code')))->firstOrFail();

        if ($request->user() !== null) {
            $gameManager->join($game, $request->user());
        } else {
            $guestKey = GuestGameIdentity::ensure($request);
            $gameManager->joinAsGuest($game, $guestKey, $request->input('display_name'));
        }

        return to_route('games.show', $game);
    }

    public function leave(Request $request, Game $game, GameManager $gameManager): RedirectResponse
    {
        $user = $request->user();
        $guestKey = $this->guestKeyFromSession($request);

        $gameManager->leaveLobby($game, $user, $guestKey);

        return to_route('lobbies.index');
    }

    public function start(Request $request, Game $game, GameManager $gameManager): RedirectResponse
    {
        $gameManager->start($game, $request->user());

        return to_route('games.show', $game);
    }

    public function updatePlayerProfile(Request $request, Game $game): RedirectResponse
    {
        $validated = $request->validate([
            'display_name' => ['nullable', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
        ]);

        $user = $request->user();
        $guestKey = $this->guestKeyFromSession($request);

        $player = $user !== null
            ? $game->players()->where('user_id', $user->id)->first()
            : ($guestKey !== null ? $game->players()->where('guest_key', $guestKey)->first() : null);

        abort_if($player === null, 403);

        $updates = array_filter([
            'color' => $validated['color'] ?? null,
            'display_name' => $validated['display_name'] ?? null,
        ], fn ($v) => $v !== null);

        if (! empty($updates)) {
            $player->update($updates);
        }

        if ($user !== null && isset($validated['display_name'])) {
            $user->update(['game_display_name' => $validated['display_name']]);
        }

        return back();
    }

    public function play(Request $request, Game $game): Response
    {
        abort_unless($game->status === GameStatus::Playing, 404);

        $player = $this->actingPlayer($request, $game);

        if ($player === null) {
            abort(404);
        }

        $game->load(['players.user']);

        return Inertia::render('games/Play', [
            'game' => $this->playPayload($game, $player),
            'snapshotUrl' => route('games.snapshot', $game),
            'spectatorMode' => false,
            'gameConstants' => $this->gameConstantsProp(),
        ]);
    }

    public function spectate(Game $game): Response
    {
        abort_unless($game->status === GameStatus::Playing, 404);

        $game->load(['players.user']);

        return Inertia::render('games/Play', [
            'game' => $this->spectatePayload($game),
            'snapshotUrl' => route('games.spectate-snapshot', $game),
            'spectatorMode' => true,
            'gameConstants' => $this->gameConstantsProp(),
        ]);
    }

    public function spectateSnapshot(Game $game, GameManager $gameManager): JsonResponse
    {
        abort_unless($game->status === GameStatus::Playing, 404);

        $gameManager->maybeAdvanceTickIfDaemonAbsent($game);

        $payload = $gameManager->snapshotPayloadForSlot($game, 0);

        return $this->jsonSnapshotNoStore($payload);
    }

    public function snapshot(Request $request, Game $game, GameManager $gameManager): JsonResponse
    {
        if ($game->status === GameStatus::Finished) {
            return $this->jsonSnapshotNoStore($this->finishedGamePayload($game));
        }

        abort_unless($game->status === GameStatus::Playing, 404);

        $gameManager->maybeAdvanceTickIfDaemonAbsent($game);

        if ($request->user() !== null) {
            $player = $game->players()->where('user_id', $request->user()->id)->firstOrFail();
            $payload = $gameManager->snapshotPayloadForPlayer($game, $request->user()->id);
            $gameManager->touchPlayerActivity($game, $player->slot);

            return $this->jsonSnapshotNoStore($payload);
        }

        $guestKey = $this->guestKeyFromSession($request);
        if ($guestKey === null) {
            abort(403);
        }

        $player = $game->players()->where('guest_key', $guestKey)->firstOrFail();
        $payload = $gameManager->snapshotPayloadForGuest($game, $guestKey);
        $gameManager->touchPlayerActivity($game, $player->slot);

        return $this->jsonSnapshotNoStore($payload);
    }

    public function submitOrders(SubmitOrdersRequest $request, Game $game, GameManager $gameManager): JsonResponse
    {
        $player = $this->actingPlayer($request, $game);

        if ($player === null) {
            abort(403);
        }

        $gameManager->submitOrders($game, $player, [
            $request->input('troop_orders', []),
        ]);

        return response()->json(['ok' => true]);
    }

    public function setCityRecruitment(Request $request, Game $game, GameManager $gameManager): JsonResponse
    {
        $player = $this->actingPlayer($request, $game);

        if ($player === null) {
            abort(403);
        }

        $validated = $request->validate([
            'city_id' => ['required', 'integer'],
            'enabled' => ['required', 'boolean'],
        ]);

        $gameManager->setCityRecruitment($game, $player, (int) $validated['city_id'], (bool) $validated['enabled']);

        return response()->json(['ok' => true]);
    }

    public function replay(Request $request, Game $game): Response
    {
        $snapshots = GameReplaySnapshot::where('game_id', $game->id)
            ->orderBy('world_tick')
            ->get()
            ->map(fn ($s) => [
                'worldTick' => $s->world_tick,
                'state' => $s->decodeState(),
            ])
            ->values()
            ->toArray();

        return Inertia::render('games/Replay', [
            'game' => $game->only(['uuid', 'id']),
            'snapshots' => $snapshots,
        ]);
    }

    public function sendChat(Request $request, Game $game): JsonResponse
    {
        $player = $this->actingPlayer($request, $game);

        if ($player === null) {
            abort(403);
        }

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:200'],
        ]);

        $message = ChatMessage::create([
            'game_id' => $game->id,
            'game_player_id' => $player->id,
            'body' => $validated['body'],
        ]);

        $senderName = $player->user?->name ?? 'Commander';

        ChatMessageSent::dispatch($game, $message, $senderName, $player->slot);

        return response()->json(['ok' => true]);
    }

    public function setPlayerProduction(Request $request, Game $game, GameManager $gameManager): JsonResponse
    {
        $player = $this->actingPlayer($request, $game);

        if ($player === null) {
            abort(403);
        }

        $validated = $request->validate([
            'tank_ratio' => ['required', 'integer', 'min:0', 'max:100'],
            'speed_multiplier' => ['required', 'numeric', 'min:0', 'max:3'],
        ]);

        $gameManager->setPlayerProduction(
            $game,
            $player,
            (int) $validated['tank_ratio'],
            (float) $validated['speed_multiplier'],
        );

        return response()->json(['ok' => true]);
    }

    /**
     * @return array<string, mixed>
     */
    private function playPayload(Game $game, GamePlayer $player): array
    {
        return [
            'uuid' => $game->uuid,
            'code' => $game->code,
            'maxPlayers' => $game->max_players,
            'slot' => $player->slot,
            'color' => $player->color,
            'players' => $game->players->sortBy('slot')->values()->map(fn (GamePlayer $p) => [
                'slot' => $p->slot,
                'name' => $p->displayLabel(),
                'color' => $p->color,
                'teamIndex' => $p->team_index ?? 0,
                'profileUuid' => $p->user?->profile_uuid ?? null,
            ]),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function spectatePayload(Game $game): array
    {
        $first = $game->players->sortBy('slot')->first();

        return [
            'uuid' => $game->uuid,
            'code' => $game->code,
            'maxPlayers' => $game->max_players,
            'slot' => $first?->slot ?? 0,
            'color' => $first?->color ?? '#888888',
            'players' => $game->players->sortBy('slot')->values()->map(fn (GamePlayer $p) => [
                'slot' => $p->slot,
                'name' => $p->displayLabel(),
                'color' => $p->color,
                'profileUuid' => $p->user?->profile_uuid ?? null,
            ]),
        ];
    }

    public function surrender(Request $request, Game $game, GameManager $gameManager): JsonResponse
    {
        abort_unless($game->status === GameStatus::Playing, 422, 'Game is not in progress.');

        $player = $this->actingPlayer($request, $game);

        if ($player === null) {
            abort(403);
        }

        $gameManager->surrender($game, $player);

        return response()->json(['ok' => true]);
    }

    private function actingPlayer(Request $request, Game $game): ?GamePlayer
    {
        if ($request->user() !== null) {
            return $game->players()->where('user_id', $request->user()->id)->first();
        }

        $guestKey = $this->guestKeyFromSession($request);
        if ($guestKey === null) {
            return null;
        }

        return $game->players()->where('guest_key', $guestKey)->first();
    }

    private function guestKeyFromSession(Request $request): ?string
    {
        $key = $request->session()->get(GuestGameIdentity::SESSION_KEY);

        if (! is_string($key) || ! Str::isUuid($key)) {
            return null;
        }

        return $key;
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeMatch(Game $game, ?int $userId, ?string $guestKey): array
    {
        $winnerName = $game->winner?->name;
        if ($winnerName === null && $game->winner_slot !== null) {
            $game->loadMissing('players');
            $winnerName = $game->players->firstWhere('slot', $game->winner_slot)?->displayLabel();
        }

        $isWinner = false;
        if ($userId !== null) {
            $isWinner = $game->winner_user_id === $userId;
        } elseif ($guestKey !== null && $game->winner_slot !== null) {
            $game->loadMissing('players');
            $isWinner = $game->players->contains(
                fn (GamePlayer $p) => $p->guest_key === $guestKey && $p->slot === $game->winner_slot,
            );
        }

        return [
            ...$this->serializeLobby($game, $userId, $guestKey),
            'startedAt' => $game->started_at?->toIso8601String(),
            'finishedAt' => $game->finished_at?->toIso8601String(),
            'winnerName' => $winnerName,
            'isWinner' => $isWinner,
        ];
    }

    /**
     * Thin payload returned by the snapshot endpoint when the game has already finished.
     * Lets the canvas client show the correct victory / defeat overlay without needing WebSockets.
     *
     * @return array{matchEnded: true, winnerSlot: int|null, winnerUserId: int|null, winnerName: string|null}
     */
    private function finishedGamePayload(Game $game): array
    {
        $game->loadMissing(['players', 'winner']);

        $winnerName = $game->winner?->name;
        if ($winnerName === null && $game->winner_slot !== null) {
            $winnerName = $game->players->firstWhere('slot', $game->winner_slot)?->displayLabel();
        }

        return [
            'matchEnded' => true,
            'winnerSlot' => $game->winner_slot,
            'winnerUserId' => $game->winner_user_id,
            'winnerName' => $winnerName,
        ];
    }

    /**
     * Live match JSON must not be cached by browsers or proxies; stale snapshots freeze the HUD worldTick.
     *
     * @param  array<string, mixed>  $payload
     */
    private function jsonSnapshotNoStore(array $payload): JsonResponse
    {
        return response()->json($payload)->withHeaders([
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeLobby(Game $game, ?int $userId, ?string $guestKey): array
    {
        $game->loadMissing('map.user');

        $sourceMap = null;
        $mapPreviewData = null;
        if ($game->map !== null) {
            $sourceMap = [
                'uuid' => $game->map->uuid,
                'name' => $game->map->name,
                'by' => $game->map->user?->name ?? 'Unknown',
            ];
            if (is_array($game->map->data)) {
                $mapPreviewData = $game->map->data;
            }
        } elseif (is_array($game->map_data)) {
            $snap = $game->map_data;
            $sourceMap = [
                'uuid' => (string) ($snap['source_uuid'] ?? ''),
                'name' => (string) ($snap['source_name'] ?? 'Unknown map'),
                'by' => (string) ($snap['source_author'] ?? 'Unknown'),
            ];
            if (is_array($snap['data'] ?? null)) {
                $mapPreviewData = $snap['data'];
            }
        }

        $isParticipant = ($userId !== null && $game->players->contains('user_id', $userId))
            || ($guestKey !== null && $game->players->contains('guest_key', $guestKey));

        return [
            'uuid' => $game->uuid,
            'code' => $game->code,
            'status' => $game->status->value,
            'maxPlayers' => $game->max_players,
            'playerCount' => $game->players->count(),
            'isHost' => $userId !== null && $game->host_user_id !== null && $game->host_user_id === $userId,
            'isParticipant' => $isParticipant,
            'canStart' => $game->canStart(),
            'hostName' => $game->host !== null
                ? ($game->host->game_display_name ?: $game->host->name)
                : null,
            'players' => $game->players->sortBy('slot')->values()->map(fn (GamePlayer $player) => [
                'slot' => $player->slot,
                'name' => $player->displayLabel(),
                'color' => $player->color,
                'teamIndex' => $player->team_index ?? 0,
            ]),
            'sourceMap' => $sourceMap,
            'mapPreviewData' => $mapPreviewData,
            'abortedReason' => ($game->settings ?? [])['aborted_reason'] ?? null,
        ];
    }

    public function updatePlayerTag(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'player_tag' => ['required', 'string', 'max:50'],
        ]);

        $request->user()->update(['game_display_name' => $validated['player_tag']]);

        return back();
    }

    /**
     * @return array{recruitCost: int, recruitCostTank: int, upkeepPerTroop: int, tickRate: int}
     */
    private function gameConstantsProp(): array
    {
        return [
            'recruitCost' => GameConstants::ECONOMY_RECRUIT_COST,
            'recruitCostTank' => GameConstants::ECONOMY_RECRUIT_COST_TANK,
            'upkeepPerTroop' => GameConstants::ECONOMY_UPKEEP_PER_TROOP_PER_TICK,
            'tickRate' => GameConstants::TICK_RATE,
        ];
    }
}
