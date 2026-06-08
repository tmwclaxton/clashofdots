<?php

namespace App\Events;

use App\Games\GameConstants;
use App\Models\Game;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GameInitialized implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param  array{
     *     terrain: list<list<float>>,
     *     forest: list<list<float>>,
     *     cityPositions: list<array{0: float, 1: float}>
     * }  $terrainInfo
     */
    public function __construct(
        public Game $game,
        public string $broadcastConnection,
        public int $slot,
        public array $terrainInfo,
    ) {}

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('game.'.$this->game->uuid.'.'.$this->broadcastConnection),
        ];
    }

    public function broadcastAs(): string
    {
        return 'GameInitialized';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        $this->game->loadMissing('players');

        $color = $this->game->players->firstWhere('slot', $this->slot)?->color ?? '#c0392b';

        return [
            'gameUuid' => $this->game->uuid,
            'slot' => $this->slot,
            'color' => $color,
            'terrain' => $this->terrainInfo['terrain'],
            'forest' => $this->terrainInfo['forest'],
            'cityPositions' => $this->terrainInfo['cityPositions'],
            'world' => [
                'width' => GameConstants::WORLD_X,
                'height' => GameConstants::WORLD_Y,
                'cellSize' => GameConstants::CELL_SIZE,
            ],
        ];
    }
}
