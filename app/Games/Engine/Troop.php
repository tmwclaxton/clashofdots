<?php

namespace App\Games\Engine;

final class Troop
{
    public int $health = 100;

    /** 0–100; affects attack effectiveness when fatigued. */
    public int $morale = 100;

    /**
     * World tick index when this unit was created, or -1 for “born at match start” (age uses current tick).
     */
    public int $spawnedAtWorldTick = -1;

    /** @var list<array{0: float, 1: float}> */
    public array $path = [];

    /**
     * @param  array{0: float, 1: float}  $position
     * @param  list<array{0: float, 1: float}>|null  $path
     */
    public function __construct(
        public array $position,
        public Player $owner,
        public int $id,
        ?array $path = null,
        int $spawnedAtWorldTick = -1,
    ) {
        $this->path = $path ?? [];
        $this->spawnedAtWorldTick = $spawnedAtWorldTick;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'position' => $this->position,
            'health' => $this->health,
            'morale' => $this->morale,
            'spawnedAtWorldTick' => $this->spawnedAtWorldTick,
            'path' => $this->path,
            'ownerSlot' => $this->owner->slot,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data, Player $owner): self
    {
        $troop = new self(
            $data['position'],
            $owner,
            $data['id'],
            $data['path'] ?? [],
            (int) ($data['spawnedAtWorldTick'] ?? -1),
        );
        $troop->health = (int) ($data['health'] ?? 100);
        $troop->morale = (int) ($data['morale'] ?? 100);

        return $troop;
    }
}
