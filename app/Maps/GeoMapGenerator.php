<?php

namespace App\Maps;

use Illuminate\Support\Facades\Process;
use RuntimeException;

/**
 * Generates real-world geography map data by running the TypeScript geo-map
 * engine via the bundled Node.js script.
 *
 * @phpstan-type GeoMapType 'europe'|'north_america'|'world'
 */
class GeoMapGenerator
{
    /** @var array<GeoMapType, string> */
    public const TYPES = [
        'europe' => 'Europe',
        'north_america' => 'North America',
        'world' => 'The World',
    ];

    private const SCRIPT_PATH = 'bootstrap/generate-geo-map.cjs';

    /** @var array<GeoMapType, int> */
    private const DEFAULT_TEAM_COUNTS = [
        'europe' => 4,
        'north_america' => 3,
        'world' => 6,
    ];

    /**
     * Generate a geo map for the given type.
     *
     * @param  'europe'|'north_america'|'world'  $type
     * @param  int|null  $teamCount  Overrides the default team count for the map type.
     * @return array<string, mixed>
     *
     * @throws RuntimeException
     */
    public function generate(string $type, ?int $teamCount = null): array
    {
        $base = base_path();
        $script = $base.'/'.self::SCRIPT_PATH;
        $teams = $teamCount ?? self::DEFAULT_TEAM_COUNTS[$type] ?? 2;

        $result = Process::path($base)
            ->run(['node', $script, $type, (string) $teams]);

        $output = trim($result->output());

        if ($output === '') {
            throw new RuntimeException(
                "Geo map generator produced no output for type '{$type}'. Error: ".$result->errorOutput(),
            );
        }

        /** @var array<string, mixed>|null $data */
        $data = json_decode($output, true);

        if (! is_array($data)) {
            throw new RuntimeException(
                'Geo map generator returned invalid JSON: '.substr($output, 0, 200),
            );
        }

        return $data;
    }

    /**
     * Whether a given type identifier is valid.
     */
    public static function isValidType(string $type): bool
    {
        return array_key_exists($type, self::TYPES);
    }
}
