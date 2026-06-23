import type { Detection } from '../types';

export interface Point {
    x: number;
    y: number;
}

export interface Box {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Checks if a point (x, y) is inside a bounding box.
 */
export function pointInBox(px: number, py: number, box: Box): boolean {
    return px >= box.x && px <= box.x + box.width && py >= box.y && py <= box.y + box.height;
}

/**
 * Calculates the center coordinates of a bounding box.
 */
export function getBoxCenter(box: Box): Point {
    return {
        x: box.x + box.width / 2,
        y: box.y + box.height / 2,
    };
}

/**
 * Calculates the Euclidean distance from a point to the center of a box.
 */
export function distanceToBox(px: number, py: number, box: Box): number {
    const center = getBoxCenter(box);
    return Math.hypot(px - center.x, py - center.y);
}

/**
 * Finds the detection containing the point (x, y) based on spatial priority.
 * Priority rules when overlapping:
 * 1. Smallest Area (prioritizes nested objects like handbag/backpack on a person)
 * 2. Highest Confidence
 * 3. Nearest Center Point to the query coordinates
 */
export function findDetectionAtPoint(
    px: number,
    py: number,
    detections: Detection[]
): Detection | null {
    const candidates = detections.filter((det) => pointInBox(px, py, det));
    if (candidates.length === 0) return null;

    candidates.sort((a, b) => {
        // 1. Smallest Area
        const areaA = a.width * a.height;
        const areaB = b.width * b.height;
        if (Math.abs(areaA - areaB) > 1e-5) {
            return areaA - areaB;
        }

        // 2. Highest Confidence
        if (Math.abs(a.confidence - b.confidence) > 1e-5) {
            return b.confidence - a.confidence;
        }

        // 3. Nearest Center
        const distA = distanceToBox(px, py, a);
        const distB = distanceToBox(px, py, b);
        return distA - distB;
    });

    return candidates[0] || null;
}
