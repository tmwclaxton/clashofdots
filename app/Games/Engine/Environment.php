<?php

namespace App\Games\Engine;

use App\Games\GameConstants;
use App\Maps\BattlefieldFromMap;

final class Environment
{
    /**
     * Inclusive maximum marching-squares vertex index along X (editor row / "grid X").
     * Defaults match {@see GameConstants::ROWS} for procedural maps; map-backed matches use full map width − 1.
     */
    public int $gridMaxX = GameConstants::ROWS;

    /**
     * Inclusive maximum marching-squares vertex index along Y (editor column / "grid Y").
     */
    public int $gridMaxY = GameConstants::COLS;

    public MarchingSquares $terrainMarching;

    public MarchingSquares $forestMarching;

    /** @var list<City> */
    public array $cities = [];

    /** @var list<list<float>> */
    public array $defaultVision = [];

    /** @var list<Player> */
    public array $players = [];

    /** @var list<list<Player>> */
    public array $playersInCities = [];

    public Brush $visionBrush;

    public Brush $cityVisionBrush;

    public Brush $borderBrush;

    public Brush $cityBorderBrush;

    private int $nextCityId = 1;

    private int $nextTroopId = 1;

    private int $rngSeed;

    public function __construct(
        private int $seed,
        private int $playerCount,
        private bool $skipProceduralInitialization = false,
    ) {
        $this->rngSeed = $seed;
        $this->terrainMarching = new MarchingSquares;
        $this->forestMarching = new MarchingSquares;
        if (! $this->skipProceduralInitialization) {
            $this->generateTerrain();
            $this->generateDefaultVision();
            $this->assignPlayers();
        }
        $this->visionBrush = new Brush(160, 1, 0);
        $this->cityVisionBrush = new Brush(260, 1, 0);
        $this->borderBrush = new Brush(40, 0.05, 0);
        $this->cityBorderBrush = new Brush(80, 0.05, 0);
        $this->playersInCities = array_fill(0, count($this->cities), []);
    }

    public static function create(int $seed, int $playerCount): self
    {
        return new self($seed, $playerCount);
    }

    /**
     * Build a battlefield from a published Map Builder v2 payload (full editor grid; no cropping).
     *
     * @param  array<string, mixed>  $mapDataV2
     * @param  array<int, int>  $teamIndicesBySlot
     */
    public static function fromMapEditorData(int $seed, int $playerCount, array $mapDataV2, array $teamIndicesBySlot = []): self
    {
        $environment = new self($seed, $playerCount, true);
        BattlefieldFromMap::populateEnvironment($environment, $mapDataV2, $teamIndicesBySlot);

        return $environment;
    }

    /**
     * @param  list<City>  $cities
     * @param  list<Player>  $players
     */
    public function setCitiesPlayersAndIds(
        array $cities,
        array $players,
        int $nextCityId,
        int $nextTroopId,
    ): void {
        $this->cities = $cities;
        $this->players = $players;
        $this->nextCityId = $nextCityId;
        $this->nextTroopId = $nextTroopId;
        $this->playersInCities = array_fill(0, count($this->cities), []);
    }

    /**
     * Sizes the marching-squares battlefield to match a Map Builder v2 grid ({@code cellRows}×{@code cellCols} vertices).
     */
    public function configureFromMapVertexGrid(int $cellRows, int $cellCols): void
    {
        if ($cellRows < 2 || $cellCols < 2) {
            throw new \InvalidArgumentException('Map vertex grid must be at least 2×2.');
        }

        $this->gridMaxX = $cellRows - 1;
        $this->gridMaxY = $cellCols - 1;
    }

    /**
     * @return array{width: int, height: int, cellSize: int}
     */
    public function worldPixelSize(): array
    {
        return [
            'width' => ($this->gridMaxX + 1) * GameConstants::CELL_SIZE,
            'height' => ($this->gridMaxY + 1) * GameConstants::CELL_SIZE,
            'cellSize' => GameConstants::CELL_SIZE,
        ];
    }

    public function rebuildDefaultVisionFromTerrain(): void
    {
        $this->defaultVision = MarchingSquares::emptyGrid($this->gridMaxX, $this->gridMaxY);

        for ($y = 0; $y <= $this->gridMaxY; $y++) {
            for ($x = 0; $x <= $this->gridMaxX; $x++) {
                $terrainValue = $this->terrainMarching->grid[$x][$y];
                $forestValue = $this->forestMarching->grid[$x][$y];
                $this->defaultVision[$x][$y] = 0.35 + (
                    max(min((($terrainValue + 0.1) / 1) + 0.2, 1), 0.2)
                    + ($forestValue > 0.6 ? 0.8 : 0.0)
                );
            }
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'seed' => $this->seed,
            'playerCount' => $this->playerCount,
            'gridMaxX' => $this->gridMaxX,
            'gridMaxY' => $this->gridMaxY,
            'terrain' => $this->terrainMarching->grid,
            'forest' => $this->forestMarching->grid,
            'defaultVision' => $this->defaultVision,
            'cities' => array_map(fn (City $c) => $c->toArray(), $this->cities),
            'players' => array_map(fn (Player $p) => $p->toArray(), $this->players),
            'nextCityId' => $this->nextCityId,
            'nextTroopId' => $this->nextTroopId,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        $seed = self::coercePersistedInt($data['seed'] ?? 0);
        $playerCount = self::coercePlayerCount($data['playerCount'] ?? 1);

        // Persisted matches already include terrain; never run procedural generation here (and avoid
        // invalid JSON floats / huge grid hints breaking random_int-style math in generateTerrain()).
        $environment = new self($seed, $playerCount, true);
        $environment->terrainMarching->setGrid($data['terrain']);
        $environment->forestMarching->setGrid($data['forest']);

        $terrain = $data['terrain'] ?? [];
        $inferredMaxX = GameConstants::ROWS - 1;
        $inferredMaxY = GameConstants::COLS - 1;
        if (is_array($terrain) && $terrain !== []) {
            $inferredMaxX = max(1, count($terrain) - 1);
            $firstRow = $terrain[0] ?? [];
            $inferredMaxY = is_array($firstRow) && $firstRow !== []
                ? max(1, count($firstRow) - 1)
                : GameConstants::COLS;
        }

        if (isset($data['gridMaxX'], $data['gridMaxY']) && is_numeric($data['gridMaxX']) && is_numeric($data['gridMaxY'])) {
            $environment->gridMaxX = self::coerceGridAxis($data['gridMaxX'], $inferredMaxX);
            $environment->gridMaxY = self::coerceGridAxis($data['gridMaxY'], $inferredMaxY);
        } else {
            $environment->gridMaxX = $inferredMaxX;
            $environment->gridMaxY = $inferredMaxY;
        }

        $environment->defaultVision = $data['defaultVision'];
        $environment->nextCityId = self::coercePositiveInt($data['nextCityId'] ?? 1, 1);
        $environment->nextTroopId = self::coercePositiveInt($data['nextTroopId'] ?? 1, 1);
        $environment->cities = [];
        $environment->players = [];

        foreach ($data['players'] as $playerData) {
            $environment->players[] = Player::fromArray($playerData, $environment);
        }

        foreach ($data['cities'] as $cityData) {
            $environment->cities[] = City::fromArray($cityData, $environment);
        }

        $environment->playersInCities = array_fill(0, count($environment->cities), []);

        return $environment;
    }

    private const int MAX_PERSISTED_GRID_AXIS = 4096;

    private static function coercePlayerCount(mixed $value): int
    {
        $n = self::coercePersistedInt($value);
        $n = max(1, $n);

        return min(GameConstants::MAX_PLAYERS, $n);
    }

    /**
     * Coerce JSON-decoded numbers to int without throwing on overflow or non-finite floats.
     */
    private static function coercePersistedInt(mixed $value): int
    {
        if (is_int($value)) {
            return $value;
        }

        if (is_float($value)) {
            if (! is_finite($value)) {
                return 0;
            }

            if ($value > (float) PHP_INT_MAX || $value < (float) PHP_INT_MIN) {
                return 0;
            }

            return (int) $value;
        }

        if (is_string($value) && is_numeric($value)) {
            return self::coercePersistedInt(0 + $value);
        }

        return 0;
    }

    private static function coercePositiveInt(mixed $value, int $fallback): int
    {
        $n = self::coercePersistedInt($value);

        if ($n < 1) {
            return max(1, $fallback);
        }

        return $n;
    }

    /**
     * Grid axis from Redis/JSON must stay in a safe int range (avoids huge floats from bad clients).
     */
    private static function coerceGridAxis(mixed $value, int $fallback): int
    {
        if (! is_numeric($value)) {
            return self::clampGridAxisIndex($fallback);
        }

        $f = (float) $value;
        if (! is_finite($f) || $f < 1.0 || $f > (float) self::MAX_PERSISTED_GRID_AXIS) {
            return self::clampGridAxisIndex($fallback);
        }

        if (abs($f - round($f)) > 1.0e-6) {
            return self::clampGridAxisIndex($fallback);
        }

        return self::clampGridAxisIndex((int) round($f));
    }

    private static function clampGridAxisIndex(int $value): int
    {
        if ($value < 1) {
            return 1;
        }

        if ($value > self::MAX_PERSISTED_GRID_AXIS) {
            return self::MAX_PERSISTED_GRID_AXIS;
        }

        return $value;
    }

    private function generateTerrain(): void
    {
        $noise = new PerlinNoise($this->seed, 3);

        for ($y = 0; $y <= $this->gridMaxY; $y++) {
            for ($x = 0; $x <= $this->gridMaxX; $x++) {
                $value = max(0, min(1, ($noise->noise([$x / 25, $y / 25]) - 0.2) + $this->elevationBias($x, $y)));
                $this->terrainMarching->grid[$x][$y] = $value;
            }
        }

        $forestNoise = new PerlinNoise($this->seed + 1, 2);

        for ($y = 0; $y <= $this->gridMaxY; $y++) {
            for ($x = 0; $x <= $this->gridMaxX; $x++) {
                $terrainValue = $this->terrainMarching->grid[$x][$y];
                $value = (min(0.6, $forestNoise->noise([$x / 30, $y / 30]) * 2.0)) + 0.3;
                $plainsDiff = max(0, (GameConstants::TERRAIN_VALUES['plains'] + 0.1) - $terrainValue);
                $hillDiff = max(0, $terrainValue - (GameConstants::TERRAIN_VALUES['hill'] - 0.1));
                $this->forestMarching->grid[$x][$y] = ($value - ($plainsDiff * 10)) - ($hillDiff * 10);
            }
        }

        $tries = 0;
        $distance = GameConstants::CITY_GEN_MIN_SEPARATION;

        while (count($this->cities) < 10) {
            $cx = $this->randomInt(0, $this->gridMaxX);
            $cy = $this->randomInt(0, $this->gridMaxY);
            $terrainValue = $this->terrainMarching->grid[$cx][$cy];

            $validDistance = true;
            foreach ($this->cities as $city) {
                $dist = abs($cx * GameConstants::CELL_SIZE - $city->position[0])
                    + abs($cy * GameConstants::CELL_SIZE - $city->position[1]);
                if ($dist < GameConstants::CELL_SIZE * $distance) {
                    $validDistance = false;
                    break;
                }
            }

            if (
                $terrainValue > GameConstants::TERRAIN_VALUES['plains']
                && $terrainValue < GameConstants::TERRAIN_VALUES['hill']
                && $validDistance
                && $this->withinEdges($cx, $cy)
                && $this->forestMarching->grid[$cx][$cy] < GameConstants::THRESHOLD
            ) {
                $this->cities[] = new City([$cx * GameConstants::CELL_SIZE, $cy * GameConstants::CELL_SIZE], $this->nextCityId++);
                $distance = GameConstants::CITY_GEN_MIN_SEPARATION;
            }

            $tries++;
            if ($tries >= 100) {
                $distance = max(2, $distance - 2);
                $tries = 0;
            }
        }
    }

    private function generateDefaultVision(): void
    {
        $this->rebuildDefaultVisionFromTerrain();
    }

    private function assignPlayers(): void
    {
        $leftBottomCity = $this->minCity(fn (City $c) => $c->position[0] + $c->position[1]);
        $topLeftCity = $this->minCity(fn (City $c) => $c->position[0] - $c->position[1]);
        $middleTopCity = $this->minCity(fn (City $c) => (abs($c->position[0] - ($this->gridMaxX * GameConstants::CELL_SIZE) / 2) * 1.5) + $c->position[1]);
        $middleBottomCity = $this->maxCity(fn (City $c) => $c->position[1] - (abs($c->position[0] - ($this->gridMaxX * GameConstants::CELL_SIZE) / 2) * 1.5));
        $topRightCity = $this->maxCity(fn (City $c) => $c->position[0] - $c->position[1]);
        $rightBottomCity = $this->maxCity(fn (City $c) => $c->position[0] + $c->position[1]);
        $leftCity = $this->minCity(fn (City $c) => $c->position[0]);
        $rightCity = $this->maxCity(fn (City $c) => $c->position[0]);
        $topCity = $this->maxCity(fn (City $c) => $c->position[1]);
        $middleCity = $this->minCity(fn (City $c) => abs($c->position[0] - ($this->gridMaxX * GameConstants::CELL_SIZE) / 2) + abs($c->position[1] - ($this->gridMaxY * GameConstants::CELL_SIZE) / 2));

        $spawnMap = [
            2 => [
                [$leftCity, 0],
                [$rightCity, 1],
            ],
            3 => [
                [$leftBottomCity, 0],
                [$rightBottomCity, 1],
                [$topCity, 2],
            ],
            4 => [
                [$leftBottomCity, 0],
                [$topLeftCity, 1],
                [$topRightCity, 2],
                [$rightBottomCity, 3],
            ],
            5 => [
                [$leftBottomCity, 0],
                [$topLeftCity, 1],
                [$middleCity, 2],
                [$topRightCity, 3],
                [$rightBottomCity, 4],
            ],
            6 => [
                [$leftBottomCity, 0],
                [$topLeftCity, 1],
                [$middleTopCity, 2],
                [$middleBottomCity, 3],
                [$topRightCity, 4],
                [$rightBottomCity, 5],
            ],
        ];

        $spawns = $spawnMap[$this->playerCount] ?? $spawnMap[2];

        foreach ($spawns as [$city, $slot]) {
            $player = new Player($city->position, GameConstants::COLORS[$slot], $slot, $this, $this->nextTroopId++);
            $city->owner = $player;
            $city->markerType = 'capital';
            $this->players[] = $player;
        }

        // All non-capital cities become outposts.
        foreach ($this->cities as $city) {
            if ($city->markerType === null) {
                $city->markerType = 'flag';
            }
        }

        $this->seedInitialBorders();
    }

    /**
     * Applies large brushes once at game creation so each player starts with a
     * well-connected territory blob, with a guaranteed corridor from every unit
     * back to the capital.  Uses much larger radii than the per-tick brushes;
     * these values are persisted in the player border grids and then refined
     * each tick by the normal brushes.
     */
    private function seedInitialBorders(): void
    {
        $troopSeedBrush = new Brush(200, 0.05, 0);
        $citySeedBrush = new Brush(350, 0.05, 0);
        $corridorBrush = new Brush(60, 0.05, 0);

        foreach ($this->players as $player) {
            foreach ($this->cities as $city) {
                if ($city->owner === $player) {
                    $citySeedBrush->apply($player->border, $city->position, 1.0);
                }
            }

            $capital = $player->startPos;

            foreach ($player->troops as $troop) {
                $troopSeedBrush->apply($player->border, $troop->position, 1.0);

                // Stamp corridor brush at intervals along the straight line
                // from this troop back to the capital so territory is connected.
                [$tx, $ty] = $troop->position;
                [$cx, $cy] = $capital;
                $dx = $cx - $tx;
                $dy = $cy - $ty;
                $dist = sqrt($dx ** 2 + $dy ** 2);
                $steps = max(1, (int) ceil($dist / ($corridorBrush->radius * 0.8)));

                for ($i = 0; $i <= $steps; $i++) {
                    $t = $i / $steps;
                    $corridorBrush->apply($player->border, [$tx + $dx * $t, $ty + $dy * $t], 1.0);
                }
            }
        }

        // Push enemy cities down so they don't claim neighbours' seed territory.
        foreach ($this->players as $player) {
            foreach ($this->players as $otherPlayer) {
                if ($otherPlayer === $player) {
                    continue;
                }

                foreach ($this->cities as $city) {
                    if ($city->owner === $otherPlayer) {
                        $citySeedBrush->apply($player->border, $city->position, 0.0);
                    }
                }
            }
        }

        $this->fillEnclosedNeutralCells($troopSeedBrush);
    }

    /**
     * Flood-fills from every map-edge cell to find all neutral cells reachable
     * without crossing any player's territory.  Any neutral cell that is NOT
     * reachable from the edge is fully enclosed by a single player's territory
     * and gets claimed by that player (by stamping the seed brush on it).
     *
     * Only runs at game initialisation so it has no per-tick cost.
     */
    private function fillEnclosedNeutralCells(Brush $claimBrush): void
    {
        $cs = GameConstants::CELL_SIZE;
        $gridW = $this->gridMaxX + 1;
        $gridH = $this->gridMaxY + 1;

        // Build a snapshot of which player (if any) currently has the strongest
        // border influence at each grid cell (same logic as drawInfo territory).
        $owner = [];
        for ($gx = 0; $gx < $gridW; $gx++) {
            $owner[$gx] = [];
            for ($gy = 0; $gy < $gridH; $gy++) {
                $bestSlot = -1;
                $bestInf = GameConstants::TERRITORY_CLAIM_THRESHOLD;
                foreach ($this->players as $p) {
                    $inf = $p->border->grid[$gx][$gy] ?? 0.0;
                    if ($inf > $bestInf) {
                        $bestInf = $inf;
                        $bestSlot = $p->slot;
                    }
                }
                $owner[$gx][$gy] = $bestSlot;
            }
        }

        // BFS from all edge cells — only spreading through neutral (-1) cells.
        $reachable = array_fill(0, $gridW, array_fill(0, $gridH, false));
        $queue = [];

        for ($gx = 0; $gx < $gridW; $gx++) {
            for ($gy = 0; $gy < $gridH; $gy++) {
                if ($gx === 0 || $gx === $gridW - 1 || $gy === 0 || $gy === $gridH - 1) {
                    if ($owner[$gx][$gy] === -1) {
                        $reachable[$gx][$gy] = true;
                        $queue[] = [$gx, $gy];
                    }
                }
            }
        }

        $dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        $head = 0;

        while ($head < count($queue)) {
            [$cx, $cy] = $queue[$head++];
            foreach ($dirs as [$dx, $dy]) {
                $nx = $cx + $dx;
                $ny = $cy + $dy;
                if ($nx < 0 || $nx >= $gridW || $ny < 0 || $ny >= $gridH) {
                    continue;
                }
                if ($reachable[$nx][$ny] || $owner[$nx][$ny] !== -1) {
                    continue;
                }
                $reachable[$nx][$ny] = true;
                $queue[] = [$nx, $ny];
            }
        }

        // Any neutral cell not reached by the flood-fill is enclosed.
        // Find which single player surrounds it (all 4-neighbours owned by same player).
        for ($gx = 0; $gx < $gridW; $gx++) {
            for ($gy = 0; $gy < $gridH; $gy++) {
                if ($owner[$gx][$gy] !== -1 || $reachable[$gx][$gy]) {
                    continue;
                }

                // Collect distinct player slots from the 4 cardinal neighbours.
                $neighbourSlots = [];
                foreach ($dirs as [$dx, $dy]) {
                    $nx = $gx + $dx;
                    $ny = $gy + $dy;
                    if ($nx < 0 || $nx >= $gridW || $ny < 0 || $ny >= $gridH) {
                        continue;
                    }
                    $s = $owner[$nx][$ny];
                    if ($s !== -1) {
                        $neighbourSlots[$s] = true;
                    }
                }

                // Claim only when all bordering owned cells belong to one player.
                if (count($neighbourSlots) === 1) {
                    $slot = array_key_first($neighbourSlots);
                    $player = $this->players[$slot] ?? null;
                    if ($player !== null) {
                        $claimBrush->apply($player->border, [$gx * $cs, $gy * $cs], 1.0);
                    }
                }
            }
        }
    }

    /**
     * @param  callable(City): float  $metric
     */
    private function minCity(callable $metric): City
    {
        $best = $this->cities[0];
        $bestValue = $metric($best);

        foreach ($this->cities as $city) {
            $value = $metric($city);
            if ($value < $bestValue) {
                $best = $city;
                $bestValue = $value;
            }
        }

        return $best;
    }

    /**
     * @param  callable(City): float  $metric
     */
    private function maxCity(callable $metric): City
    {
        $best = $this->cities[0];
        $bestValue = $metric($best);

        foreach ($this->cities as $city) {
            $value = $metric($city);
            if ($value > $bestValue) {
                $best = $city;
                $bestValue = $value;
            }
        }

        return $best;
    }

    private function elevationBias(float $x, float $y): float
    {
        $cx = $this->gridMaxX / 2;
        $cy = $this->gridMaxY / 2;
        $dx = abs($x - $cx);
        $dy = abs($y - $cy);
        $dist = sqrt($dx ** 2 + $dy ** 2);
        $maxDist = sqrt($cx ** 2 + $cy ** 2);

        return 1.0 - ($dist / $maxDist);
    }

    private function withinEdges(int $cx, int $cy): bool
    {
        $edgeMargin = 1;

        return $cx >= $edgeMargin
            && $cx <= $this->gridMaxX - $edgeMargin
            && $cy >= $edgeMargin
            && $cy <= $this->gridMaxY - $edgeMargin;
    }

    private function randomInt(int $min, int $max): int
    {
        if ($max < $min) {
            [$min, $max] = [$max, $min];
        }

        $span = $max - $min + 1;
        if ($span <= 0) {
            return $min;
        }

        // Mask to 31 bits BEFORE multiplying so the product stays within int64 range.
        // Without the pre-mask, a seed larger than ~2^31 (e.g. a Unix-ms timestamp) would
        // overflow to a float and the subsequent bitwise-AND cast would be fatal in PHP 8.1+.
        $this->rngSeed = (($this->rngSeed & 0x7FFFFFFF) * 1103515245 + 12345) & 0x7FFFFFFF;

        return $min + ($this->rngSeed % $span);
    }

    public function getTerrainName(float $value, float $fvalue): string
    {
        if ($fvalue > GameConstants::THRESHOLD) {
            return 'forest';
        }

        foreach (array_reverse(GameConstants::TERRAIN_VALUES, true) as $terrainName => $threshold) {
            if ($value > $threshold) {
                return $terrainName;
            }
        }

        // Below the water threshold: distinguish deep_water from shallow water.
        if ($value <= GameConstants::DEEP_WATER_ELEVATION_THRESHOLD) {
            return 'deep_water';
        }

        return 'water';
    }

    /**
     * @param  array{0: float, 1: float}  $position
     */
    public function terrainNameAtWorldPosition(array $position): string
    {
        $gx = max(0, min($this->gridMaxX, $position[0] / GameConstants::CELL_SIZE));
        $gy = max(0, min($this->gridMaxY, $position[1] / GameConstants::CELL_SIZE));
        $terrain = $this->terrainMarching->getGridValue($gx, $gy);
        $forest = $this->forestMarching->getGridValue($gx, $gy);

        return $this->getTerrainName($terrain, $forest);
    }

    public function takeNextTroopId(): int
    {
        return $this->nextTroopId++;
    }

    /**
     * @return array{
     *     terrain: list<list<float>>,
     *     forest: list<list<float>>,
     *     cityPositions: list<array{0: float, 1: float}>,
     *     world: array{width: int, height: int, cellSize: int}
     * }
     */
    public function getTerrainInfo(): array
    {
        return [
            'terrain' => $this->terrainMarching->grid,
            'forest' => $this->forestMarching->grid,
            'cityPositions' => array_map(fn (City $c) => $c->position, $this->cities),
            'world' => $this->worldPixelSize(),
        ];
    }

    private function troopEffectiveAge(Troop $troop, int $worldTick): int
    {
        if ($troop->spawnedAtWorldTick < 0) {
            return $worldTick;
        }

        return max(0, $worldTick - $troop->spawnedAtWorldTick);
    }

    public function troopWarmupMultiplier(Troop $troop, int $worldTick): float
    {
        $age = $this->troopEffectiveAge($troop, $worldTick);
        if ($age >= GameConstants::TROOP_WARMUP_TICKS) {
            return 1.0;
        }

        $t = 1.0 - ($age / (float) GameConstants::TROOP_WARMUP_TICKS);

        return 1.0 + ($t * (GameConstants::TROOP_WARMUP_ATTACK_PEAK - 1.0));
    }

    /**
     * BFS from every owned city through contiguous own-territory cells.
     * Returns a set of "gx,gy" strings for every grid cell that has an
     * unbroken own-territory path back to at least one owned city (outpost
     * or capital).  Cells not in this set are cut off from supply.
     *
     * Runs once per player per tick; result is used by all that player's troops.
     *
     * @return array<string, true>
     */
    private function buildSuppliedCells(Player $player): array
    {
        $cs = GameConstants::CELL_SIZE;
        $gridW = $this->gridMaxX + 1;
        $gridH = $this->gridMaxY + 1;

        $supplied = [];
        $queue = [];

        // Seed the BFS from every city owned by this player (or a teammate).
        foreach ($this->cities as $city) {
            $cityOwner = $city->owner;

            if ($cityOwner === null) {
                continue;
            }

            $isAlly = $cityOwner === $player
                || ($player->teamIndex > 0 && $cityOwner->teamIndex === $player->teamIndex);

            if (! $isAlly) {
                continue;
            }

            $gx = max(0, min($gridW - 1, (int) ($city->position[0] / $cs)));
            $gy = max(0, min($gridH - 1, (int) ($city->position[1] / $cs)));
            $key = "{$gx},{$gy}";

            if (! isset($supplied[$key])) {
                $supplied[$key] = true;
                $queue[] = [$gx, $gy];
            }
        }

        $dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        $head = 0;

        while ($head < count($queue)) {
            [$cx, $cy] = $queue[$head++];

            foreach ($dirs as [$dx, $dy]) {
                $nx = $cx + $dx;
                $ny = $cy + $dy;

                if ($nx < 0 || $nx >= $gridW || $ny < 0 || $ny >= $gridH) {
                    continue;
                }

                $key = "{$nx},{$ny}";

                if (isset($supplied[$key])) {
                    continue;
                }

                // Only spread through cells owned by this player (or ally).
                $bestInfluence = GameConstants::TERRITORY_CLAIM_THRESHOLD;
                $bestOwner = null;

                foreach ($this->players as $p) {
                    $inf = $p->border->grid[$nx][$ny] ?? 0.0;

                    if ($inf > $bestInfluence) {
                        $bestInfluence = $inf;
                        $bestOwner = $p;
                    }
                }

                if ($bestOwner === null) {
                    continue;
                }

                $isAlly = $bestOwner === $player
                    || ($player->teamIndex > 0 && $bestOwner->teamIndex === $player->teamIndex);

                if (! $isAlly) {
                    continue;
                }

                $supplied[$key] = true;
                $queue[] = [$nx, $ny];
            }
        }

        return $supplied;
    }

    /**
     * Returns true if the troop's grid cell is owned by the given player (or a teammate).
     *
     * Mirrors the territory calculation in drawInfo(): ownership is determined purely
     * by border-brush influence above TERRITORY_CLAIM_THRESHOLD.  Neutral cells (below
     * threshold for all players) are not considered own territory.
     */
    private function isInOwnTerritory(Player $player, array $troopPosition): bool
    {
        $cs = GameConstants::CELL_SIZE;
        $gx = (int) ($troopPosition[0] / $cs);
        $gy = (int) ($troopPosition[1] / $cs);

        $bestInfluence = GameConstants::TERRITORY_CLAIM_THRESHOLD;
        $bestPlayer = null;

        foreach ($this->players as $p) {
            $influence = $p->border->grid[$gx][$gy] ?? 0.0;

            if ($influence > $bestInfluence) {
                $bestInfluence = $influence;
                $bestPlayer = $p;
            }
        }

        if ($bestPlayer === null) {
            return false; // neutral cell - neither own nor enemy territory
        }

        if ($bestPlayer === $player) {
            return true;
        }

        // In team games a troop is safe inside any teammate's territory.
        return $player->teamIndex > 0 && $bestPlayer->teamIndex === $player->teamIndex;
    }

    /**
     * Applies move orders to troop path fields (used by ticks and immediately after HTTP submit).
     *
     * Each order row is a tuple: [entityId, pathPoints, ?waterMode].
     * waterMode is 'wade' or 'embark'; defaults to 'embark' when absent.
     *
     * @param  list<array{0: mixed, 1: mixed, 2?: mixed}>  $pathsToApply
     */
    public function assignTroopPathsFromOrders(array $pathsToApply): void
    {
        if ($pathsToApply === []) {
            return;
        }

        $pairs = [];

        foreach ($pathsToApply as $row) {
            if (! is_array($row) || count($row) < 2 || ! is_array($row[1])) {
                continue;
            }

            $waterMode = isset($row[2]) && $row[2] === 'wade' ? 'wade' : 'embark';
            $pairs[] = [(int) $row[0], $row[1], $waterMode];
        }

        if ($pairs === []) {
            return;
        }

        /** Last row wins when the same entity id appears more than once in one batch. */
        $orderByTroopId = [];
        foreach ($pairs as [$id, $path, $waterMode]) {
            $orderByTroopId[$id] = [$path, $waterMode];
        }

        foreach ($this->players as $player) {
            foreach ($player->troops as $troop) {
                if (array_key_exists($troop->id, $orderByTroopId)) {
                    // Ignore orders during embarkation (converting to ship) or disembarkation (reverting to troop).
                    if (! $troop->isShip && $troop->waterMode === 'embark' && $troop->waterTicks > 0) {
                        continue;
                    }
                    if ($troop->isShip && $troop->landTicks > 0) {
                        continue;
                    }

                    [$path, $waterMode] = $orderByTroopId[$troop->id];
                    $troop->path = $path;
                    $troop->waterMode = $waterMode;
                }
            }
        }
    }

    /**
     * @param  list<array{0: int, 1: list<array{0: float, 1: float}>}>  $pathsToApply
     */
    public function updateTroops(array $pathsToApply, int $worldTick): void
    {
        $this->playersInCities = array_fill(0, count($this->cities), []);

        $this->assignTroopPathsFromOrders($pathsToApply);

        // Merge vision grids between teammates (non-zero teamIndex = team play).
        $this->mergeTeamVision();

        foreach ($this->players as $player) {
            $player->vision->setGrid($this->defaultVision);

            foreach ($this->cities as $city) {
                if ($city->owner === $player) {
                    $this->cityVisionBrush->apply($player->vision, $city->position, 0);
                    $this->cityBorderBrush->apply($player->border, $city->position, 1.0);
                }
            }

            foreach ($this->players as $otherPlayer) {
                if ($otherPlayer === $player) {
                    continue;
                }

                foreach ($this->cities as $city) {
                    if ($city->owner === $otherPlayer) {
                        $this->cityBorderBrush->apply($player->border, $city->position, 0.0);
                    }
                }
            }

            $toRemove = [];

            // Build supply connectivity once per player per tick.
            $suppliedCells = $this->buildSuppliedCells($player);

            foreach ($player->troops as $troop) {
                if ($troop->health <= 0) {
                    $toRemove[] = $troop;

                    continue;
                }

                $oldPos = $troop->position;
                $owned = array_values(array_map(
                    fn (City $city) => $city->position,
                    array_filter($this->cities, fn (City $city) => $city->owner === $player),
                ));

                $inOwnTerritory = $this->isInOwnTerritory($player, $troop->position);

                // A troop is in supply only if its territory cell has an unbroken
                // own-territory path back to at least one owned city.
                $cs = GameConstants::CELL_SIZE;
                $tgx = max(0, min($this->gridMaxX, (int) ($troop->position[0] / $cs)));
                $tgy = max(0, min($this->gridMaxY, (int) ($troop->position[1] / $cs)));
                $inSupply = isset($suppliedCells["{$tgx},{$tgy}"]);

                // Heal when in supply (connected own territory with an owned city).
                // Healing is intentionally deferred until after combat resolution below so that
                // $inCombat can suppress it.
                $shouldHeal = $inSupply && $owned !== [];

                $enemiesInRange = [];

                $gx = $oldPos[0] / GameConstants::CELL_SIZE;
                $gy = $oldPos[1] / GameConstants::CELL_SIZE;
                $terrain = $this->terrainMarching->getGridValue($gx, $gy);
                $forest = $this->forestMarching->getGridValue($gx, $gy);
                $onTerrain = $this->getTerrainName($terrain, $forest);

                $isConverting = (! $troop->isShip && $troop->waterMode === 'embark' && $troop->waterTicks > 0)
                    || ($troop->isShip && $troop->landTicks > 0);

                if (! $isConverting && $troop->path !== []) {
                    $target = $troop->path[0];
                    $isWater = in_array($onTerrain, ['water', 'deep_water', 'river']);
                    if ($troop->isShip && $isWater) {
                        $terrainSpeed = GameConstants::TERRAIN_SPEEDS[$onTerrain] * GameConstants::SHIP_WATER_SPEED_MULT;
                    } elseif ($troop->type === 'tank') {
                        $terrainSpeed = GameConstants::TANK_TERRAIN_SPEEDS[$onTerrain] ?? GameConstants::TERRAIN_SPEEDS[$onTerrain] * 0.6;
                    } else {
                        $terrainSpeed = GameConstants::TERRAIN_SPEEDS[$onTerrain];
                    }
                    [$dir] = GameMath::xyToDirDis([$target[0] - $oldPos[0], $target[1] - $oldPos[1]]);
                    $distance = $terrainSpeed * GameConstants::TROOP_MOVEMENT_PER_TICK_SCALE;
                    [$newOffX, $newOffY] = GameMath::dirDisToXy($dir, $distance);
                    $newPos = [$oldPos[0] + $newOffX, $oldPos[1] + $newOffY];

                    foreach ($player->troops as $otherT) {
                        if ($otherT === $troop) {
                            continue;
                        }
                        [$otherX, $otherY] = $otherT->position;
                        $oldOffX = $newPos[0] - $otherX;
                        $oldOffY = $newPos[1] - $otherY;
                        [$dir, $sepDist] = GameMath::xyToDirDis([$oldOffX, $oldOffY]);
                        if ($sepDist < GameConstants::TROOP_MIN_SEPARATION) {
                            $sepDist = GameConstants::TROOP_MIN_SEPARATION;
                            [$newOffX, $newOffY] = GameMath::dirDisToXy($dir, $sepDist);
                            $changeX = $newOffX - $oldOffX;
                            $changeY = $newOffY - $oldOffY;
                            $newPos = [$newPos[0] + $changeX, $newPos[1] + $changeY];
                        }
                    }

                    [$hitEnemy, $enemiesInRange, $onTerrain, $newPos] = $this->resolveTroopMove($player, $troop, $newPos, $enemiesInRange, $onTerrain);

                    if (! $hitEnemy) {
                        [$dir, $distToTarget] = GameMath::xyToDirDis([$target[0] - $troop->position[0], $target[1] - $troop->position[1]]);
                        if ($distToTarget < ($terrainSpeed * 2)) {
                            array_shift($troop->path);
                        }
                    }
                } else {
                    $newPos = $oldPos;
                    foreach ($player->troops as $otherT) {
                        if ($otherT === $troop) {
                            continue;
                        }
                        [$otherX, $otherY] = $otherT->position;
                        $oldOffX = $newPos[0] - $otherX;
                        $oldOffY = $newPos[1] - $otherY;
                        [$dir, $sepDist] = GameMath::xyToDirDis([$oldOffX, $oldOffY]);
                        if ($sepDist < 15) {
                            $sepDist += 0.025;
                            [$newOffX, $newOffY] = GameMath::dirDisToXy($dir, $sepDist);
                            $changeX = $newOffX - $oldOffX;
                            $changeY = $newOffY - $oldOffY;
                            $newPos = [$newPos[0] + $changeX, $newPos[1] + $changeY];
                        }
                    }

                    [$hitEnemy, $enemiesInRange, $onTerrain, $newPos] = $this->resolveTroopMove($player, $troop, $newPos, $enemiesInRange, $onTerrain);
                }

                if ($enemiesInRange !== []) {
                    $attackTable = $troop->type === 'tank' ? GameConstants::TANK_TERRAIN_ATTACKS : GameConstants::TERRAIN_ATTACKS;
                    $base = (int) (($attackTable[$onTerrain] ?? GameConstants::TERRAIN_ATTACKS[$onTerrain]) / 25);
                    $base = max(1, $base);
                    $warmup = $this->troopWarmupMultiplier($troop, $worldTick);
                    $moraleFac = max(0.25, $troop->morale / 100.0);
                    $attackPower = max(1, (int) round($base * $warmup * $moraleFac));
                    usort($enemiesInRange, fn ($a, $b) => $a[1] <=> $b[1]);
                    $enemiesInRange[0][0]->health -= $attackPower;
                }

                $inCombat = $enemiesInRange !== [];

                // Determine water terrain once (after move resolution updates $onTerrain).
                $isWaterTerrain = in_array($onTerrain, ['water', 'deep_water', 'river']);

                // Morale: supply-line connectivity determines recovery vs drain.
                // A troop must have an unbroken own-territory path to an owned city to be in supply.
                // Supply-cut applies whether the unit is in own territory (isolated blob) or enemy territory.
                if ($inCombat) {
                    $drain = GameConstants::TROOP_MORALE_COMBAT_DRAIN;
                    if (! $inSupply) {
                        $drain += GameConstants::TROOP_SUPPLY_CUT_MORALE_DRAIN;
                    }
                    $troop->morale = (int) round($troop->morale - $drain);
                } elseif ($inSupply) {
                    $troop->morale = (int) round($troop->morale + GameConstants::TROOP_MORALE_REST_GAIN);
                } else {
                    // Cut off from supply: drain morale even without active combat.
                    $troop->morale = (int) round($troop->morale - GameConstants::TROOP_SUPPLY_CUT_MORALE_DRAIN * 0.55);
                }

                $troop->morale = max(GameConstants::TROOP_MORALE_MIN, min(GameConstants::TROOP_MORALE_MAX, $troop->morale));

                // Supply-cut attrition: HP drains when cut off from a city, in addition to morale loss.
                if (! $inSupply) {
                    $troop->health -= GameConstants::TROOP_SUPPLY_CUT_DAMAGE_PER_TICK;
                }

                // Apply healing after combat so we can suppress it while in combat.
                // Ships heal on water; wading troops on water do not (water damage must not be cancelled).
                $isWading = $isWaterTerrain && $troop->waterMode === 'wade';
                if ($shouldHeal && ! $inCombat && ! $isWading && $troop->health < $troop->maxHealth()) {
                    $troop->health = min($troop->maxHealth(), $troop->health + 1);
                }

                // Ship / water conversion logic.
                if ($isWaterTerrain) {
                    // Reset any partial disembark progress when back on water.
                    $troop->landTicks = 0;
                    if ($troop->waterMode === 'wade') {
                        // Wade: troop takes damage each tick but never converts to a ship.
                        $troop->health -= GameConstants::WATER_DAMAGE_PER_TICK;
                    } else {
                        // Embark: accumulate water ticks toward ship conversion.
                        $troop->waterTicks++;
                        if ($troop->waterTicks >= GameConstants::SHIP_CONVERSION_TICKS && ! $troop->isShip) {
                            $troop->isShip = true;
                        }
                        // Embarking troops are protected — no water damage during conversion.
                        // Ships on water never take water damage.
                    }
                } else {
                    if ($troop->isShip) {
                        // Ship is on land: accumulate disembark ticks; revert only after the full duration.
                        $troop->landTicks++;
                        if ($troop->landTicks >= GameConstants::SHIP_DISEMBARK_TICKS) {
                            $troop->waterTicks = 0;
                            $troop->landTicks = 0;
                            $troop->isShip = false;
                        }
                    } elseif ($troop->waterTicks > 0) {
                        $troop->waterTicks = 0;
                        $troop->landTicks = 0;
                    }
                }

                if ($onTerrain === 'hill') {
                    $this->cityVisionBrush->apply($player->vision, $troop->position, 0);
                } else {
                    $this->visionBrush->apply($player->vision, $troop->position, 0);
                }
                $this->borderBrush->apply($player->border, $troop->position, 1.0);

                // Hard-claim the cell the troop is physically standing on so it
                // always shows as own territory regardless of enemy brush strength.
                $tgx = max(0, min($this->gridMaxX, (int) ($troop->position[0] / GameConstants::CELL_SIZE)));
                $tgy = max(0, min($this->gridMaxY, (int) ($troop->position[1] / GameConstants::CELL_SIZE)));
                $player->border->grid[$tgx][$tgy] = 1.0;

                // Suppress all enemy players' border influence on that same cell.
                foreach ($this->players as $otherPlayer) {
                    if ($otherPlayer !== $player) {
                        $otherPlayer->border->grid[$tgx][$tgy] = 0.0;
                    }
                }

                foreach ($this->cities as $i => $city) {
                    [$cx, $cy] = $city->position;
                    [$tx, $ty] = $troop->position;
                    [, $dist] = GameMath::xyToDirDis([$tx - $cx, $ty - $cy]);

                    if ($dist < GameConstants::CITY_CAPTURE_RADIUS) {
                        // Only count each player once per city regardless of how
                        // many troops they have nearby - prevents the player being
                        // listed multiple times which would break the count === 1 check.
                        if (! in_array($player, $this->playersInCities[$i], true)) {
                            $this->playersInCities[$i][] = $player;
                        }
                        break;
                    }
                }
            }

            foreach (array_reverse($toRemove) as $troop) {
                $player->troops = array_values(array_filter(
                    $player->troops,
                    fn (Troop $t) => $t !== $troop,
                ));
            }
        }

        $this->claimEnclosedNeutralCells();
    }

    /**
     * Each tick, find neutral cells fully enclosed by a single player's territory
     * and nudge their border influence toward that player — gradually auto-claiming
     * surrounded pockets.
     *
     * Enemy territory that is connected (via own-territory path) to any owned city
     * is never touched — only genuinely isolated neutral voids are filled.
     *
     * Uses a lightweight per-tick flood-fill; terminates quickly because enclosed
     * pockets are small by definition.
     */
    private function claimEnclosedNeutralCells(): void
    {
        $cs = GameConstants::CELL_SIZE;
        $gridW = $this->gridMaxX + 1;
        $gridH = $this->gridMaxY + 1;

        // Snapshot ownership (same logic as drawInfo territory).
        /** @var array<int, array<int, int>> $ownerGrid */
        $ownerGrid = [];

        for ($gx = 0; $gx < $gridW; $gx++) {
            $ownerGrid[$gx] = [];

            for ($gy = 0; $gy < $gridH; $gy++) {
                $bestSlot = -1;
                $bestInf = GameConstants::TERRITORY_CLAIM_THRESHOLD;

                foreach ($this->players as $p) {
                    $inf = $p->border->grid[$gx][$gy] ?? 0.0;

                    if ($inf > $bestInf) {
                        $bestInf = $inf;
                        $bestSlot = $p->slot;
                    }
                }

                $ownerGrid[$gx][$gy] = $bestSlot;
            }
        }

        // BFS from every edge cell through neutral cells → reachable from outside.
        /** @var array<int, array<int, bool>> $reachable */
        $reachable = array_fill(0, $gridW, array_fill(0, $gridH, false));
        $queue = [];

        for ($gx = 0; $gx < $gridW; $gx++) {
            for ($gy = 0; $gy < $gridH; $gy++) {
                if (($gx === 0 || $gx === $gridW - 1 || $gy === 0 || $gy === $gridH - 1)
                    && $ownerGrid[$gx][$gy] === -1) {
                    $reachable[$gx][$gy] = true;
                    $queue[] = [$gx, $gy];
                }
            }
        }

        $dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        $head = 0;

        while ($head < count($queue)) {
            [$cx, $cy] = $queue[$head++];

            foreach ($dirs as [$dx, $dy]) {
                $nx = $cx + $dx;
                $ny = $cy + $dy;

                if ($nx < 0 || $nx >= $gridW || $ny < 0 || $ny >= $gridH) {
                    continue;
                }

                if ($reachable[$nx][$ny] || $ownerGrid[$nx][$ny] !== -1) {
                    continue;
                }

                $reachable[$nx][$ny] = true;
                $queue[] = [$nx, $ny];
            }
        }

        // For each unreachable neutral cell, find if exactly one player surrounds it.
        // Apply a tiny nudge toward that player — they claim it gradually over ticks.
        $nudge = 0.004; // small per-tick nudge; full claim takes ~100 ticks

        for ($gx = 0; $gx < $gridW; $gx++) {
            for ($gy = 0; $gy < $gridH; $gy++) {
                if ($ownerGrid[$gx][$gy] !== -1 || $reachable[$gx][$gy]) {
                    continue;
                }

                // Collect distinct owning slots from all 4 neighbours.
                $neighbourSlots = [];

                foreach ($dirs as [$dx, $dy]) {
                    $nx = $gx + $dx;
                    $ny = $gy + $dy;

                    if ($nx < 0 || $nx >= $gridW || $ny < 0 || $ny >= $gridH) {
                        continue;
                    }

                    $s = $ownerGrid[$nx][$ny];

                    if ($s >= 0) {
                        $neighbourSlots[$s] = true;
                    }
                }

                if (count($neighbourSlots) !== 1) {
                    continue; // contested or no owned neighbours — leave neutral
                }

                $slot = array_key_first($neighbourSlots);
                $player = $this->players[$slot] ?? null;

                if ($player === null) {
                    continue;
                }

                $old = $player->border->grid[$gx][$gy] ?? 0.0;
                $player->border->grid[$gx][$gy] = min(1.0, $old + $nudge);
            }
        }
    }

    /**
     * @param  list<array{0: Troop, 1: float}>  $enemiesInRange
     * @return array{0: bool, 1: list<array{0: Troop, 1: float}>, 2: string, 3: array{0: float, 1: float}}
     */
    private function resolveTroopMove(Player $player, Troop $troop, array $newPos, array $enemiesInRange, string $onTerrain): array
    {
        $hitEnemy = false;

        foreach ($this->players as $otherPlayer) {
            if ($otherPlayer === $player) {
                continue;
            }

            $this->borderBrush->apply($otherPlayer->border, $troop->position, 0.0);

            foreach ($otherPlayer->troops as $otherT) {
                [$otherX, $otherY] = $otherT->position;
                [$offX, $offY] = [$newPos[0] - $otherX, $newPos[1] - $otherY];
                [, $distance] = GameMath::xyToDirDis([$offX, $offY]);
                if ($distance < GameConstants::TROOP_HIT_RANGE) {
                    $hitEnemy = true;
                }
                if ($distance < GameConstants::TROOP_COMBAT_RANGE) {
                    $enemiesInRange[] = [$otherT, $distance];
                }
            }
        }

        $gx = $newPos[0] / GameConstants::CELL_SIZE;
        $gy = $newPos[1] / GameConstants::CELL_SIZE;
        $terrain = $this->terrainMarching->getGridValue($gx, $gy);
        $forest = $this->forestMarching->getGridValue($gx, $gy);
        $newTerrain = $this->getTerrainName($terrain, $forest);

        $worldW = ($this->gridMaxX + 1) * GameConstants::CELL_SIZE;
        $worldH = ($this->gridMaxY + 1) * GameConstants::CELL_SIZE;

        $outOfWorld = $newPos[0] > $worldW
            || $newPos[0] < 0
            || $newPos[1] > $worldH
            || $newPos[1] < 0;

        $blockedForWade = $troop->waterMode === 'wade' && $newTerrain === 'deep_water';
        if ($newTerrain !== 'mountain' && ! $hitEnemy && ! $outOfWorld && ! $blockedForWade) {
            $troop->position = $newPos;
            $onTerrain = $newTerrain;
        }

        return [$hitEnemy, $enemiesInRange, $onTerrain, $newPos];
    }

    /**
     * Processes city capture and auto-spawning for the current tick.
     *
     * Spawn conditions per city:
     *   - City is owned and recruitment is enabled
     *   - No troop of any player is standing at the city (checked via playersInCities)
     *   - Player's productionSpeedMultiplier > 0
     *   - City timer has reached the speed-adjusted threshold
     *   - Player has enough credits to pay the spawn cost
     *
     * New troops spawn at the city position with TROOP_SPAWN_HEALTH_FRACTION × maxHealth.
     * The spawn cost is deducted from the economy atomically inside this method.
     *
     * @param  array<int, array<string, mixed>>  $economy  Live economy state, modified in place.
     */
    public function updateCities(int $worldTick, array &$economy): void
    {
        foreach ($this->cities as $i => $city) {
            [$cx, $cy] = $city->position;
            $lastOwner = $city->owner;

            if (count($this->playersInCities[$i] ?? []) === 1) {
                $city->owner = $this->playersInCities[$i][0];
            }

            if ($lastOwner !== $city->owner) {
                $city->timer = 0;
            }

            if ($city->owner === null || ! $city->recruitmentEnabled) {
                continue;
            }

            $player = $city->owner;
            $slot = $player->slot;
            $speed = $player->productionSpeedMultiplier;

            if ($speed <= 0.0) {
                continue;
            }

            $city->timer++;

            // Spawn threshold: at speed=1.0 ≈ 1350 ticks (45 s); at speed=3.0 ≈ 50 ticks (~1.7 s).
            $adjustedThreshold = max(1, (int) round(1350.0 / ($speed * $speed * $speed)));

            if ($city->timer < $adjustedThreshold) {
                continue;
            }

            // Block spawn if any player already has troops at this city.
            if ($this->playersInCities[$i] !== []) {
                continue;
            }

            // Determine unit type from the player's global tank ratio.
            $spawnCost = GameConstants::ECONOMY_RECRUIT_COST;
            $unitType = 'infantry';
            if ($player->productionTankRatio > 0) {
                $roll = $this->randomInt(0, 100);
                if ($roll <= $player->productionTankRatio) {
                    $unitType = 'tank';
                    $spawnCost = GameConstants::ECONOMY_RECRUIT_COST_TANK;
                }
            }

            // Check affordability.
            $credits = (int) ($economy[$slot]['credits'] ?? 0);
            if ($credits < $spawnCost) {
                continue;
            }

            // Spawn at the city position with reduced starting health.
            $newTroop = $player->spawnTroop([$cx, $cy], [], $this->nextTroopId++, $worldTick, $unitType);
            $newTroop->health = max(1, (int) round($newTroop->maxHealth() * GameConstants::TROOP_SPAWN_HEALTH_FRACTION));

            $economy[$slot]['credits'] = $credits - $spawnCost;
            $city->timer = 0;
        }
    }

    /**
     * Applies proportional HP drain to all troops owned by a given player slot.
     * Used by the economy tick to penalise players that have gone into debt.
     */
    public function applyDebtDamage(int $slot, int $hpDrain): void
    {
        $player = $this->players[$slot] ?? null;

        if ($player === null || $hpDrain <= 0 || $player->troops === []) {
            return;
        }

        // Sort tanks first (most expensive), then newest (highest id) within each type.
        $sorted = $player->troops;
        usort($sorted, function (Troop $a, Troop $b): int {
            if ($a->type !== $b->type) {
                return $a->type === 'tank' ? -1 : 1;
            }

            return $b->id - $a->id;
        });

        foreach ($sorted as $troop) {
            $troop->health -= $hpDrain;
        }
    }

    /**
     * Rebuild every player's vision grid from the current troop positions and owned cities.
     *
     * Vision is not persisted to Redis (it is stripped in Player::toArray()) because it is always
     * reset and recomputed at the start of each tick's updateTroops() call.  This method provides
     * the same result without running a full tick, so that drawInfo() - used by snapshot and
     * broadcast endpoints that run between ticks - produces correct fog-of-war data.
     */
    public function recomputeVision(): void
    {
        foreach ($this->players as $player) {
            $player->vision->setGrid($this->defaultVision);

            foreach ($this->cities as $city) {
                if ($city->owner === $player) {
                    $this->cityVisionBrush->apply($player->vision, $city->position, 0);
                }
            }

            foreach ($player->troops as $troop) {
                $terrain = $this->terrainNameAtWorldPosition($troop->position);
                if ($terrain === 'hill') {
                    $this->cityVisionBrush->apply($player->vision, $troop->position, 0);
                } else {
                    $this->visionBrush->apply($player->vision, $troop->position, 0);
                }
            }
        }

        $this->mergeTeamVision();
    }

    /**
     * @return array{
     *     vision: list<list<float>>,
     *     border: list<list<float>>,
     *     troops: list<array<string, mixed>>,
     *     cities: list<array<string, mixed>>
     * }
     */
    public function drawInfo(int $playerSlot, int $worldTick = 0): array
    {
        $player = $this->players[$playerSlot];
        $troops = [];

        foreach ($this->players as $otherPlayer) {
            foreach ($otherPlayer->troops as $troop) {
                $gx = max(0, min($this->gridMaxX, $troop->position[0] / GameConstants::CELL_SIZE));
                $gy = max(0, min($this->gridMaxY, $troop->position[1] / GameConstants::CELL_SIZE));

                $lit = $player->vision->getGridValue($gx, $gy) < GameConstants::THRESHOLD;
                /** Always return your own army - vision sampling can sit above {@see GameConstants::THRESHOLD} where brushes pull toward 0. */
                $isOwnTroop = $troop->owner->slot === $playerSlot;
                /** Allied troops (same non-zero team) are always visible. */
                $isAlly = $player->teamIndex > 0 && $troop->owner->teamIndex === $player->teamIndex;

                if ($isOwnTroop || $isAlly || $lit) {
                    $warmup = $this->troopWarmupMultiplier($troop, $worldTick);
                    $moraleFac = max(0.25, $troop->morale / 100.0);
                    $troops[] = [
                        'position' => $troop->position,
                        'color' => $troop->owner->color,
                        'id' => $troop->id,
                        'ownerSlot' => $troop->owner->slot,
                        'path' => $troop->path,
                        'health' => $troop->health,
                        'morale' => $troop->morale,
                        'type' => $troop->type,
                        'maxHealth' => $troop->maxHealth(),
                        'isShip' => $troop->isShip,
                        'waterMode' => $troop->waterMode,
                        'waterTicks' => $troop->waterTicks,
                        'landTicks' => $troop->landTicks,
                        'warmupMultiplier' => round($warmup, 3),
                        'combatMultiplier' => round($warmup * $moraleFac, 3),
                    ];
                }
            }
        }

        $cities = array_map(function (City $city) {
            return [
                'ownerColor' => $city->owner?->color,
                'position' => $city->position,
                'id' => $city->id,
                'ownerSlot' => $city->owner?->slot,
                'markerType' => $city->markerType,
                'recruitmentEnabled' => $city->recruitmentEnabled,
            ];
        }, $this->cities);

        // Compute compact territory ownership grid: each cell holds the slot of the
        // player with the strongest border influence (−1 = neutral / contested).
        $gridW = $this->gridMaxX + 1;
        $gridH = $this->gridMaxY + 1;
        // Territory is computed with two combined signals:
        //
        // 1. Border-brush influence (0–1): reflects actual zone-of-control near
        //    each player's troops, capitals, and outposts.  The brush radius is
        //    small (40–80 px), so this only affects cells within a few tiles of
        //    a unit - it shifts the frontier line closer to the enemy.
        //
        // 2. Voronoi proximity to the player's nearest anchor (owned city or
        //    start position).  This divides the whole map even in areas where no
        //    unit has yet reached, giving every cell an owner from tick one.
        // Territory is determined purely by border-brush influence.
        //
        // Each cell is owned by whichever player has the highest brush influence
        // at that cell, provided it exceeds TERRITORY_CLAIM_THRESHOLD.  Cells
        // where no player reaches the threshold are neutral (slot = -1) and
        // render without fills or border lines.  This produces War-of-Dots-style
        // blobs that form around troops and cities rather than a static Voronoi
        // split across the whole map.

        $territory = [];

        for ($gx = 0; $gx < $gridW; $gx++) {
            $col = [];

            for ($gy = 0; $gy < $gridH; $gy++) {
                $bestSlot = -1;
                $bestInfluence = GameConstants::TERRITORY_CLAIM_THRESHOLD;

                foreach ($this->players as $p) {
                    $influence = $p->border->grid[$gx][$gy] ?? 0.0;

                    if ($influence > $bestInfluence) {
                        $bestInfluence = $influence;
                        $bestSlot = $p->slot;
                    }
                }

                $col[] = $bestSlot;
            }
            $territory[] = $col;
        }

        $playerColors = [];
        foreach ($this->players as $p) {
            $playerColors[$p->slot] = $p->color;
        }

        return [
            'vision' => $player->vision->grid,
            'territory' => $territory,
            'playerColors' => $playerColors,
            'troops' => $troops,
            'cities' => $cities,
        ];
    }

    /**
     * Merges vision grids between players on the same team (teamIndex > 0).
     * After individual vision brushes are applied, each player sees through their teammates' eyes.
     */
    private function mergeTeamVision(): void
    {
        // Build teams: group players by non-zero teamIndex.
        $teams = [];
        foreach ($this->players as $player) {
            if ($player->teamIndex > 0) {
                $teams[$player->teamIndex][] = $player;
            }
        }

        foreach ($teams as $members) {
            if (count($members) < 2) {
                continue;
            }

            // Collect all grids for the team and OR (max) them together.
            $rows = count($members[0]->vision->grid);
            $cols = $rows > 0 ? count($members[0]->vision->grid[0]) : 0;
            $merged = array_fill(0, $rows, array_fill(0, $cols, 0.0));

            foreach ($members as $player) {
                foreach ($player->vision->grid as $r => $row) {
                    foreach ($row as $c => $val) {
                        if ($val > $merged[$r][$c]) {
                            $merged[$r][$c] = $val;
                        }
                    }
                }
            }

            foreach ($members as $player) {
                $player->vision->setGrid($merged);
            }
        }
    }

    public function winnerSlot(): ?int
    {
        $totalCities = count($this->cities);
        if ($totalCities === 0) {
            return null;
        }

        $threshold = (int) ceil($totalCities * GameConstants::VICTORY_CITY_THRESHOLD);

        // Check for team-based win condition when any player has a non-zero teamIndex.
        $hasTeams = array_any($this->players, fn (Player $p) => $p->teamIndex > 0);

        if ($hasTeams) {
            return $this->winnerSlotTeamMode($threshold);
        }

        foreach ($this->players as $candidate) {
            // All enemy capitals must be captured.
            $unconqueredEnemyCapitals = array_filter(
                $this->cities,
                fn (City $c) => $c->markerType === 'capital' && $c->owner !== $candidate,
            );

            if ($unconqueredEnemyCapitals !== []) {
                continue;
            }

            // Must also own at least VICTORY_CITY_THRESHOLD of all cities.
            $owned = count(array_filter($this->cities, fn (City $c) => $c->owner === $candidate));
            if ($owned >= $threshold) {
                return $candidate->slot;
            }
        }

        return null;
    }

    private function winnerSlotTeamMode(int $threshold): ?int
    {
        // Group players by teamIndex.
        $teams = [];
        foreach ($this->players as $player) {
            $ti = $player->teamIndex;
            $teams[$ti][] = $player;
        }

        foreach ($teams as $members) {
            // Collect all cities owned by any member of this team.
            $memberSet = array_flip(array_map(fn (Player $p) => spl_object_id($p), $members));
            $teamCities = array_filter($this->cities, fn (City $c) => $c->owner !== null && isset($memberSet[spl_object_id($c->owner)]));

            // Check if all enemies have no troops or cities.
            $teamHasWon = true;
            foreach ($this->players as $other) {
                if (isset($memberSet[spl_object_id($other)])) {
                    continue;
                }
                $enemyCities = array_filter($this->cities, fn (City $c) => $c->owner === $other);
                if ($other->troops !== [] || $enemyCities !== []) {
                    $teamHasWon = false;
                    break;
                }
            }

            if ($teamHasWon && count($teamCities) >= $threshold) {
                // Return the lowest slot of the winning team.
                $slots = array_map(fn (Player $p) => $p->slot, $members);
                sort($slots);

                return $slots[0];
            }
        }

        return null;
    }
}
