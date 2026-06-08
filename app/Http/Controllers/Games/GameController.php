<?php

namespace App\Http\Controllers\Games;

use App\Enums\GameStatus;
use App\Games\GameConstants;
use App\Games\Services\GameManager;
use App\Games\Services\GuestGameIdentity;
use App\Http\Controllers\Controller;
use App\Http\Requests\Games\CreateGameRequest;
use App\Http\Requests\Games\SubmitOrdersRequest;
use App\Models\Game;
use App\Models\GamePlayer;
use App\Models\Map;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class GameController extends Controller
{
    public function lobbies(Request $request): Response
    {
        $userId = $request->user()?->id;
        $guestKey = $this->guestKeyFromSession($request);

        $lobbies = Game::query()
            ->where('status', GameStatus::Lobby)
            ->with(['players.user', 'host', 'map.user'])
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn (Game $game) => $this->serializeLobby($game, $userId, $guestKey));

        $publishedMaps = Map::query()
            ->where('published', true)
            ->with(['user:id,name'])
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->limit(30)
            ->get()
            ->map(fn (Map $map) => [
                'uuid' => $map->uuid,
                'name' => $map->name,
                'teamCount' => (int) ($map->data['teamCount'] ?? GameConstants::MIN_PLAYERS),
                'ownerName' => $map->user?->name ?? 'Unknown',
            ]);

        return Inertia::render('games/Lobby', [
            'lobbies' => $lobbies,
            'publishedMaps' => $publishedMaps,
        ]);
    }

    public function ongoing(Request $request, GameManager $gameManager): Response
    {
        $user = $request->user();
        $guestKey = $this->guestKeyFromSession($request);

        if ($user === null && $guestKey === null) {
            $matches = collect();
        } else {
            $matches = Game::query()
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
        }

        $matchUuids = $matches->pluck('uuid')->all();

        $liveSpectatable = collect($gameManager->activeGameUuids())
            ->filter()
            ->unique()
            ->reject(fn (string $uuid) => in_array($uuid, $matchUuids, true))
            ->values();

        $spectatableMatches = $liveSpectatable->isEmpty()
            ? collect()
            : Game::query()
                ->where('status', GameStatus::Playing)
                ->whereIn('uuid', $liveSpectatable->all())
                ->with(['players.user', 'host', 'map.user'])
                ->latest('started_at')
                ->limit(20)
                ->get()
                ->map(fn (Game $game) => $this->serializeLobby($game, $user?->id, $guestKey));

        return Inertia::render('matches/Ongoing', [
            'matches' => $matches,
            'spectatableMatches' => $spectatableMatches,
        ]);
    }

    public function past(Request $request): Response
    {
        $userId = $request->user()->id;

        $matches = Game::query()
            ->where('status', GameStatus::Finished)
            ->whereHas('players', fn ($query) => $query->where('user_id', $userId))
            ->with(['players.user', 'host', 'winner', 'map.user'])
            ->latest('finished_at')
            ->limit(20)
            ->get()
            ->map(fn (Game $game) => $this->serializeMatch($game, $userId, null));

        return Inertia::render('matches/Past', [
            'matches' => $matches,
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

        return Inertia::render('games/Show', [
            'game' => $this->serializeLobby(
                $game,
                $request->user()?->id,
                $this->guestKeyFromSession($request),
            ),
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

    public function start(Request $request, Game $game, GameManager $gameManager): RedirectResponse
    {
        $gameManager->start($game, $request->user());

        return to_route('games.play', $game);
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
        ]);
    }

    public function spectateSnapshot(Game $game, GameManager $gameManager): JsonResponse
    {
        abort_unless($game->status === GameStatus::Playing, 404);

        return response()->json($gameManager->snapshotPayloadForSlot($game, 0));
    }

    public function snapshot(Request $request, Game $game, GameManager $gameManager): JsonResponse
    {
        abort_unless($game->status === GameStatus::Playing, 404);

        if ($request->user() !== null) {
            $game->players()->where('user_id', $request->user()->id)->firstOrFail();

            return response()->json($gameManager->snapshotPayloadForPlayer($game, $request->user()->id));
        }

        $guestKey = $this->guestKeyFromSession($request);
        if ($guestKey === null) {
            abort(403);
        }

        $game->players()->where('guest_key', $guestKey)->firstOrFail();

        return response()->json($gameManager->snapshotPayloadForGuest($game, $guestKey));
    }

    public function submitOrders(SubmitOrdersRequest $request, Game $game, GameManager $gameManager): RedirectResponse
    {
        $player = $this->actingPlayer($request, $game);

        if ($player === null) {
            abort(403);
        }

        $gameManager->submitOrders($game, $player, [
            $request->input('troop_orders', []),
            $request->input('city_orders', []),
        ]);

        return back();
    }

    public function togglePause(Request $request, Game $game, GameManager $gameManager): RedirectResponse
    {
        $request->validate(['paused' => ['required', 'boolean']]);

        $player = $this->actingPlayer($request, $game);

        if ($player === null) {
            abort(403);
        }

        $gameManager->togglePause($game, $player, $request->boolean('paused'));

        return back();
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
            ]),
        ];
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
     * @return array<string, mixed>
     */
    private function serializeLobby(Game $game, ?int $userId, ?string $guestKey): array
    {
        $game->loadMissing('map.user');

        $sourceMap = null;
        if ($game->map !== null) {
            $sourceMap = [
                'uuid' => $game->map->uuid,
                'name' => $game->map->name,
                'by' => $game->map->user?->name ?? 'Unknown',
            ];
        } elseif (is_array($game->map_data)) {
            $snap = $game->map_data;
            $sourceMap = [
                'uuid' => (string) ($snap['source_uuid'] ?? ''),
                'name' => (string) ($snap['source_name'] ?? 'Unknown map'),
                'by' => (string) ($snap['source_author'] ?? 'Unknown'),
            ];
        }

        $isParticipant = ($userId !== null && $game->players->contains('user_id', $userId))
            || ($guestKey !== null && $game->players->contains('guest_key', $guestKey));

        return [
            'uuid' => $game->uuid,
            'code' => $game->code,
            'status' => $game->status->value,
            'maxPlayers' => $game->max_players,
            'playerCount' => $game->players->count(),
            'isHost' => $userId !== null && $game->host_user_id === $userId,
            'isParticipant' => $isParticipant,
            'canStart' => $game->canStart(),
            'hostName' => $game->host?->name,
            'players' => $game->players->sortBy('slot')->values()->map(fn (GamePlayer $player) => [
                'slot' => $player->slot,
                'name' => $player->displayLabel(),
                'color' => $player->color,
            ]),
            'sourceMap' => $sourceMap,
        ];
    }
}
