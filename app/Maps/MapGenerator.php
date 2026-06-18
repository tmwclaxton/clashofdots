<?php

namespace App\Maps;

use Illuminate\Support\Facades\Process;
use RuntimeException;

/**
 * Generates map data by running the frontend procedural engine via Node.js.
 *
 * @phpstan-type MapGenerationType 'mix'|'islands'|'desert'|'mountains'|'jungle'|'volcanic'|'tundra'|'grassland'
 */
class MapGenerator
{
    /** @var list<string> */
    private const BIOME_TYPES = [
        'mix', 'islands', 'desert', 'mountains',
        'jungle', 'volcanic', 'tundra', 'grassland',
    ];

    private const SCRIPT_PATH = 'bootstrap/generate-map-data.cjs';

    /**
     * Generate a map with a random biome and the given team count.
     *
     * @return array<string, mixed>
     */
    public function random(int $teamCount = 2): array
    {
        $type = self::BIOME_TYPES[array_rand(self::BIOME_TYPES)];

        return $this->generate($type, $teamCount);
    }

    /**
     * Generate a map with a specific biome type.
     *
     * @return array<string, mixed>
     *
     * @throws RuntimeException
     */
    public function generate(string $type, int $teamCount = 2): array
    {
        $base = base_path();
        $script = $base.'/'.self::SCRIPT_PATH;

        $result = Process::path($base)
            ->run(['node', $script, $type, (string) $teamCount]);

        $output = trim($result->output());

        if ($output === '') {
            throw new RuntimeException('Map generator produced no output. Error: '.$result->errorOutput());
        }

        /** @var array<string, mixed>|null $data */
        $data = json_decode($output, true);

        if (! is_array($data)) {
            throw new RuntimeException('Map generator returned invalid JSON: '.substr($output, 0, 200));
        }

        return $data;
    }
}
