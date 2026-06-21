/**
 * Generates a real-world geography map using Natural Earth 110m land data.
 * Outputs the same MapDataPayload JSON format as generate-map-data.mts.
 *
 * Usage:
 *   npx vite-node --config vite.config.ts scripts/generate-geo-map.mts [type] [teamCount]
 *
 * Arguments:
 *   type       - GeoMapType: europe | north_america | world
 *   teamCount  - integer 2–6 (optional, defaults per map type)
 */
import { buildMarkersForGeneratedTerrain } from '@/lib/generateMapMarkers';
import { buildTroopMarkersForGeneratedMap } from '@/lib/generateTroopSpawns';
import { DEFAULT_MAP_CELL_COLS, DEFAULT_MAP_CELL_ROWS, defaultTeamPaletteSlots } from '@/lib/mapEditorGrid';
import type { TerrainId } from '@/lib/terrainCatalog';
import landGeoJson from '../resources/geo/ne_110m_land.json';

export type GeoMapType = 'europe' | 'north_america' | 'world';

export const GEO_MAP_TYPES: readonly GeoMapType[] = ['europe', 'north_america', 'world'] as const;

export const GEO_MAP_LABELS: Record<GeoMapType, string> = {
    europe: 'Europe',
    north_america: 'North America',
    world: 'The World',
};

/** Default team counts per map type. */
const DEFAULT_TEAM_COUNTS: Record<GeoMapType, number> = {
    europe: 4,
    north_america: 3,
    world: 6,
};

type BBox = { west: number; east: number; south: number; north: number };

const BBOXES: Record<GeoMapType, BBox> = {
    europe: { west: -25, east: 45, south: 34, north: 72 },
    north_america: { west: -170, east: -50, south: 14, north: 84 },
    world: { west: -180, east: 180, south: -60, north: 80 },
};

// ─── Point-in-polygon ────────────────────────────────────────────────────────

type Ring = number[][];

/** Ray-casting point-in-polygon test for a single ring. */
function pointInRing(lon: number, lat: number, ring: Ring): boolean {
    let inside = false;
    const n = ring.length;

    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = ring[i]![0]!;
        const yi = ring[i]![1]!;
        const xj = ring[j]![0]!;
        const yj = ring[j]![1]!;

        if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
            inside = !inside;
        }
    }

    return inside;
}

/** Test a point against a GeoJSON polygon (first ring = exterior, rest = holes). */
function pointInPolygon(lon: number, lat: number, rings: Ring[]): boolean {
    if (rings.length === 0 || !pointInRing(lon, lat, rings[0]!)) {
        return false;
    }

    for (let i = 1; i < rings.length; i++) {
        if (pointInRing(lon, lat, rings[i]!)) {
            return false;
        }
    }

    return true;
}

type LandPolygon = Ring[];

/** Pre-extract all polygon ring sets from the land GeoJSON. */
function extractPolygons(geojson: { features: Array<{ geometry: { type: string; coordinates: unknown } }> }): LandPolygon[] {
    const result: LandPolygon[] = [];

    for (const feature of geojson.features) {
        const geom = feature.geometry;

        if (geom.type === 'Polygon') {
            result.push(geom.coordinates as Ring[]);
        } else if (geom.type === 'MultiPolygon') {
            for (const poly of geom.coordinates as Ring[][]) {
                result.push(poly);
            }
        }
    }

    return result;
}

function isLandPoint(lon: number, lat: number, polygons: LandPolygon[]): boolean {
    for (const rings of polygons) {
        if (pointInPolygon(lon, lat, rings)) {
            return true;
        }
    }

    return false;
}

// ─── Terrain classification ───────────────────────────────────────────────────

type BiomeBox = { west: number; east: number; south: number; north: number };

function inBox(lon: number, lat: number, box: BiomeBox): boolean {
    return lon >= box.west && lon <= box.east && lat >= box.south && lat <= box.north;
}

function inAnyBox(lon: number, lat: number, boxes: readonly BiomeBox[]): boolean {
    return boxes.some((b) => inBox(lon, lat, b));
}

/** Well-known mountain ranges as approximate bounding boxes. */
const MOUNTAIN_RANGES: readonly BiomeBox[] = [
    { west: 5, east: 16, south: 44, north: 48 }, // Alps
    { west: -3, east: 4, south: 42, north: 44.5 }, // Pyrenees
    { west: 5, east: 20, south: 57, north: 72 }, // Scandinavian Mountains
    { west: 17, east: 28, south: 44, north: 50 }, // Carpathians
    { west: 38, east: 50, south: 40, north: 44 }, // Caucasus
    { west: 57, east: 68, south: 48, north: 70 }, // Urals
    { west: -7, east: 11, south: 30, north: 37 }, // Atlas
    { west: 33, east: 42, south: 5, north: 15 }, // Ethiopian Highlands
    { west: 25, east: 33, south: -32, north: -25 }, // Drakensberg
    { west: 70, east: 106, south: 27, north: 40 }, // Himalayas / Hindu Kush
    { west: 75, east: 105, south: 27, north: 43 }, // Tibetan Plateau
    { west: 128, east: 146, south: 31, north: 46 }, // Japanese Alps
    { west: -125, east: -103, south: 35, north: 64 }, // Rocky Mountains
    { west: -84, east: -68, south: 33, north: 48 }, // Appalachians
    { west: -122, east: -116, south: 36, north: 40 }, // Sierra Nevada
    { west: -125, east: -119, south: 42, north: 49 }, // Cascades
    { west: -80, east: -64, south: -56, north: 12 }, // Andes
    { west: -160, east: -140, south: 60, north: 66 }, // Alaska Range
    { west: 85, east: 100, south: 45, north: 56 }, // Altai / Sayan
    { west: 38, east: 52, south: 28, north: 38 }, // Zagros (Iran)
    { west: 33, east: 40, south: 36, north: 42 }, // Taurus (Turkey)
    { west: 95, east: 108, south: 27, north: 36 }, // Yunnan / Guizhou Plateau
];

/** Major desert regions. */
const DESERT_REGIONS: readonly BiomeBox[] = [
    { west: -17, east: 42, south: 15, north: 32 }, // Sahara
    { west: 36, east: 63, south: 12, north: 31 }, // Arabian
    { west: 10, east: 21, south: -29, north: -17 }, // Namib
    { west: 19, east: 29, south: -30, north: -19 }, // Kalahari
    { west: 47, east: 63, south: 24, north: 38 }, // Iranian Plateau
    { west: 68, east: 79, south: 23, north: 32 }, // Thar / Indian Desert
    { west: 87, east: 125, south: 37, north: 50 }, // Gobi
    { west: 113, east: 151, south: -35, north: -17 }, // Australian Outback
    { west: -72, east: -60, south: -53, north: -40 }, // Patagonian
    { west: -76, east: -67, south: -31, north: -15 }, // Atacama
    { west: -120, east: -107, south: 36, north: 47 }, // Great Basin
    { west: -118, east: -113, south: 34, north: 37 }, // Mojave
    { west: -116, east: -107, south: 26, north: 34 }, // Sonoran
    { west: -107, east: -98, south: 24, north: 32 }, // Chihuahuan
];

/** Dense tropical and temperate forest zones. */
const FOREST_REGIONS: readonly BiomeBox[] = [
    { west: -80, east: -44, south: -20, north: 9 }, // Amazon
    { west: -92, east: -76, south: 7, north: 20 }, // Central America
    { west: 8, east: 32, south: -5, north: 5 }, // Congo basin
    { west: 95, east: 155, south: -10, north: 25 }, // SE Asia / Indonesia
    { west: 73, east: 78, south: 8, north: 23 }, // Western Ghats
    { west: 112, east: 155, south: -38, north: -20 }, // Eastern Australia forest
    { west: -88, east: -57, south: -32, north: -12 }, // Cerrado / Mata Atlântica
];

/** Tundra / arctic snow land regions beyond the 70° latitude cut-off. */
const TUNDRA_REGIONS: readonly BiomeBox[] = [
    { west: -55, east: -17, south: 60, north: 84 }, // Greenland
    { west: -80, east: 180, south: 65, north: 84 }, // Siberia / Arctic coast
    { west: -170, east: -130, south: 60, north: 84 }, // Alaska / Yukon
];

/**
 * Deterministic per-cell hash in [0, 1).
 * Used to add variation within terrain zones without relying on Math.random().
 */
function cellHash(row: number, col: number): number {
    let h = (row * 1000 + col) | 0;
    h = (Math.imul(h ^ (h >>> 16), 0x45d9f3b)) | 0;
    h = (Math.imul(h ^ (h >>> 16), 0x45d9f3b)) | 0;
    h = h ^ (h >>> 16);

    return (h >>> 0) / 4294967296;
}

function classifyLandTerrain(lon: number, lat: number, row: number, col: number): TerrainId {
    const v = cellHash(row, col);

    // Polar extremes
    if (lat > 70 || lat < -55) {
        return 'snow';
    }

    // Named tundra/arctic regions
    if (inAnyBox(lon, lat, TUNDRA_REGIONS)) {
        return v < 0.7 ? 'snow' : 'plains';
    }

    // Mountain ranges — mix of mountain, hill, plains for natural variation
    if (inAnyBox(lon, lat, MOUNTAIN_RANGES)) {
        return v < 0.5 ? 'mountain' : v < 0.8 ? 'hill' : 'plains';
    }

    // Desert regions
    if (inAnyBox(lon, lat, DESERT_REGIONS)) {
        return v < 0.65 ? 'desert' : v < 0.85 ? 'plains' : 'hill';
    }

    // Tropical / subtropical forest
    if (inAnyBox(lon, lat, FOREST_REGIONS)) {
        return v < 0.5 ? 'forest' : v < 0.75 ? 'dense_forest' : 'plains';
    }

    // Boreal taiga band
    if (lat > 52 && lat < 70) {
        return v < 0.45 ? 'forest' : v < 0.6 ? 'plains' : 'hill';
    }

    // Temperate deciduous band
    if (lat > 40 && lat < 56) {
        return v < 0.25 ? 'forest' : v < 0.35 ? 'hill' : 'plains';
    }

    // Mediterranean / sub-tropical
    if (lat > 28 && lat < 42) {
        return v < 0.15 ? 'forest' : v < 0.25 ? 'hill' : 'plains';
    }

    // Default
    return v < 0.25 ? 'meadow' : 'plains';
}

// ─── Coastal post-processing ─────────────────────────────────────────────────

const ORTHO_DIRS: ReadonlyArray<readonly [number, number]> = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
];

/**
 * Two-pass coastal layering:
 *  1. deep_water cells adjacent to non-water land → 'water' (shallow)
 *  2. Then expand one more ring → 'water'
 *  3. Non-mountain land cells adjacent to water → 'beach'
 */
function applyCoastalLayers(cells: TerrainId[][], rows: number, cols: number): void {
    // Pass 1 & 2: create two rings of shallow water around land
    for (let pass = 0; pass < 2; pass++) {
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (cells[r]![c] !== 'deep_water') {
                    continue;
                }

                for (const [dr, dc] of ORTHO_DIRS) {
                    const nr = r + dr;
                    const nc = c + dc;

                    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {
                        continue;
                    }

                    const n = cells[nr]![nc]!;

                    if (n !== 'deep_water' && n !== 'water') {
                        cells[r]![c] = 'water';
                        break;
                    }
                }
            }
        }
    }

    // Pass 3: land cells adjacent to shallow water → 'beach' (except mountain)
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const t = cells[r]![c]!;

            if (t === 'deep_water' || t === 'water' || t === 'mountain' || t === 'hill') {
                continue;
            }

            for (const [dr, dc] of ORTHO_DIRS) {
                const nr = r + dr;
                const nc = c + dc;

                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {
                    continue;
                }

                const n = cells[nr]![nc]!;

                if (n === 'water' || n === 'deep_water') {
                    cells[r]![c] = 'beach';
                    break;
                }
            }
        }
    }
}

// ─── RNG (deterministic) ─────────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
    let a = seed >>> 0;

    return (): number => {
        a += 0x6d2b79f5;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);

        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ─── Main generator ──────────────────────────────────────────────────────────

export type GeoMapOptions = {
    type: GeoMapType;
    teamCount?: number;
    cellRows?: number;
    cellCols?: number;
};

export function generateGeoMap(options: GeoMapOptions): {
    version: 2;
    cellRows: number;
    cellCols: number;
    cells: string[][];
    teamCount: number;
    markers: Array<{ type: string; team: number; row: number; col: number }>;
    teamPaletteSlots: number[];
} {
    const { type } = options;
    const rows = options.cellRows ?? DEFAULT_MAP_CELL_ROWS;  // 195 — longitude (canvas X, horizontal)
    const cols = options.cellCols ?? DEFAULT_MAP_CELL_COLS;  // 108 — latitude  (canvas Y, vertical)
    const requestedTeamCount = options.teamCount ?? DEFAULT_TEAM_COUNTS[type];
    const bbox = BBOXES[type];

    const lonSpan = bbox.east - bbox.west;
    const latSpan = bbox.north - bbox.south;

    // Pre-extract land polygons once
    const landPolygons = extractPolygons(landGeoJson as Parameters<typeof extractPolygons>[0]);

    // Rasterise: cells[r][c] where r → longitude (X, horizontal), c → latitude (Y, vertical)
    const isLandGrid: boolean[][] = Array.from({ length: rows }, () => new Array(cols).fill(false) as boolean[]);

    for (let r = 0; r < rows; r++) {
        const lon = bbox.west + ((r + 0.5) / rows) * lonSpan;

        for (let c = 0; c < cols; c++) {
            const lat = bbox.north - ((c + 0.5) / cols) * latSpan;
            isLandGrid[r]![c] = isLandPoint(lon, lat, landPolygons);
        }
    }

    // Build terrain grid
    const cells: TerrainId[][] = Array.from({ length: rows }, () =>
        new Array(cols).fill('deep_water' as TerrainId),
    );

    for (let r = 0; r < rows; r++) {
        const lon = bbox.west + ((r + 0.5) / rows) * lonSpan;

        for (let c = 0; c < cols; c++) {
            if (!isLandGrid[r]![c]) {
                continue;
            }

            const lat = bbox.north - ((c + 0.5) / cols) * latSpan;
            cells[r]![c] = classifyLandTerrain(lon, lat, r, c);
        }
    }

    // Apply coastal layering
    applyCoastalLayers(cells, rows, cols);

    // Marker placement (capitals → flags → troops)
    const markerSeed = type === 'europe' ? 0xe_1204 : type === 'north_america' ? 0xb0_c10a : 0xab_12cd;
    const markerRng = mulberry32(markerSeed);

    const { teamCount, markers } = buildMarkersForGeneratedTerrain(
        cells as string[][],
        rows,
        cols,
        markerRng,
        requestedTeamCount,
    );

    const troopSpawns = buildTroopMarkersForGeneratedMap(
        cells as string[][],
        rows,
        cols,
        markers,
        teamCount,
        markerRng,
    );

    return {
        version: 2,
        cellRows: rows,
        cellCols: cols,
        cells: cells as string[][],
        teamCount,
        markers: [...markers, ...troopSpawns],
        teamPaletteSlots: defaultTeamPaletteSlots(teamCount),
    };
}

// ─── CLI entry point ─────────────────────────────────────────────────────────

const rawType = process.argv[2];
const type: GeoMapType = (GEO_MAP_TYPES as readonly string[]).includes(rawType ?? '')
    ? (rawType as GeoMapType)
    : 'world';

const rawTeamCount = parseInt(process.argv[3] ?? '', 10);
const teamCount =
    Number.isFinite(rawTeamCount) && rawTeamCount >= 2 && rawTeamCount <= 6
        ? rawTeamCount
        : undefined;

const data = generateGeoMap({ type, teamCount });

process.stdout.write(JSON.stringify(data));
