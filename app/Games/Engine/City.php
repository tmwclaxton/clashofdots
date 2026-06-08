<?php

namespace App\Games\Engine;

final class City
{
    public int $timer = 0;

    public ?Player $owner = null;

    /** Map marker role for UI: `flag`, `capital`, or null (neutral). */
    public ?string $markerType = null;

    /** @var list<array{0: float, 1: float}> */
    public array $path = [];

    /**
     * @param  array{0: float, 1: float}  $position
     */
    public function __construct(
        public array $position,
        public int $id,
        ?string $markerType = null,
    ) {
        $this->markerType = $markerType;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'position' => $this->position,
            'timer' => $this->timer,
            'ownerSlot' => $this->owner?->slot,
            'path' => $this->path,
            'markerType' => $this->markerType,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data, Environment $environment): self
    {
        $marker = $data['markerType'] ?? null;
        $city = new self($data['position'], $data['id'], is_string($marker) ? $marker : null);
        $city->timer = $data['timer'];
        $city->path = $data['path'] ?? [];

        if ($data['ownerSlot'] !== null) {
            $city->owner = $environment->players[$data['ownerSlot']] ?? null;
        }

        return $city;
    }
}
