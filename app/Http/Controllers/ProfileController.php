<?php

namespace App\Http\Controllers;

use App\Enums\GameStatus;
use App\Models\Game;
use App\Models\GamePlayer;
use App\Models\Map;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Jorenvh\Share\ShareFacade as Share;

class ProfileController extends Controller
{
    public function leaderboard(): Response
    {
        $rows = User::query()
            ->whereHas('gamePlayers', fn ($gp) => $gp->whereHas(
                'game',
                fn ($g) => $g->where('status', GameStatus::Finished),
            ))
            ->withCount([
                'gamePlayers as finished_matches_count' => fn ($q) => $q->whereHas(
                    'game',
                    fn ($g) => $g->where('status', GameStatus::Finished),
                ),
                'gamesWon as wins_count' => fn ($q) => $q->where('status', GameStatus::Finished),
                'gamesHosted as finished_hosts_count' => fn ($q) => $q->where('status', GameStatus::Finished),
                'maps as published_maps_count' => fn ($q) => $q->where('published', true),
            ])
            ->orderByDesc('wins_count')
            ->orderByDesc('finished_matches_count')
            ->limit(100)
            ->get()
            ->values()
            ->map(fn (User $user, int $index) => array_merge(
                $this->serializeLeaderboardRow($user),
                ['rank' => $index + 1],
            ));

        return Inertia::render('community/Leaderboard', [
            'leaderboard' => $rows,
        ]);
    }

    public function show(Request $request, User $profile): Response
    {
        $profile->loadCount([
            'gamePlayers as finished_matches_count' => fn ($q) => $q->whereHas(
                'game',
                fn ($g) => $g->where('status', GameStatus::Finished),
            ),
            'gamesWon as wins_count' => fn ($q) => $q->where('status', GameStatus::Finished),
            'gamesHosted as finished_hosts_count' => fn ($q) => $q->where('status', GameStatus::Finished),
            'maps as published_maps_count' => fn ($q) => $q->where('published', true),
        ]);

        $publishedMaps = Map::query()
            ->where('user_id', $profile->id)
            ->where('published', true)
            ->latest('published_at')
            ->limit(12)
            ->get()
            ->map(fn (Map $map) => [
                'uuid' => $map->uuid,
                'name' => $map->name,
                'publishedAt' => $map->published_at?->toIso8601String(),
            ]);

        $stats = $this->statsFromUserCounts($profile);

        $battleHistory = Game::query()
            ->where('status', GameStatus::Finished)
            ->whereHas('players', fn ($q) => $q->where('user_id', $profile->id))
            ->with(['players.user', 'winner'])
            ->latest('finished_at')
            ->limit(20)
            ->get()
            ->map(function (Game $game) use ($profile): array {
                $gameUrl = route('games.show', $game);

                /** @var array<string, string> $gameShareLinks */
                $gameShareLinks = Share::page($gameUrl, "Check out this War of Dots match - code {$game->code}!")
                    ->facebook()
                    ->twitter()
                    ->linkedin()
                    ->whatsapp()
                    ->telegram()
                    ->reddit()
                    ->pinterest()
                    ->getRawLinks();

                $winnerName = $game->winner?->game_display_name ?: $game->winner?->name;
                $isWinner = $game->winner_user_id === $profile->id;

                return [
                    'uuid' => $game->uuid,
                    'code' => $game->code,
                    'finishedAt' => $game->finished_at?->toIso8601String(),
                    'winnerName' => $winnerName,
                    'isWinner' => $isWinner,
                    'players' => $game->players->map(fn (GamePlayer $p) => [
                        'name' => $p->displayLabel(),
                        'color' => $p->color ?? '#888888',
                    ])->values(),
                    'shareLinks' => $gameShareLinks,
                    'gameUrl' => $gameUrl,
                ];
            });

        $profileUrl = route('profiles.show', ['profile' => $profile->profile_uuid]);
        $playerTag = $profile->game_display_name ?: $profile->name;

        /** @var array<string, string> $shareLinks */
        $shareLinks = Share::page($profileUrl, "Check out {$playerTag}'s War of Dots profile!")
            ->facebook()
            ->twitter()
            ->linkedin()
            ->whatsapp()
            ->telegram()
            ->reddit()
            ->pinterest()
            ->getRawLinks();

        return Inertia::render('community/ProfileShow', [
            'profile' => [
                'name' => $profile->name,
                'playerTag' => $playerTag,
                'avatar' => $profile->avatar,
                'avatarStyle' => $profile->avatar_style ?? 'pixel-art',
                'profileUuid' => $profile->profile_uuid,
                'memberSince' => $profile->created_at?->toIso8601String(),
                'profileUrl' => $profileUrl,
            ],
            'stats' => $stats,
            'publishedMaps' => $publishedMaps,
            'battleHistory' => $battleHistory,
            'isOwnProfile' => $request->user()?->id === $profile->id,
            'shareLinks' => $shareLinks,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeLeaderboardRow(User $user): array
    {
        return array_merge(
            [
                'profileUuid' => $user->profile_uuid,
                'name' => $user->game_display_name ?: $user->name,
                'avatar' => $user->avatar,
                'avatarStyle' => $user->avatar_style ?? 'pixel-art',
            ],
            $this->statsFromUserCounts($user),
        );
    }

    /**
     * @return array{
     *     wins: int,
     *     losses: int,
     *     matchesPlayed: int,
     *     winRate: float,
     *     finishedHosts: int,
     *     publishedMapCount: int
     * }
     */
    private function statsFromUserCounts(User $user): array
    {
        $wins = (int) ($user->wins_count ?? 0);
        $played = (int) ($user->finished_matches_count ?? 0);
        $hosts = (int) ($user->finished_hosts_count ?? 0);
        $losses = max(0, $played - $wins);
        $publishedMapCount = (int) ($user->published_maps_count ?? 0);

        return [
            'wins' => $wins,
            'losses' => $losses,
            'matchesPlayed' => $played,
            'winRate' => $played > 0 ? round(($wins / $played) * 100, 1) : 0.0,
            'finishedHosts' => $hosts,
            'publishedMapCount' => $publishedMapCount,
        ];
    }
}
