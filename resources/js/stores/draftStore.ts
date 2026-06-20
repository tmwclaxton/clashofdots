import { defineStore } from 'pinia';
import { useCameraStore } from '@/stores/cameraStore';

type Point = [number, number];

export type DraftPath = {
    entityId: number;
    points: Point[];
    waterMode?: 'wade' | 'embark';
};

export const useDraftStore = defineStore('draft', {
    state: () => ({
        draftPaths: [] as DraftPath[],
        activeDraft: null as DraftPath | null,
        /** IDs of troops currently selected via lasso. Empty = no lasso selection. */
        selectedTroopIds: [] as number[],
        /** Active line-order drawing mode. Null when no line order is in progress. */
        lineOrderMode: null as null | 'advance' | 'defend',
        /**
         * Group drag state: each troop's start position keyed by id.
         * The activeDraft is drawn for the anchor troop; all others mirror it
         * offset by the difference between their start and the anchor's start.
         */
        groupDragStarts: null as Map<number, Point> | null,
        groupDragAnchorStart: null as Point | null,
    }),
    actions: {
        reset() {
            this.draftPaths = [];
            this.activeDraft = null;
            this.selectedTroopIds = [];
            this.lineOrderMode = null;
            this.groupDragStarts = null;
            this.groupDragAnchorStart = null;
        },
        setSelection(ids: number[]) {
            this.selectedTroopIds = ids;
        },
        clearSelection() {
            this.selectedTroopIds = [];
            this.lineOrderMode = null;
        },
        setLineOrderMode(mode: 'advance' | 'defend') {
            this.lineOrderMode = mode;
        },
        clearLineOrderMode() {
            this.lineOrderMode = null;
        },
        beginPath(entityId: number, start: Point) {
            if (
                this.activeDraft !== null &&
                this.activeDraft.entityId !== entityId
            ) {
                this.finishPath();
            }

            this.activeDraft = { entityId, points: [start] };
        },
        /**
         * Begin a group drag where all troops in `starts` follow the same drawn
         * path, each offset from their own start position. The anchor troop is
         * the first entry; its path becomes `activeDraft` for live preview.
         */
        beginGroupPath(starts: Map<number, Point>) {
            this.finishPath();
            this.groupDragStarts = starts;

            const first = starts.entries().next().value as [number, Point] | undefined;
            if (!first) { return; }

            const [anchorId, anchorPos] = first;
            this.groupDragAnchorStart = anchorPos;
            this.activeDraft = { entityId: anchorId, points: [[anchorPos[0], anchorPos[1]]] };
        },
        extendPath(point: Point) {
            if (!this.activeDraft) {
                return;
            }

            const last = this.activeDraft.points.at(-1);

            if (!last) {
                return;
            }

            const dx = point[0] - last[0];
            const dy = point[1] - last[1];

            const camera = useCameraStore();
            /** ~5 CSS px in world units; a fixed world threshold is sub-pixel when zoomed out. */
            const minSeg = Math.max(2, 5 / camera.zoom);

            if (Math.hypot(dx, dy) > minSeg) {
                this.activeDraft.points.push(point);
            }
        },
        finishPath() {
            if (!this.activeDraft) {
                return;
            }

            if (this.activeDraft.points.length > 1) {
                if (this.groupDragStarts && this.groupDragAnchorStart) {
                    // Commit a translated copy of the anchor path for every troop in the group.
                    const [ax, ay] = this.groupDragAnchorStart;
                    for (const [id, troopStart] of this.groupDragStarts) {
                        const [ox, oy] = [troopStart[0] - ax, troopStart[1] - ay];
                        const translated: Point[] = this.activeDraft.points.map(
                            ([px, py]) => [px + ox, py + oy],
                        );
                        // Override the first point to be exactly the troop's own start.
                        translated[0] = [troopStart[0], troopStart[1]];
                        this.draftPaths = this.draftPaths.filter((p) => p.entityId !== id);
                        this.draftPaths.push({ entityId: id, points: translated });
                    }
                } else {
                    this.draftPaths = this.draftPaths.filter(
                        (p) => p.entityId !== this.activeDraft!.entityId,
                    );
                    this.draftPaths.push({ ...this.activeDraft });
                }
            }

            this.activeDraft = null;
            this.groupDragStarts = null;
            this.groupDragAnchorStart = null;
        },
        setWaterMode(entityId: number, mode: 'wade' | 'embark') {
            const draft = this.draftPaths.find((p) => p.entityId === entityId);

            if (draft) {
                draft.waterMode = mode;
            }
        },
        clearDrafts() {
            this.draftPaths = [];
            this.activeDraft = null;
            this.selectedTroopIds = [];
            this.lineOrderMode = null;
            this.groupDragStarts = null;
            this.groupDragAnchorStart = null;
        },
    },
});
