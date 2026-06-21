type Point = [number, number];

const MIN_SEGMENT = 8;
const MAX_POINTS = 48;

/** Match server-side {@see PathOrderSimplifier} so payloads stay small. */
export function simplifyOrderPath(points: Point[]): Point[] {
    if (points.length === 0) {
        return [];
    }

    if (points.length === 1) {
        return [[points[0][0], points[0][1]]];
    }

    const reduced: Point[] = [[points[0][0], points[0][1]]];
    let lastKept = reduced[0];

    for (let i = 1; i < points.length - 1; i++) {
        const point = points[i];
        const dx = point[0] - lastKept[0];
        const dy = point[1] - lastKept[1];

        if (Math.hypot(dx, dy) >= MIN_SEGMENT) {
            lastKept = [point[0], point[1]];
            reduced.push(lastKept);
        }
    }

    reduced.push([
        points[points.length - 1][0],
        points[points.length - 1][1],
    ]);

    let current = reduced;

    while (current.length > MAX_POINTS) {
        const decimated: Point[] = [current[0]];

        for (let i = 1; i < current.length - 1; i++) {
            if (i % 2 === 0) {
                decimated.push(current[i]);
            }
        }

        decimated.push(current[current.length - 1]);
        current = decimated;
    }

    return current;
}
