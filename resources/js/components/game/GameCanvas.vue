<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useIsDark } from '@/composables/useIsDark';
import {
    editorBlendedTerrainFillStyle,
    editorTerrainDimOverlayFill,
    ENGINE_FOREST_THRESHOLD,
    engineCellFillStyle,
} from '@/lib/terrainRender';
import {
    GAME_VIEW_ZOOM_MAX,
    GAME_VIEW_ZOOM_MIN,
    useGameStore,
} from '@/stores/gameStore';

const props = withDefaults(
    defineProps<{
        readOnly?: boolean;
        /** When set, orders trigger an immediate snapshot pull (covers missing Reverb). */
        snapshotFetchUrl?: string;
    }>(),
    { readOnly: false, snapshotFetchUrl: '' },
);

const canvasRef = ref<HTMLCanvasElement | null>(null);
const store = useGameStore();
const { isDark } = useIsDark();

let dragging = false;
let panning = false;
let lastMouse: [number, number] = [0, 0];
let terrainCanvas: HTMLCanvasElement | null = null;
let resizeObserver: ResizeObserver | null = null;

/** One-shot fit when a match snapshot first fills the store (per game uuid). */
const initialFitDone = ref(false);

function tryInitialCameraFit(): void {
    if (initialFitDone.value || !store.initialized) {
        return;
    }

    const canvas = canvasRef.value;

    if (!canvas) {
        return;
    }

    const r = canvas.getBoundingClientRect();

    if (r.width < 16 || r.height < 16) {
        return;
    }

    store.fitCameraToView(r.width, r.height);
    initialFitDone.value = true;
    bakeTerrain();
    draw();
}

function canvasInk(): string {
    return getComputedStyle(document.documentElement)
        .getPropertyValue('--wod-canvas-ink')
        .trim() || (isDark.value ? '#f7f1e3' : '#1a1a1a');
}

function canvasField(): string {
    return getComputedStyle(document.documentElement)
        .getPropertyValue('--wod-canvas-field')
        .trim() || (isDark.value ? '#2a3520' : '#c8d68a');
}

function terrainCellsMatchGrid(cells: string[][], terrain: number[][]): boolean {
    if (cells.length === 0 || terrain.length === 0) {
        return false;
    }

    const t0 = terrain[0];

    if (!t0?.length) {
        return false;
    }

    return cells.length === terrain.length && cells[0]?.length === t0.length;
}

function bakeTerrain() {
    if (!store.terrain || !store.forest || !terrainCanvas) {
        return;
    }

    const ctx = terrainCanvas.getContext('2d');

    if (!ctx) {
        return;
    }

    const { width, height, cellSize } = store.world;
    terrainCanvas.width = width;
    terrainCanvas.height = height;

    const cells = store.terrainCells;
    const useEditorStyle =
        cells !== null && terrainCellsMatchGrid(cells, store.terrain);

    for (let y = 0; y < height; y += cellSize) {
        for (let x = 0; x < width; x += cellSize) {
            const gx = Math.min(store.terrain.length - 1, Math.floor(x / cellSize));
            const gy = Math.min(store.terrain[0].length - 1, Math.floor(y / cellSize));

            if (useEditorStyle && cells) {
                ctx.fillStyle = editorBlendedTerrainFillStyle(cells, gx, gy);
            } else {
                const tv = store.terrain[gx][gy];
                const fv = store.forest[gx][gy];
                ctx.fillStyle = engineCellFillStyle(tv, fv);
            }

            ctx.fillRect(x, y, cellSize + 1, cellSize + 1);
        }
    }

    if (useEditorStyle) {
        ctx.fillStyle = editorTerrainDimOverlayFill(isDark.value);
        ctx.fillRect(0, 0, width, height);
    }
}

function screenToWorld(x: number, y: number): [number, number] {
    const z = store.zoom;

    return [x / z - store.camX, y / z - store.camY];
}

function draw() {
    const canvas = canvasRef.value;

    if (!canvas) {
        return;
    }

    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return;
    }

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    ctx.fillStyle = canvasField();
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.save();
    ctx.scale(store.zoom, store.zoom);
    ctx.translate(store.camX, store.camY);

    if (terrainCanvas) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(terrainCanvas, 0, 0);
    }

    const state = store.latestState;

    if (state) {
        drawFog(ctx, state.vision);
        drawBorders(ctx, state.border);
        drawBorderStrokes(ctx, state.border);
    }

    for (const city of state?.cities ?? store.cityPositions.map((p, i) => ({
        position: p,
        id: i,
        ownerColor: null,
        ownerSlot: null,
        path: [],
        markerType: null as string | null,
    }))) {
        drawCity(ctx, city.position, city.ownerColor, city.markerType);
    }

    for (const troop of state?.troops ?? []) {
        drawTroop(ctx, troop);
    }

    for (const draft of store.draftPaths) {
        drawArrowPath(ctx, draft.points);
    }

    if (store.activeDraft) {
        drawArrowPath(ctx, store.activeDraft.points, true);
    }

    ctx.restore();
}

function drawFog(ctx: CanvasRenderingContext2D, vision: number[][]) {
    const { cellSize } = store.world;
    ctx.fillStyle = 'rgba(20, 18, 14, 0.72)';

    for (let gy = 0; gy < vision[0].length - 1; gy++) {
        for (let gx = 0; gx < vision.length - 1; gx++) {
            const v = vision[gx][gy];

            if (v < ENGINE_FOREST_THRESHOLD) {
                ctx.fillRect(gx * cellSize, gy * cellSize, cellSize, cellSize);
            }
        }
    }
}

function drawBorders(ctx: CanvasRenderingContext2D, border: number[][]) {
    const { cellSize } = store.world;
    ctx.fillStyle = 'rgba(241, 196, 15, 0.08)';

    for (let gy = 0; gy < border[0].length - 1; gy++) {
        for (let gx = 0; gx < border.length - 1; gx++) {
            if (border[gx][gy] > 0.35) {
                ctx.fillRect(gx * cellSize, gy * cellSize, cellSize, cellSize);
            }
        }
    }
}

function drawBorderStrokes(ctx: CanvasRenderingContext2D, border: number[][]) {
    if (!border.length || !border[0]?.length) {
        return;
    }

    const { cellSize } = store.world;
    const thr = 0.35;
    const w = border.length;
    const h = border[0].length;

    const hi = (gx: number, gy: number): boolean => {
        if (gx < 0 || gy < 0 || gx >= w || gy >= h) {
            return false;
        }

        return border[gx][gy] > thr;
    };

    ctx.save();
    ctx.strokeStyle = 'rgba(241, 196, 15, 0.42)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let gy = 0; gy < h; gy++) {
        for (let gx = 0; gx < w; gx++) {
            if (!hi(gx, gy)) {
                continue;
            }

            const x = gx * cellSize;
            const y = gy * cellSize;
            const strength = border[gx][gy];

            if (!hi(gx, gy - 1)) {
                ctx.moveTo(x, y);
                ctx.lineTo(x + cellSize, y);
            }

            if (!hi(gx, gy + 1)) {
                ctx.moveTo(x, y + cellSize);
                ctx.lineTo(x + cellSize, y + cellSize);
            }

            if (!hi(gx - 1, gy)) {
                ctx.moveTo(x, y);
                ctx.lineTo(x, y + cellSize);
            }

            if (!hi(gx + 1, gy)) {
                ctx.moveTo(x + cellSize, y);
                ctx.lineTo(x + cellSize, y + cellSize);
            }

            if (strength > 0.72 && (gx + gy) % 3 === 0) {
                const jx = ((gx * 47 + gy * 13) % 5) - 2;
                const jy = ((gx * 19 + gy * 59) % 5) - 2;
                ctx.moveTo(x + cellSize * 0.2 + jx, y + cellSize * 0.2 + jy);
                ctx.lineTo(x + cellSize * 0.85 + jx, y + cellSize * 0.85 + jy);
            }
        }
    }

    ctx.stroke();
    ctx.restore();
}

function drawCity(
    ctx: CanvasRenderingContext2D,
    position: [number, number],
    color: number[] | null,
    markerType?: string | null,
) {
    const [x, y] = position;
    ctx.fillStyle = color ? rgb(color) : '#f1c40f';

    if (markerType === 'capital') {
        const s = 14;
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
        ctx.strokeStyle = canvasInk();
        ctx.lineWidth = 1;
        ctx.strokeRect(x - s / 2, y - s / 2, s, s);

        return;
    }

    ctx.beginPath();

    for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        const px = x + Math.cos(angle) * 8;
        const py = y + Math.sin(angle) * 8;

        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }

    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = canvasInk();
    ctx.lineWidth = 1;
    ctx.stroke();
}

type TroopDraw = {
    position: [number, number];
    color: number[];
    health: number;
    morale?: number;
};

function drawTroop(ctx: CanvasRenderingContext2D, troop: TroopDraw) {
    const [x, y] = troop.position;
    const morale = troop.morale ?? 100;
    ctx.fillStyle = rgb(troop.color);
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = canvasInk();
    ctx.lineWidth = 1;
    ctx.stroke();

    if (troop.health < 100) {
        ctx.fillStyle = canvasInk();
        ctx.fillRect(x - 8, y - 14, 16, 3);
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(x - 8, y - 14, (16 * troop.health) / 100, 3);
    }

    if (morale < 99) {
        ctx.fillStyle = canvasInk();
        ctx.fillRect(x - 8, y - 10, 16, 2);
        ctx.fillStyle = '#8e44ad';
        ctx.fillRect(x - 8, y - 10, (16 * morale) / 100, 2);
    }
}

function drawArrowPath(ctx: CanvasRenderingContext2D, points: [number, number][], dashed = false) {
    if (points.length < 2) {
        return;
    }

    ctx.strokeStyle = canvasInk();
    ctx.lineWidth = 2;
    ctx.setLineDash(dashed ? [6, 4] : []);

    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);

    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
    }

    ctx.stroke();
    ctx.setLineDash([]);

    const last = points.at(-1)!;
    const prev = points.at(-2)!;
    const angle = Math.atan2(last[1] - prev[1], last[0] - prev[0]);
    ctx.beginPath();
    ctx.moveTo(last[0], last[1]);
    ctx.lineTo(last[0] - Math.cos(angle - 0.4) * 10, last[1] - Math.sin(angle - 0.4) * 10);
    ctx.moveTo(last[0], last[1]);
    ctx.lineTo(last[0] - Math.cos(angle + 0.4) * 10, last[1] - Math.sin(angle + 0.4) * 10);
    ctx.stroke();
}

function rgb(color: number[]): string {
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

function findEntity(world: [number, number]): { id: number; kind: 'troop' | 'city' } | null {
    const state = store.latestState;

    if (!state) {
        return null;
    }

    /** World radius so the pick target is at least ~22 CSS px (fixed radii vanish when zoomed out). */
    const z = store.zoom;
    const troopPickR = Math.max(12, 22 / z);
    const cityPickR = Math.max(14, 22 / z);

    for (const troop of state.troops) {
        if (troop.ownerSlot !== store.slot) {
            continue;
        }

        const dx = troop.position[0] - world[0];
        const dy = troop.position[1] - world[1];

        if (Math.hypot(dx, dy) < troopPickR) {
            return { id: troop.id, kind: 'troop' };
        }
    }

    for (const city of state.cities) {
        if (city.ownerSlot !== store.slot) {
            continue;
        }

        const dx = city.position[0] - world[0];
        const dy = city.position[1] - world[1];

        if (Math.hypot(dx, dy) < cityPickR) {
            return { id: city.id, kind: 'city' };
        }
    }

    return null;
}

function onMouseDown(e: MouseEvent) {
    const canvas = canvasRef.value;

    if (!canvas) {
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    lastMouse = [sx, sy];

    if (e.button === 2) {
        panning = true;

        return;
    }

    if (props.readOnly) {
        return;
    }

    const world = screenToWorld(sx, sy);
    const entity = findEntity(world);

    if (entity) {
        dragging = true;
        store.beginPath(entity.id, entity.kind, world);
    }
}

function onMouseMove(e: MouseEvent) {
    const canvas = canvasRef.value;

    if (!canvas) {
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (panning) {
        store.camX += (sx - lastMouse[0]) / store.zoom;
        store.camY += (sy - lastMouse[1]) / store.zoom;
        lastMouse = [sx, sy];
        draw();

        return;
    }

    if (dragging) {
        store.extendPath(screenToWorld(sx, sy));
        draw();
    }
}

function onMouseUp() {
    if (dragging) {
        store.finishPath();
        dragging = false;
        draw();
    }

    panning = false;
}

function onWheel(e: WheelEvent) {
    e.preventDefault();

    const canvas = canvasRef.value;

    if (!canvas) {
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const [wx, wy] = screenToWorld(sx, sy);
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const prevZoom = store.zoom;
    const nextZoom = Math.min(GAME_VIEW_ZOOM_MAX, Math.max(GAME_VIEW_ZOOM_MIN, prevZoom * factor));

    if (nextZoom === prevZoom) {
        draw();

        return;
    }

    store.zoom = nextZoom;
    store.camX = sx / nextZoom - wx;
    store.camY = sy / nextZoom - wy;
    draw();
}

function onKeyDown(e: KeyboardEvent) {
    if (props.readOnly) {
        return;
    }

    if (e.code === 'Space') {
        e.preventDefault();
        const url = props.snapshotFetchUrl?.trim() ?? '';

        store.submitOrders(
            store.gameUuid,
            url.length > 0 ? { snapshotFetchUrl: url } : undefined,
        );
    }

    if (e.key.toLowerCase() === 'c') {
        store.clearDrafts();
        draw();
    }
}

onMounted(() => {
    terrainCanvas = document.createElement('canvas');
    window.addEventListener('keydown', onKeyDown);

    const canvas = canvasRef.value;

    if (canvas) {
        resizeObserver = new ResizeObserver(() => {
            tryInitialCameraFit();
        });
        resizeObserver.observe(canvas);
    }

    tryInitialCameraFit();
    draw();
});

onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown);
    resizeObserver?.disconnect();
    resizeObserver = null;
});

watch(
    () => store.gameUuid,
    () => {
        initialFitDone.value = false;
        nextTick(() => tryInitialCameraFit());
    },
);

watch(
    () => [store.initialized, store.world.width, store.world.height],
    () => {
        nextTick(() => tryInitialCameraFit());
    },
);

watch(
    () => [store.terrain, store.forest, store.terrainCells, store.latestState, store.draftPaths, store.activeDraft],
    () => {
        bakeTerrain();
        draw();
    },
    { deep: true },
);

watch(isDark, () => {
    draw();
});
</script>

<template>
    <canvas
        ref="canvasRef"
        class="h-full w-full cursor-crosshair touch-none"
        @contextmenu.prevent
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseUp"
        @wheel="onWheel"
    />
</template>
