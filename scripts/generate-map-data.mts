/**
 * Generates a single map using the same procedural engine as the frontend.
 * Reads options from argv or env, writes the resulting map data JSON to stdout.
 *
 * Usage:
 *   npx vite-node --config vite.config.ts scripts/generate-map-data.mts [type] [teamCount]
 *
 * Arguments (all optional):
 *   type       - MapGenerationType: mix|islands|desert|mountains|jungle|volcanic|tundra|grassland
 *   teamCount  - integer 2–6
 */
import { generateRandomMap, MAP_GENERATION_TYPE_OPTIONS } from '@/lib/generateRandomMap';
import type { MapGenerationType } from '@/lib/generateRandomMap';

const VALID_TYPES = MAP_GENERATION_TYPE_OPTIONS.map((o) => o.id) as MapGenerationType[];

function randomItem<T>(arr: readonly T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]!;
}

const rawType = process.argv[2];
const type: MapGenerationType = VALID_TYPES.includes(rawType as MapGenerationType)
    ? (rawType as MapGenerationType)
    : randomItem(VALID_TYPES);

const rawTeamCount = parseInt(process.argv[3] ?? '', 10);
const teamCount = Number.isFinite(rawTeamCount) && rawTeamCount >= 2 && rawTeamCount <= 6
    ? rawTeamCount
    : Math.random() < 0.5 ? 2 : 3;

const data = generateRandomMap({ type, teamCount });

process.stdout.write(JSON.stringify(data));
