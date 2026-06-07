/**
 * Writes deterministic SVG terrain previews for each Map Builder generation style.
 * Run: npm run wiki:map-previews
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { MapGenerationType } from '@/lib/generateRandomMap';
import { generateRandomMap } from '@/lib/generateRandomMap';
import { EDITOR_TERRAIN_COLORS, isTerrainId } from '@/lib/terrainCatalog';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'images', 'wiki');

const types: MapGenerationType[] = ['mix', 'islands', 'desert', 'mountains'];
const cellRows = 48;
const cellCols = 56;
const cellPx = 4;
const seed = 4_242_42;

function fillFor(terrainId: string): string {
    return isTerrainId(terrainId) ? EDITOR_TERRAIN_COLORS[terrainId] : '#888888';
}

mkdirSync(outDir, { recursive: true });

for (const type of types) {
    const data = generateRandomMap({
        type,
        seed,
        cellRows,
        cellCols,
        teamCount: 4,
    });

    const parts: string[] = [];

    for (let r = 0; r < cellRows; r++) {
        const row = data.cells[r] ?? [];

        for (let c = 0; c < cellCols; c++) {
            const t = row[c] ?? 'plains';
            const x = c * cellPx;
            const y = r * cellPx;
            parts.push(
                `<rect x="${x}" y="${y}" width="${cellPx}" height="${cellPx}" fill="${fillFor(t)}"/>`,
            );
        }
    }

    const w = cellCols * cellPx;
    const h = cellRows * cellPx;
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${parts.join('')}</svg>
`;

    const file = join(outDir, `map-generation-${type}.svg`);
    writeFileSync(file, svg, 'utf8');
    console.log('Wrote', file);
}
