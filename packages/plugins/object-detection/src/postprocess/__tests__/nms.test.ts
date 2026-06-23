import { describe, it, expect } from 'vitest';
import { nonMaxSuppression } from '../nms';
import type { Detection } from '../../types';

function det(
    id: number,
    x: number,
    y: number,
    w: number,
    h: number,
    conf: number,
    classId: number = 0
): Detection {
    return { classId, className: `class_${classId}`, confidence: conf, x, y, width: w, height: h };
}

describe('nonMaxSuppression', () => {
    it('should keep the single highest-confidence box when two boxes heavily overlap', () => {
        const dets = [
            det(0, 10, 10, 100, 100, 0.9),
            det(1, 12, 12, 100, 100, 0.8), // >0.45 IoU with above
        ];
        const result = nonMaxSuppression(dets, 0.45);
        expect(result.length).toBe(1);
        expect(result[0]!.confidence).toBe(0.9);
    });

    it('should keep both boxes when they do not overlap', () => {
        const dets = [
            det(0, 0, 0, 50, 50, 0.9),
            det(1, 200, 200, 50, 50, 0.8),
        ];
        const result = nonMaxSuppression(dets, 0.45);
        expect(result.length).toBe(2);
    });

    it('should keep boxes of different classes even when they overlap (class-aware)', () => {
        const dets = [
            det(0, 10, 10, 100, 100, 0.9, 0), // class 0
            det(1, 12, 12, 100, 100, 0.8, 1), // class 1 — same location
        ];
        const result = nonMaxSuppression(dets, 0.45, { classAgnostic: false });
        expect(result.length).toBe(2);
    });

    it('should suppress across classes when classAgnostic=true', () => {
        const dets = [
            det(0, 10, 10, 100, 100, 0.9, 0), // class 0
            det(1, 12, 12, 100, 100, 0.8, 1), // class 1 — overlapping
        ];
        const result = nonMaxSuppression(dets, 0.45, { classAgnostic: true });
        expect(result.length).toBe(1);
    });

    it('should respect maxDetections limit', () => {
        const dets = [
            det(0, 0, 0, 10, 10, 0.9),
            det(1, 100, 0, 10, 10, 0.8),
            det(2, 200, 0, 10, 10, 0.7),
            det(3, 300, 0, 10, 10, 0.6),
        ];
        const result = nonMaxSuppression(dets, 0.45, { maxDetections: 2 });
        expect(result.length).toBe(2);
        // Should keep the top-2 by confidence
        expect(result[0]!.confidence).toBe(0.9);
        expect(result[1]!.confidence).toBe(0.8);
    });

    it('should return empty array for empty input', () => {
        expect(nonMaxSuppression([], 0.45)).toEqual([]);
    });
});
