<?php

namespace App\Games\Engine;

final class City
{
    public int $timer = 0;

    public ?Player $owner = null;

    /** Map marker role for UI: `flag`, `capital`, or null (neutral). */
    public ?string $markerType = null;

    /** Whether this city is active as a spawn point for the owning player's army. */
    public bool $recruitmentEnabled = true;

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
            'markerType' => $this->markerType,
            'recruitmentEnabled' => $this->recruitmentEnabled,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data, Environment $environment): self
    {
        $marker = $data['markerType'] ?? null;
        $city = new self($data['position'], $data['id'], is_string($marker) ? $marker : null);
        $city->timer = (int) ($data['timer'] ?? 0);
        $city->recruitmentEnabled = (bool) ($data['recruitmentEnabled'] ?? true);

        if (($data['ownerSlot'] ?? null) !== null) {
            $city->owner = $environment->players[$data['ownerSlot']] ?? null;
        }

        return $city;
    }
}
