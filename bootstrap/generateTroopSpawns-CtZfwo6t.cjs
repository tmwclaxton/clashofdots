//#region resources/js/lib/terrainCatalog.ts
/**
* Map editor terrain ids - keep in sync with App\Maps\TerrainCatalog.
*/
var TERRAIN_IDS = [
	"plains",
	"meadow",
	"forest",
	"dense_forest",
	"hill",
	"mountain",
	"water",
	"deep_water",
	"river",
	"swamp",
	"desert",
	"beach",
	"snow"
];
var WATER_TERRAINS = new Set([
	"water",
	"deep_water",
	"river"
]);
function isTerrainId(value) {
	return TERRAIN_IDS.includes(value);
}
function isWaterTerrain(id) {
	return WATER_TERRAINS.has(id);
}
//#endregion
//#region resources/js/lib/mapMarkers.ts
/** Terrains where capitals and flags may not be placed (matches App\Maps\MapMarkers::NON_PLACEABLE_TERRAIN). */
var MARKER_NON_PLACEABLE_TERRAINS = new Set([
	"water",
	"deep_water",
	"river",
	"hill",
	"mountain"
]);
function isPlaceableTerrain(terrainId) {
	return isTerrainId(terrainId) && !MARKER_NON_PLACEABLE_TERRAINS.has(terrainId);
}
/**
* Open water / river tiles used for visual clearance (marker art is drawn larger than a cell).
* Matches {@see App\Maps\MapMarkers::HYDRAULIC_WATER_TERRAIN}.
*/
var HYDRAULIC_WATER_TERRAINS = new Set([
	"water",
	"deep_water",
	"river"
]);
function isHydraulicWaterTerrain(terrainId) {
	return isTerrainId(terrainId) && HYDRAULIC_WATER_TERRAINS.has(terrainId);
}
/**
* True when every hydraulic-water cell is at least `minChebyshev` away (Chebyshev / king moves).
*/
function isFarEnoughFromHydraulicWaterForMapMarker(cells, rows, cols, row, col, minChebyshev = 2) {
	const ext = minChebyshev - 1;
	for (let dr = -ext; dr <= ext; dr++) for (let dc = -ext; dc <= ext; dc++) {
		const r = row + dr;
		const c = col + dc;
		if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
		const terr = cells[r]?.[c];
		if (typeof terr === "string" && isHydraulicWaterTerrain(terr)) return false;
	}
	return true;
}
/**
* Caps flag–capital / flag–flag spacing on very small land budgets so procedural maps can still
* place outposts (troop generator depends on flags for targets and anchor bands).
*/
function clampMinBetweenFlagsForSmallLand(minBetweenFlags, nLand, minDim) {
	if (nLand >= 120) return minBetweenFlags;
	if (nLand < 70) return Math.max(6, Math.min(minBetweenFlags, 6));
	const relaxedCap = Math.max(4, Math.min(10, Math.floor(minDim / 4)));
	return Math.max(6, Math.min(minBetweenFlags, relaxedCap));
}
/**
* Manhattan clearance required from a troop spawn to a capital or flag. Enemy markers use the
* full map `separation`; same-team markers use a smaller ring so armies can sit on home ground
* near their posts (matches server {@see App\Maps\MapMarkers::validate}).
*/
function troopManhattanClearanceToMarker(separation, markerTeam, troopTeam, markerKind) {
	if (markerTeam !== troopTeam) return separation;
	return Math.max(6, Math.min(markerKind === "capital" ? 10 : 12, Math.floor(separation * (markerKind === "capital" ? .42 : .45))));
}
function manhattanDistance(a, b) {
	return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}
/**
* Minimum pairwise Manhattan distance between capitals (for density heuristic).
* When there is only one capital, returns a neutral default.
*/
function inferCapitalSpacing(capitals) {
	if (capitals.length < 2) return 4;
	let m = Infinity;
	for (let i = 0; i < capitals.length; i++) for (let j = i + 1; j < capitals.length; j++) m = Math.min(m, manhattanDistance(capitals[i], capitals[j]));
	return Math.max(1, m === Infinity ? 4 : m);
}
/** Count placeable land cells within Manhattan radius `maxR` of `center` (excludes center). */
function countPlaceableLandInManhattanHalo(cells, rows, cols, center, maxR) {
	let n = 0;
	const r0 = center.row;
	const c0 = center.col;
	const rMin = Math.max(0, r0 - maxR);
	const rMax = Math.min(rows - 1, r0 + maxR);
	const cMin = Math.max(0, c0 - maxR);
	const cMax = Math.min(cols - 1, c0 + maxR);
	for (let r = rMin; r <= rMax; r++) for (let c = cMin; c <= cMax; c++) {
		if (r === r0 && c === c0) continue;
		if (manhattanDistance(center, {
			row: r,
			col: c
		}) > maxR) continue;
		const terr = cells[r]?.[c];
		if (typeof terr !== "string" || !isPlaceableTerrain(terr)) continue;
		n += 1;
	}
	return n;
}
function preliminaryMaxRForMarkerSpacing(rows, cols) {
	const minDim = Math.min(rows, cols);
	return Math.min(rows + cols - 2, Math.max(18, Math.floor(minDim * .52)));
}
function minPlaceableHaloAmongCapitals(cells, rows, cols, capitals, preliminaryMaxR) {
	if (capitals.length === 0) return Infinity;
	let minHalo = Infinity;
	for (const cap of capitals) {
		const h = countPlaceableLandInManhattanHalo(cells, rows, cols, cap, preliminaryMaxR);
		minHalo = Math.min(minHalo, h);
	}
	return minHalo;
}
/**
* Minimum Manhattan gap between flags, and between any flag and any capital (capitals act like
* spacing anchors the same as flags).
*/
function computeMinManhattanMarkerSeparation(input) {
	const { rows, cols, nLand, teamCount, flagBudget, capitalSpacing, minHaloLandCells } = input;
	const minDim = Math.min(rows, cols);
	const dCap = Math.max(1, capitalSpacing);
	let minHalo = minHaloLandCells;
	if (!Number.isFinite(minHalo) || minHalo < 6) minHalo = Math.max(12, Math.floor(nLand / Math.max(8, teamCount * 4)));
	const flagsEach = Math.max(1, flagBudget / teamCount);
	const densitySpacing = Math.round(Math.sqrt(Math.max(1, minHalo) / (flagsEach * .55)));
	const fromCapitalSep = Math.floor(dCap * .52) + 2;
	return Math.max(6, Math.min(minDim > 140 ? 36 : 28, Math.max(densitySpacing, fromCapitalSep)));
}
function countPlaceableLandCells(cells, rows, cols) {
	let nLand = 0;
	for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
		const t = cells[r]?.[c];
		if (typeof t === "string" && isPlaceableTerrain(t)) nLand += 1;
	}
	return nLand;
}
/**
* Shared spacing used by random generation, client validation, and editor placement.
*/
function computeMinSeparationForMapState(options) {
	const { cells, rows, cols, teamCount, capitalPositions, flagBudget } = options;
	const nLand = countPlaceableLandCells(cells, rows, cols);
	const minHalo = minPlaceableHaloAmongCapitals(cells, rows, cols, capitalPositions, preliminaryMaxRForMarkerSpacing(rows, cols));
	return computeMinManhattanMarkerSeparation({
		rows,
		cols,
		nLand,
		teamCount,
		flagBudget,
		capitalSpacing: inferCapitalSpacing(capitalPositions),
		minHaloLandCells: minHalo
	});
}
function isAllowedMapGridSize(cellRows, cellCols) {
	return Number.isInteger(cellRows) && Number.isInteger(cellCols) && cellRows >= 4 && cellRows <= 256 && cellCols >= 4 && cellCols <= 256;
}
/** Identity mapping: logical team `i` uses palette slot `i`. */
function defaultTeamPaletteSlots(teamCount) {
	return Array.from({ length: teamCount }, (_, i) => i);
}
//#endregion
//#region resources/js/lib/generateMapMarkers.ts
function manhattan(a, b) {
	return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}
function shuffleInPlace$1(arr, rng) {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		const t = arr[i];
		arr[i] = arr[j];
		arr[j] = t;
	}
}
function collectPlaceableCells(cells, rows, cols) {
	const out = [];
	for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
		const t = cells[r]?.[c];
		if (typeof t === "string" && isPlaceableTerrain(t) && isFarEnoughFromHydraulicWaterForMapMarker(cells, rows, cols, r, c)) out.push({
			row: r,
			col: c
		});
	}
	return out;
}
/**
* Greedy pick in fixed visit order: each cell at least `minDist` Manhattan from all chosen.
*/
function greedyFromOrder(order, minDist, maxPick) {
	const picked = [];
	for (const cell of order) {
		if (picked.length >= maxPick) break;
		if (picked.every((p) => manhattan(p, cell) >= minDist)) picked.push(cell);
	}
	return picked;
}
/**
* Score for adding a candidate capital: maximize minimum distance to existing capitals, then
* total distance (uses map area more evenly than min-distance alone).
*/
function capitalSpreadScore(candidate, existing) {
	let minD = Infinity;
	let sumD = 0;
	for (const p of existing) {
		const d = manhattan(candidate, p);
		minD = Math.min(minD, d);
		sumD += d;
	}
	return {
		minD,
		sumD
	};
}
/**
* Farthest-point sampling on placeable land (Manhattan): iteratively pick the cell whose
* distance to already-chosen capitals is largest, breaking ties by larger total distance then RNG.
*/
function pickFarthestCapitals(placeable, k, rng) {
	if (k <= 0 || placeable.length === 0) return [];
	const target = Math.min(k, placeable.length);
	const picked = [];
	const used = /* @__PURE__ */ new Set();
	const first = placeable[Math.floor(rng() * placeable.length)];
	picked.push(first);
	used.add(`${first.row},${first.col}`);
	while (picked.length < target) {
		let bestMin = -1;
		let bestSum = -1;
		const candidates = [];
		for (const cell of placeable) {
			const key = `${cell.row},${cell.col}`;
			if (used.has(key)) continue;
			const { minD, sumD } = capitalSpreadScore(cell, picked);
			if (minD > bestMin || minD === bestMin && sumD > bestSum) {
				bestMin = minD;
				bestSum = sumD;
				candidates.length = 0;
				candidates.push(cell);
			} else if (minD === bestMin && sumD === bestSum) candidates.push(cell);
		}
		if (candidates.length === 0) break;
		const choice = candidates[Math.floor(rng() * candidates.length)];
		picked.push(choice);
		used.add(`${choice.row},${choice.col}`);
	}
	return picked;
}
function padCapitalsToMinTeams(capitals, placeable, minTeams) {
	const out = capitals.slice();
	const used = new Set(out.map((p) => `${p.row},${p.col}`));
	for (const p of placeable) {
		if (out.length >= minTeams) break;
		const key = `${p.row},${p.col}`;
		if (!used.has(key)) {
			out.push(p);
			used.add(key);
		}
	}
	return out;
}
/**
* Placeable land cells within Manhattan distance `maxR` of `cap`, ordered nearest first.
* Within the same distance, order is randomized for variety.
*/
function buildOrderedPlaceableNear(cells, rows, cols, cap, maxR, rng) {
	const byDistance = /* @__PURE__ */ new Map();
	for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
		const terr = cells[r]?.[c];
		if (typeof terr !== "string" || !isPlaceableTerrain(terr)) continue;
		if (!isFarEnoughFromHydraulicWaterForMapMarker(cells, rows, cols, r, c)) continue;
		const d = manhattan(cap, {
			row: r,
			col: c
		});
		if (d === 0 || d > maxR) continue;
		const bucket = byDistance.get(d) ?? [];
		bucket.push({
			row: r,
			col: c
		});
		byDistance.set(d, bucket);
	}
	const ordered = [];
	for (const d of [...byDistance.keys()].sort((a, b) => a - b)) {
		const bucket = byDistance.get(d);
		shuffleInPlace$1(bucket, rng);
		ordered.push(...bucket);
	}
	return ordered;
}
/**
* If placement stalls unevenly, drop surplus flags so every team has the same count (minimum
* achieved across teams).
*/
function balanceFlagsPerTeamEquality(flags, teamCount) {
	const buckets = Array.from({ length: teamCount }, () => []);
	for (const f of flags) {
		if (f.type !== "flag") continue;
		const t = f.team;
		if (t >= 0 && t < teamCount) buckets[t].push(f);
	}
	let m = Infinity;
	for (let t = 0; t < teamCount; t++) m = Math.min(m, buckets[t].length);
	if (!Number.isFinite(m)) m = 0;
	const out = [];
	for (let t = 0; t < teamCount; t++) out.push(...buckets[t].slice(0, m));
	return out;
}
/**
* Place flags in a cluster around each team's capital: nearest legal land first, round-robin
* across teams with the same per-team quota. Flags stay at least `minBetweenFlags` Manhattan
* apart from each other and from every capital (same gap).
*/
function placeFlagsNearCapitals(cells, rows, cols, teamCount, capitals, occupied, flagTarget, capitalSpacing, nLand, rng) {
	const minDim = Math.min(rows, cols);
	const preliminaryMaxR = preliminaryMaxRForMarkerSpacing(rows, cols);
	let minHalo = minPlaceableHaloAmongCapitals(cells, rows, cols, capitals, preliminaryMaxR);
	if (!Number.isFinite(minHalo) || minHalo < 6) minHalo = Math.max(12, Math.floor(nLand / Math.max(8, teamCount * 4)));
	let minBetweenFlags = computeMinManhattanMarkerSeparation({
		rows,
		cols,
		nLand,
		teamCount,
		flagBudget: flagTarget,
		capitalSpacing,
		minHaloLandCells: minHalo
	});
	minBetweenFlags = clampMinBetweenFlagsForSmallLand(minBetweenFlags, nLand, minDim);
	const maxR = Math.min(rows + cols - 2, Math.max(preliminaryMaxR, minBetweenFlags * 5, Math.floor(minDim * .52)));
	const queues = capitals.map((cap) => buildOrderedPlaceableNear(cells, rows, cols, cap, maxR, rng));
	const ptr = new Array(teamCount).fill(0);
	const flags = [];
	let placed = 0;
	const quota = Math.floor(flagTarget / teamCount);
	const flagsPerTeam = new Array(teamCount).fill(0);
	function farEnoughFromFlagsAndCapitals(cell) {
		for (const f of flags) if (manhattan(cell, {
			row: f.row,
			col: f.col
		}) < minBetweenFlags) return false;
		for (const c of capitals) if (manhattan(cell, c) < minBetweenFlags) return false;
		return true;
	}
	while (placed < flagTarget) {
		let progressed = false;
		for (let t = 0; t < teamCount; t++) {
			if (placed >= flagTarget) break;
			if (flagsPerTeam[t] >= quota) continue;
			const q = queues[t];
			while (ptr[t] < q.length) {
				const cell = q[ptr[t]];
				ptr[t] += 1;
				const key = `${cell.row},${cell.col}`;
				if (occupied.has(key)) continue;
				if (!farEnoughFromFlagsAndCapitals(cell)) continue;
				flags.push({
					type: "flag",
					team: t,
					row: cell.row,
					col: cell.col
				});
				occupied.add(key);
				placed += 1;
				flagsPerTeam[t] += 1;
				progressed = true;
				break;
			}
		}
		if (!progressed) break;
	}
	return balanceFlagsPerTeamEquality(flags, teamCount);
}
/**
* True when every team has at least one passable Voronoi cell (excluding capitals) that can host
* a troop under the same Manhattan rules as {@see buildTroopMarkersForGeneratedMap} (using the
* map's computed separation capped by capital spread).
*/
function eachTeamHasTroopFeasibleLand(cells, rows, cols, capitals, teamCount) {
	if (capitals.length !== teamCount || teamCount < 1) return false;
	const capitalPositions = capitals.map((c) => ({
		row: c.row,
		col: c.col
	}));
	const nLand = countPlaceableLandCells(cells, rows, cols);
	const flagBudget = Math.max(teamCount * 2, Math.min(320, Math.max(48, Math.floor(nLand / 3))));
	const sep = Math.min(computeMinSeparationForMapState({
		cells,
		rows,
		cols,
		teamCount,
		capitalPositions,
		flagBudget
	}), Math.max(6, inferCapitalSpacing(capitals)));
	const owner = Array.from({ length: rows }, () => Array(cols).fill(-1));
	for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
		const terr = cells[r]?.[c];
		if (typeof terr !== "string" || !isPlaceableTerrain(terr) || !isFarEnoughFromHydraulicWaterForMapMarker(cells, rows, cols, r, c)) continue;
		let bestD = Infinity;
		let bestTeam = 0;
		for (let t = 0; t < capitals.length; t++) {
			const cap = capitals[t];
			const d = Math.abs(r - cap.row) + Math.abs(c - cap.col);
			if (d < bestD || d === bestD && t < bestTeam) {
				bestD = d;
				bestTeam = t;
			}
		}
		owner[r][c] = bestTeam;
	}
	const occupied = new Set(capitals.map((p) => `${p.row},${p.col}`));
	const found = new Array(teamCount).fill(false);
	for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
		const t = owner[r]?.[c] ?? -1;
		if (t < 0 || t >= teamCount) continue;
		if (occupied.has(`${r},${c}`)) continue;
		const terr = cells[r]?.[c];
		if (typeof terr !== "string" || !isPlaceableTerrain(terr) || !isFarEnoughFromHydraulicWaterForMapMarker(cells, rows, cols, r, c)) continue;
		let ok = true;
		for (let ot = 0; ot < capitals.length; ot++) {
			const capCell = capitals[ot];
			const need = troopManhattanClearanceToMarker(sep, ot, t, "capital");
			if (Math.abs(r - capCell.row) + Math.abs(c - capCell.col) < need) {
				ok = false;
				break;
			}
		}
		if (ok) found[t] = true;
	}
	return found.every(Boolean);
}
/**
* When farthest-point sampling lands capitals very close (common on tiny islands), legal troop
* spacing around flags/capitals may have no solution. Re-sample and fall back to a greedy spread
* so procedural maps keep usable separation.
*/
function widenCapitalsForTroopLegroom(cells, rows, cols, capitals, placeable, teamCount, minDim, rng) {
	if (teamCount < 2 || capitals.length < 2) return capitals;
	if (eachTeamHasTroopFeasibleLand(cells, rows, cols, capitals, teamCount)) return capitals;
	for (let attempt = 0; attempt < 120; attempt += 1) {
		const next = pickFarthestCapitals(placeable, teamCount, rng);
		if (eachTeamHasTroopFeasibleLand(cells, rows, cols, next, teamCount)) return next;
	}
	for (let d = Math.min(22, Math.max(6, Math.floor(minDim * .55))); d >= 6; d -= 1) for (let rep = 0; rep < 20; rep += 1) {
		const order = placeable.slice();
		shuffleInPlace$1(order, rng);
		const spread = greedyFromOrder(order, d, teamCount);
		if (spread.length >= teamCount && eachTeamHasTroopFeasibleLand(cells, rows, cols, spread.slice(0, teamCount), teamCount)) return spread.slice(0, teamCount);
	}
	return capitals;
}
/**
* Pick capital sites and flags from generated terrain. Uses the same placement rules as the
* editor (land only: not water / deep_water / river; capitals and flags also keep Chebyshev
* clearance from hydraulic water so large glyphs do not read as overlapping water).
*
* Team count: by default, scan Manhattan spacing thresholds on one shuffled land list - prefer
* more teams when the map has room; tie-break toward wider spacing. Capital *positions* are then
* chosen by farthest-point sampling so teams spread across placeable land instead of following
* visit order. When {@link requestedTeamCount} is a valid integer in range, that count is used
* instead (still limited by how many placeable cells exist).
*/
function buildMarkersForGeneratedTerrain(cells, rows, cols, rng, requestedTeamCount) {
	const placeable = collectPlaceableCells(cells, rows, cols);
	const nLand = placeable.length;
	const minDim = Math.min(rows, cols);
	if (nLand === 0) return {
		teamCount: 2,
		markers: []
	};
	let capitals;
	let teamCount;
	if (typeof requestedTeamCount === "number" && Number.isInteger(requestedTeamCount) && requestedTeamCount >= 2 && requestedTeamCount <= 6) {
		const k = requestedTeamCount;
		capitals = pickFarthestCapitals(placeable, k, rng);
		if (capitals.length < k) capitals = padCapitalsToMinTeams(capitals, placeable, k);
		teamCount = Math.min(6, Math.max(2, capitals.length));
		capitals = pickFarthestCapitals(placeable, teamCount, rng);
		capitals = widenCapitalsForTroopLegroom(cells, rows, cols, capitals, placeable, teamCount, minDim, rng);
	} else {
		const order = placeable.slice();
		shuffleInPlace$1(order, rng);
		const maxD = Math.max(2, Math.floor(minDim / 9));
		let best = [];
		let bestD = 0;
		for (let d = maxD; d >= 1; d--) {
			const c = greedyFromOrder(order, d, 6);
			if (c.length >= 2) {
				if (c.length > best.length || c.length === best.length && d > bestD) {
					best = c;
					bestD = d;
				}
			}
		}
		capitals = best;
		if (capitals.length < 2) capitals = greedyFromOrder(order, 1, 6);
		if (capitals.length < 2) capitals = padCapitalsToMinTeams(capitals, placeable, 2);
		teamCount = Math.min(6, Math.max(2, capitals.length));
		capitals = pickFarthestCapitals(placeable, teamCount, rng);
		capitals = widenCapitalsForTroopLegroom(cells, rows, cols, capitals, placeable, teamCount, minDim, rng);
	}
	const markers = capitals.map((cell, team) => ({
		type: "capital",
		team,
		row: cell.row,
		col: cell.col
	}));
	const occupied = new Set(capitals.map((p) => `${p.row},${p.col}`));
	const landBudget = Math.floor(nLand / 90);
	const maxTotal = Math.min(Math.min(48, Math.max(teamCount, landBudget)), teamCount * 5);
	const flagTarget = Math.floor(maxTotal / teamCount) * teamCount;
	const capitalSpacing = inferCapitalSpacing(capitals);
	const flagMarkers = placeFlagsNearCapitals(cells, rows, cols, teamCount, capitals, occupied, flagTarget, capitalSpacing, nLand, rng);
	markers.push(...flagMarkers);
	return {
		teamCount,
		markers
	};
}
//#endregion
//#region resources/js/lib/generateTroopSpawns.ts
var ORTHO = [
	[1, 0],
	[-1, 0],
	[0, 1],
	[0, -1]
];
function shuffleInPlace(arr, rng) {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		const t = arr[i];
		arr[i] = arr[j];
		arr[j] = t;
	}
}
function cellKey(r, c) {
	return `${r},${c}`;
}
function isStrictInterTeamBorder(owner, rows, cols, r, c, team) {
	if ((owner[r]?.[c] ?? -1) !== team) return false;
	for (const [dr, dc] of ORTHO) {
		const nr = r + dr;
		const nc = c + dc;
		if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
		const o = owner[nr]?.[nc] ?? -1;
		if (o >= 0 && o !== team) return true;
	}
	return false;
}
/**
* True when ortho-adjacent to water / river (shoreline) or to another team's land - used on
* island maps where Voronoi "strict" borders are empty because factions only meet across sea.
*/
function isShoreOrContestNeighbor(cells, owner, rows, cols, r, c, team) {
	for (const [dr, dc] of ORTHO) {
		const nr = r + dr;
		const nc = c + dc;
		if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
		const terr = cells[nr]?.[nc];
		if (typeof terr === "string" && isTerrainIdWaterOrRiver(terr)) return true;
		const o = owner[nr]?.[nc] ?? -1;
		if (o >= 0 && o !== team) return true;
	}
	return false;
}
function isTerrainIdWaterOrRiver(terr) {
	return isTerrainId(terr) && isWaterTerrain(terr);
}
/** Troop placement "front": land border with another faction, or (islands) shoreline / contest. */
function isTroopFrontCell(cells, owner, rows, cols, r, c, team, islandLike) {
	if (isStrictInterTeamBorder(owner, rows, cols, r, c, team)) return true;
	if (!islandLike) return false;
	return isShoreOrContestNeighbor(cells, owner, rows, cols, r, c, team);
}
/**
* Unoccupied placeable cells ortho-adjacent to a team's capital or flags - real BFS seeds
* (marker cells themselves sit in `occupied` and must not be passed as seeds).
*/
function collectAdjacentAnchorSeedsForTeam(cells, rows, cols, owner, team, markers, occupied) {
	const out = [];
	const seen = /* @__PURE__ */ new Set();
	for (const m of markers) {
		if (m.team !== team || m.type !== "capital" && m.type !== "flag") continue;
		for (const [dr, dc] of ORTHO) {
			const nr = m.row + dr;
			const nc = m.col + dc;
			const k = cellKey(nr, nc);
			if (seen.has(k)) continue;
			if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || occupied.has(k)) continue;
			if ((owner[nr]?.[nc] ?? -1) !== team) continue;
			const terr = cells[nr]?.[nc];
			if (typeof terr !== "string" || !isPlaceableTerrain(terr) || !isFarEnoughFromHydraulicWaterForMapMarker(cells, rows, cols, nr, nc)) continue;
			seen.add(k);
			out.push({
				row: nr,
				col: nc
			});
		}
	}
	return out;
}
function collectCoastalOwnedSeedsForTeam(cells, rows, cols, owner, team, occupied, islandLike) {
	if (!islandLike) return [];
	const out = [];
	const seen = /* @__PURE__ */ new Set();
	for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
		if ((owner[r]?.[c] ?? -1) !== team) continue;
		const k = cellKey(r, c);
		if (occupied.has(k) || seen.has(k)) continue;
		const terr = cells[r]?.[c];
		if (typeof terr !== "string" || !isPlaceableTerrain(terr) || !isFarEnoughFromHydraulicWaterForMapMarker(cells, rows, cols, r, c)) continue;
		if (!isShoreOrContestNeighbor(cells, owner, rows, cols, r, c, team)) continue;
		seen.add(k);
		out.push({
			row: r,
			col: c
		});
	}
	return out;
}
/**
* Multi-source BFS from strict inter-team border cells into own territory up to `maxDepth`
* steps, producing a thickened “front band” (not only the one-pixel Voronoi cut).
*/
function buildFrontierBandForTeam(cells, rows, cols, owner, team, seeds, occupied, maxDepth) {
	const seen = /* @__PURE__ */ new Set();
	const out = [];
	const queue = [];
	for (const s of seeds) {
		const k = cellKey(s.row, s.col);
		if (occupied.has(k) || seen.has(k)) continue;
		const terr = cells[s.row]?.[s.col];
		if (typeof terr !== "string" || !isPlaceableTerrain(terr) || !isFarEnoughFromHydraulicWaterForMapMarker(cells, rows, cols, s.row, s.col)) continue;
		if ((owner[s.row]?.[s.col] ?? -1) !== team) continue;
		seen.add(k);
		queue.push({
			row: s.row,
			col: s.col,
			depth: 0
		});
		out.push({
			row: s.row,
			col: s.col
		});
	}
	let qi = 0;
	while (qi < queue.length) {
		const { row: r, col: c, depth } = queue[qi];
		qi += 1;
		if (depth >= maxDepth) continue;
		for (const [dr, dc] of ORTHO) {
			const nr = r + dr;
			const nc = c + dc;
			const nk = cellKey(nr, nc);
			if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || seen.has(nk) || occupied.has(nk)) continue;
			if ((owner[nr]?.[nc] ?? -1) !== team) continue;
			const terr = cells[nr]?.[nc];
			if (typeof terr !== "string" || !isPlaceableTerrain(terr) || !isFarEnoughFromHydraulicWaterForMapMarker(cells, rows, cols, nr, nc)) continue;
			seen.add(nk);
			const next = {
				row: nr,
				col: nc,
				depth: depth + 1
			};
			queue.push(next);
			out.push({
				row: nr,
				col: nc
			});
		}
	}
	return out;
}
/** Minimum total troops per team when the smallest faction still has enough owned land. */
var SYMMETRIC_TROOP_TOTAL_FLOOR = 10;
/**
* Same infantry and same tank count for every team. Desired counts scale with map size, borders,
* band supply, and flags; the realised total per team is capped by usable owned land, not only the
* frontier band (bands can be empty when Voronoi territories do not share an edge).
*/
function computeSymmetricTroopTargets(islandLike, minDim, minPrimaryBorderLen, minBandLen, minOwnedPlaceablePerTeam, capitalCount, flagsPerTeam) {
	let wantInf = 12;
	let wantTanks = 4;
	const band = Math.max(0, minBandLen);
	const border = Math.max(4, minPrimaryBorderLen);
	const outpostInf = Math.round(flagsPerTeam * 2.8);
	const outpostTanks = Math.round(flagsPerTeam * .55);
	const capitalInf = Math.round(capitalCount * 2.5);
	if (islandLike) {
		const scaleBorder = Math.floor(border * .72);
		wantInf = Math.min(40, Math.max(12, scaleBorder + outpostInf + capitalInf));
		wantTanks = Math.min(10, Math.max(3, Math.floor(border * .18) + outpostTanks + 1));
	} else {
		const scale = Math.min(2.65, .75 + minDim / 88);
		wantInf = Math.min(80, Math.max(18, Math.round(12 * scale + band * .055 + border * .14 + outpostInf + capitalInf)));
		wantTanks = Math.min(20, Math.max(5, Math.round(4 * scale + band * .018 + outpostTanks + 1)));
	}
	const wantTotal = wantInf + wantTanks;
	const owned = Math.max(0, Math.floor(minOwnedPlaceablePerTeam));
	let cap = Math.min(wantTotal, owned);
	if (owned >= SYMMETRIC_TROOP_TOTAL_FLOOR) cap = Math.max(cap, Math.min(SYMMETRIC_TROOP_TOTAL_FLOOR, wantTotal, owned));
	cap = Math.max(0, Math.min(cap, wantTotal, owned));
	const wSum = wantInf + wantTanks;
	let infantry = wSum > 0 ? Math.round(cap * wantInf / wSum) : 0;
	let tanks = cap - infantry;
	infantry = Math.min(infantry, wantInf);
	tanks = Math.min(tanks, wantTanks);
	while (infantry + tanks < cap && (infantry < wantInf || tanks < wantTanks)) if (tanks < wantTanks && infantry < wantInf) {
		const rInf = infantry / wantInf;
		if (tanks / wantTanks >= rInf) tanks += 1;
		else infantry += 1;
	} else if (tanks < wantTanks) tanks += 1;
	else if (infantry < wantInf) infantry += 1;
	else break;
	while (infantry + tanks > cap) if (tanks > 0) tanks -= 1;
	else infantry = Math.max(0, infantry - 1);
	return {
		infantry,
		tanks
	};
}
function canPlaceTroopHere(row, col, sep, troopSep, sepBlockingMarkers, troopTeam, troopSites) {
	const p = {
		row,
		col
	};
	for (const m of sepBlockingMarkers) {
		if (m.type !== "capital" && m.type !== "flag") continue;
		const need = troopManhattanClearanceToMarker(sep, m.team, troopTeam, m.type === "capital" ? "capital" : "flag");
		if (manhattanDistance(p, {
			row: m.row,
			col: m.col
		}) < need) return false;
	}
	for (const t of troopSites) if (manhattanDistance(p, t) < troopSep) return false;
	return true;
}
function minManhattanToMarkers(row, col, sites) {
	if (sites.length === 0) return Infinity;
	const p = {
		row,
		col
	};
	let best = Infinity;
	for (const s of sites) best = Math.min(best, manhattanDistance(p, {
		row: s.row,
		col: s.col
	}));
	return best;
}
function minOwnedPlaceableCellsPerTeam(cells, rows, cols, owner, teamCount, occupied) {
	const counts = new Array(teamCount).fill(0);
	for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
		const t = owner[r]?.[c] ?? -1;
		if (t < 0 || t >= teamCount) continue;
		const k = cellKey(r, c);
		if (occupied.has(k)) continue;
		const terr = cells[r]?.[c];
		if (typeof terr !== "string" || !isPlaceableTerrain(terr) || !isFarEnoughFromHydraulicWaterForMapMarker(cells, rows, cols, r, c)) continue;
		counts[t] += 1;
	}
	return counts.length > 0 ? Math.min(...counts) : 0;
}
function eachTeamHasAtLeastOneFreeOwnedPlaceableCell(cells, rows, cols, owner, teamCount, markerOccupied) {
	const noopRng = () => 0;
	for (let team = 0; team < teamCount; team++) if (buildAllFreeOwnedPlaceableCellsForTeam(cells, rows, cols, owner, team, markerOccupied, noopRng).length === 0) return false;
	return true;
}
/**
* All passable, non-marker land cells owned by `team` in the Voronoi sense (for emergency troop
* placement when frontier bands are empty or full spacing cannot be satisfied).
*/
function buildAllFreeOwnedPlaceableCellsForTeam(cells, rows, cols, owner, team, markerOccupied, rng) {
	const out = [];
	for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
		if ((owner[r]?.[c] ?? -1) !== team) continue;
		const k = cellKey(r, c);
		if (markerOccupied.has(k)) continue;
		const terr = cells[r]?.[c];
		if (typeof terr !== "string" || !isPlaceableTerrain(terr) || !isFarEnoughFromHydraulicWaterForMapMarker(cells, rows, cols, r, c)) continue;
		out.push({
			row: r,
			col: c
		});
	}
	shuffleInPlace(out, rng);
	return out;
}
function mergeCandidateCellsUnique(a, b, rng) {
	const map = /* @__PURE__ */ new Map();
	for (const c of a) map.set(cellKey(c.row, c.col), c);
	for (const c of b) map.set(cellKey(c.row, c.col), c);
	const out = [...map.values()];
	shuffleInPlace(out, rng);
	return out;
}
function collectExtraOwnedCandidatesForTeam(cells, rows, cols, owner, team, occupied, existingKeys, maxAdd) {
	const out = [];
	for (let r = 0; r < rows && out.length < maxAdd; r++) for (let c = 0; c < cols && out.length < maxAdd; c++) {
		if ((owner[r]?.[c] ?? -1) !== team) continue;
		const k = cellKey(r, c);
		if (occupied.has(k) || existingKeys.has(k)) continue;
		const terr = cells[r]?.[c];
		if (typeof terr !== "string" || !isPlaceableTerrain(terr) || !isFarEnoughFromHydraulicWaterForMapMarker(cells, rows, cols, r, c)) continue;
		out.push({
			row: r,
			col: c
		});
	}
	return out;
}
function scoreTroopCandidateCell(cells, row, col, team, rows, cols, owner, ownCapitals, ownFlags, sameTeamTroopKeys, islandLike, rng) {
	let s = rng() * .04;
	const onFront = isTroopFrontCell(cells, owner, rows, cols, row, col, team, islandLike);
	if (onFront) s += 28;
	else s += .35;
	const dCap = minManhattanToMarkers(row, col, ownCapitals);
	const dFlag = minManhattanToMarkers(row, col, ownFlags);
	if (onFront) {
		if (Number.isFinite(dCap)) s += 4 / (1 + dCap);
		if (Number.isFinite(dFlag)) s += 3 / (1 + Math.min(dFlag, 48));
	} else {
		if (Number.isFinite(dCap)) s += 1.2 / (1 + dCap);
		if (Number.isFinite(dFlag)) s += .9 / (1 + Math.min(dFlag, 72));
	}
	let adjSame = 0;
	for (const [dr, dc] of ORTHO) {
		const nk = cellKey(row + dr, col + dc);
		if (sameTeamTroopKeys.has(nk)) adjSame += 1;
	}
	if (adjSame === 1) s += onFront ? 22 : 10;
	else if (adjSame === 2) s += onFront ? 14 : 6;
	else if (adjSame > 2) s -= (adjSame - 2) * (onFront ? 2.2 : 4);
	return s;
}
function pickNextTroopTypeForTeam(team, targetInfantry, targetTanks, placedInf, placedTank) {
	const pi = placedInf[team] ?? 0;
	const pt = placedTank[team] ?? 0;
	if (pi >= targetInfantry && pt >= targetTanks) return null;
	if (pi >= targetInfantry) return "tank";
	if (pt >= targetTanks) return "infantry";
	if (targetInfantry <= 0) return "tank";
	if (targetTanks <= 0) return "infantry";
	const rInf = pi / targetInfantry;
	return pt / targetTanks >= rInf ? "tank" : "infantry";
}
/**
* Places one troop at a time in team rotation so early factions do not consume the entire frontier
* under global troop–troop spacing.
*/
function placeSymmetricTroopsRoundRobin(teamCount, enrichedCandidatesByTeam, cells, rows, cols, owner, targetInfantry, targetTanks, sep, troopSep, sepBlockingMarkers, markers, markerOccupied, islandLike, rng) {
	const ownCapitalsByTeam = Array.from({ length: teamCount }, () => []);
	const ownFlagsByTeam = Array.from({ length: teamCount }, () => []);
	for (const m of markers) {
		if (m.type === "capital" && m.team >= 0 && m.team < teamCount) ownCapitalsByTeam[m.team].push(m);
		if (m.type === "flag" && m.team >= 0 && m.team < teamCount) ownFlagsByTeam[m.team].push(m);
	}
	const out = [];
	const troopSitesGlobal = [];
	const placedInf = new Array(teamCount).fill(0);
	const placedTank = new Array(teamCount).fill(0);
	const sameKeysByTeam = Array.from({ length: teamCount }, () => /* @__PURE__ */ new Set());
	const remainingByTeam = enrichedCandidatesByTeam.map((cellsList) => new Set(cellsList.map((c) => cellKey(c.row, c.col))));
	const allPlaced = () => {
		for (let t = 0; t < teamCount; t++) if (placedInf[t] < targetInfantry || placedTank[t] < targetTanks) return false;
		return true;
	};
	let stallWaves = 0;
	while (!allPlaced()) {
		let progress = false;
		const waveOrder = Array.from({ length: teamCount }, (_, i) => i);
		waveOrder.sort((a, b) => {
			const deficit = (t) => targetInfantry - placedInf[t] + (targetTanks - placedTank[t]);
			const d = deficit(b) - deficit(a);
			if (d !== 0) return d;
			return a - b;
		});
		for (const team of waveOrder) {
			const kind = pickNextTroopTypeForTeam(team, targetInfantry, targetTanks, placedInf, placedTank);
			if (kind === null) continue;
			const remaining = remainingByTeam[team];
			if (remaining.size === 0) continue;
			let bestKey = null;
			let bestScore = -Infinity;
			for (const k of remaining) {
				const [rs, cs] = k.split(",");
				const row = Number(rs);
				const col = Number(cs);
				if (!Number.isInteger(row) || !Number.isInteger(col)) continue;
				if (!canPlaceTroopHere(row, col, sep, troopSep, sepBlockingMarkers, team, troopSitesGlobal)) continue;
				const sc = scoreTroopCandidateCell(cells, row, col, team, rows, cols, owner, ownCapitalsByTeam[team], ownFlagsByTeam[team], sameKeysByTeam[team], islandLike, rng);
				if (sc > bestScore || sc === bestScore && rng() < .5) {
					bestScore = sc;
					bestKey = k;
				}
			}
			if (bestKey === null) continue;
			const [brs, bcs] = bestKey.split(",");
			const row = Number(brs);
			const col = Number(bcs);
			remaining.delete(bestKey);
			if (kind === "tank") {
				out.push({
					type: "tank",
					team,
					row,
					col
				});
				placedTank[team] += 1;
			} else {
				out.push({
					type: "infantry",
					team,
					row,
					col
				});
				placedInf[team] += 1;
			}
			troopSitesGlobal.push({
				row,
				col
			});
			sameKeysByTeam[team].add(bestKey);
			progress = true;
		}
		if (progress) stallWaves = 0;
		else {
			stallWaves += 1;
			if (stallWaves < 2) continue;
			let expanded = false;
			for (let team = 0; team < teamCount; team++) {
				if (placedInf[team] >= targetInfantry && placedTank[team] >= targetTanks) continue;
				const extras = collectExtraOwnedCandidatesForTeam(cells, rows, cols, owner, team, markerOccupied, remainingByTeam[team], 520);
				for (const c of extras) {
					const k = cellKey(c.row, c.col);
					if (!remainingByTeam[team].has(k)) {
						remainingByTeam[team].add(k);
						expanded = true;
					}
				}
			}
			if (!expanded) break;
			stallWaves = 0;
		}
	}
	return out;
}
function countTroopMarkersPerTeam(troops, teamCount) {
	const inf = new Array(teamCount).fill(0);
	const tank = new Array(teamCount).fill(0);
	for (const m of troops) if (m.type === "infantry") inf[m.team] += 1;
	else if (m.type === "tank") tank[m.team] += 1;
	return {
		inf,
		tank
	};
}
/**
* Drop surplus troops from teams above the minimum so every faction matches the smallest infantry
* and smallest tank counts (removes interior / non-front spawns first when possible).
*/
function symmetricTrimTroopMarkers(troops, teamCount, cells, rows, cols, owner, islandLike) {
	const { inf, tank } = countTroopMarkersPerTeam(troops, teamCount);
	const minI = Math.min(...inf);
	const maxI = Math.max(...inf);
	const minT = Math.min(...tank);
	const maxT = Math.max(...tank);
	if (minI === maxI && minT === maxT) return troops;
	const toRemove = /* @__PURE__ */ new Set();
	const removalTier = (m) => {
		return isTroopFrontCell(cells, owner, rows, cols, m.row, m.col, m.team, islandLike) ? 1 : 0;
	};
	if (maxI > minI) {
		if (minI > 0) for (let t = 0; t < teamCount; t++) {
			if (inf[t] <= minI) continue;
			const take = inf[t] - minI;
			const cands = troops.filter((m) => m.team === t && m.type === "infantry");
			cands.sort((a, b) => removalTier(a) - removalTier(b));
			for (let i = 0; i < take && i < cands.length; i++) toRemove.add(cellKey(cands[i].row, cands[i].col));
		}
	}
	if (maxT > minT) {
		if (minT > 0) for (let t = 0; t < teamCount; t++) {
			if (tank[t] <= minT) continue;
			const take = tank[t] - minT;
			const cands = troops.filter((m) => m.team === t && m.type === "tank" && !toRemove.has(cellKey(m.row, m.col)));
			cands.sort((a, b) => removalTier(a) - removalTier(b));
			for (let i = 0; i < take && i < cands.length; i++) toRemove.add(cellKey(cands[i].row, cands[i].col));
		}
	}
	if (toRemove.size === 0) return troops;
	return troops.filter((m) => !toRemove.has(cellKey(m.row, m.col)));
}
/**
* After capitals exist, assign each placeable land cell to the nearest capital (Manhattan).
* Troops use a symmetric round-robin fill on a merged frontier band plus an anchored corridor
* from each team's capital and flags toward borders, matching {@see App\Maps\MapMarkers::validate}
* spacing to capitals, flags, and other troops.
*/
function buildTroopMarkersForGeneratedMap(cells, rows, cols, markers, teamCount, rng, options) {
	const islandLike = options?.islandLike === true;
	const capitals = markers.filter((m) => m.type === "capital");
	if (capitals.length === 0 || capitals.length !== teamCount) return [];
	const markerOccupied = new Set(markers.map((m) => `${m.row},${m.col}`));
	const occupied = new Set(markerOccupied);
	const capitalPositions = capitals.map((c) => ({
		row: c.row,
		col: c.col
	}));
	const nLand = countPlaceableLandCells(cells, rows, cols);
	const nonCapitalCount = markers.filter((m) => m.type !== "capital").length;
	const flagBudget = Math.max(nonCapitalCount + 1, teamCount * 2, Math.min(320, Math.max(48, Math.floor(nLand / 3))));
	const sep = Math.min(computeMinSeparationForMapState({
		cells,
		rows,
		cols,
		teamCount,
		capitalPositions,
		flagBudget
	}), Math.max(6, inferCapitalSpacing(capitals)));
	const troopSep = Math.max(2, Math.floor(sep / 2));
	const markersSepBlocking = markers.filter((m) => m.type === "capital" || m.type === "flag");
	const owner = Array.from({ length: rows }, () => Array(cols).fill(-1));
	for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
		const terr = cells[r]?.[c];
		if (typeof terr !== "string" || !isPlaceableTerrain(terr) || !isFarEnoughFromHydraulicWaterForMapMarker(cells, rows, cols, r, c)) continue;
		let bestD = Infinity;
		let bestTeam = 0;
		for (const cap of capitals) {
			const d = Math.abs(r - cap.row) + Math.abs(c - cap.col);
			if (d < bestD || d === bestD && cap.team < bestTeam) {
				bestD = d;
				bestTeam = cap.team;
			}
		}
		owner[r][c] = bestTeam;
	}
	const borderByTeam = /* @__PURE__ */ new Map();
	for (let t = 0; t < teamCount; t++) borderByTeam.set(t, []);
	for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
		const t = owner[r]?.[c] ?? -1;
		if (t < 0) continue;
		if (isStrictInterTeamBorder(owner, rows, cols, r, c, t)) borderByTeam.get(t).push({
			row: r,
			col: c
		});
	}
	const primaryLens = [];
	for (let team = 0; team < teamCount; team++) primaryLens.push(borderByTeam.get(team)?.length ?? 0);
	const minPrimaryBorderLen = primaryLens.length > 0 ? Math.min(...primaryLens) : 0;
	const minDim = Math.min(rows, cols);
	const bandDepth = islandLike ? 3 : minDim >= 120 ? 5 : 4;
	const anchorDepth = islandLike ? 6 : minDim >= 120 ? 11 : 9;
	const bandsByTeam = [];
	const anchorsByTeam = [];
	for (let team = 0; team < teamCount; team++) {
		const primary = borderByTeam.get(team) ?? [];
		const coastal = collectCoastalOwnedSeedsForTeam(cells, rows, cols, owner, team, occupied, islandLike);
		const seedCells = mergeCandidateCellsUnique(primary.filter((p) => !occupied.has(cellKey(p.row, p.col))), coastal, rng);
		const band = buildFrontierBandForTeam(cells, rows, cols, owner, team, seedCells, occupied, bandDepth);
		bandsByTeam.push(band);
		const anchorSeeds = collectAdjacentAnchorSeedsForTeam(cells, rows, cols, owner, team, markers, occupied);
		shuffleInPlace(anchorSeeds, rng);
		const anchorBand = buildFrontierBandForTeam(cells, rows, cols, owner, team, anchorSeeds, occupied, anchorDepth);
		anchorsByTeam.push(anchorBand);
	}
	const minBandLen = bandsByTeam.length > 0 ? Math.min(...bandsByTeam.map((b) => b.length)) : 0;
	const minOwnedPlaceable = minOwnedPlaceableCellsPerTeam(cells, rows, cols, owner, teamCount, occupied);
	const flagCount = markers.filter((m) => m.type === "flag").length;
	const flagsPerTeam = teamCount > 0 ? flagCount / teamCount : 0;
	const targets = computeSymmetricTroopTargets(islandLike, minDim, minPrimaryBorderLen, minBandLen, minOwnedPlaceable, capitals.length, flagsPerTeam);
	let initialInfantryTarget = targets.infantry;
	let initialTankTarget = targets.tanks;
	if (initialInfantryTarget + initialTankTarget === 0) {
		if (capitals.length !== teamCount || !eachTeamHasAtLeastOneFreeOwnedPlaceableCell(cells, rows, cols, owner, teamCount, markerOccupied)) return [];
		initialInfantryTarget = 2;
		initialTankTarget = 0;
	}
	const enrichedByTeam = [];
	for (let team = 0; team < teamCount; team++) enrichedByTeam.push(mergeCandidateCellsUnique(bandsByTeam[team] ?? [], anchorsByTeam[team] ?? [], rng));
	let ti = initialInfantryTarget;
	let tt = initialTankTarget;
	let troops = [];
	for (let attempt = 0; attempt < 12; attempt++) {
		troops = placeSymmetricTroopsRoundRobin(teamCount, enrichedByTeam, cells, rows, cols, owner, ti, tt, sep, troopSep, markersSepBlocking, markers, markerOccupied, islandLike, rng);
		troops = symmetricTrimTroopMarkers(troops, teamCount, cells, rows, cols, owner, islandLike);
		const c2 = countTroopMarkersPerTeam(troops, teamCount);
		const symmetricCounts = Math.min(...c2.inf) === Math.max(...c2.inf) && Math.min(...c2.tank) === Math.max(...c2.tank);
		const hasAnyTroops = troops.length > 0;
		if (symmetricCounts && (hasAnyTroops || ti + tt === 0)) return troops;
		if (ti + tt <= 4) {
			if (troops.length > 0) return troops;
			break;
		}
		ti = Math.max(2, ti - 3);
		tt = Math.max(1, tt - 1);
	}
	if (troops.length === 0 && initialInfantryTarget + initialTankTarget > 0) {
		const fullByTeam = [];
		for (let team = 0; team < teamCount; team++) fullByTeam.push(buildAllFreeOwnedPlaceableCellsForTeam(cells, rows, cols, owner, team, markerOccupied, rng));
		const sepRel = Math.min(sep, 6);
		const troopSepRel = 2;
		const maxK = Math.min(8, initialInfantryTarget);
		for (let k = maxK; k >= 1; k -= 1) {
			const trimmed = symmetricTrimTroopMarkers(placeSymmetricTroopsRoundRobin(teamCount, fullByTeam, cells, rows, cols, owner, k, 0, sepRel, troopSepRel, markersSepBlocking, markers, markerOccupied, islandLike, rng), teamCount, cells, rows, cols, owner, islandLike);
			const c2 = countTroopMarkersPerTeam(trimmed, teamCount);
			if (Math.min(...c2.inf) === Math.max(...c2.inf) && Math.min(...c2.tank) === Math.max(...c2.tank) && trimmed.length > 0) return trimmed;
		}
	}
	return troops;
}
//#endregion
Object.defineProperty(exports, "WATER_TERRAINS", {
	enumerable: true,
	get: function() {
		return WATER_TERRAINS;
	}
});
Object.defineProperty(exports, "buildMarkersForGeneratedTerrain", {
	enumerable: true,
	get: function() {
		return buildMarkersForGeneratedTerrain;
	}
});
Object.defineProperty(exports, "buildTroopMarkersForGeneratedMap", {
	enumerable: true,
	get: function() {
		return buildTroopMarkersForGeneratedMap;
	}
});
Object.defineProperty(exports, "defaultTeamPaletteSlots", {
	enumerable: true,
	get: function() {
		return defaultTeamPaletteSlots;
	}
});
Object.defineProperty(exports, "isAllowedMapGridSize", {
	enumerable: true,
	get: function() {
		return isAllowedMapGridSize;
	}
});
