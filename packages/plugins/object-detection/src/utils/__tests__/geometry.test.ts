import { describe, it, expect } from 'vitest';
import { pointInBox, getBoxCenter, distanceToBox, findDetectionAtPoint } from '../geometry';
import type { Detection } from '../../types';

describe('Geometry Engine - pointInBox', () => {
    const box = { x: 10, y: 20, width: 100, height: 50 };

    it('should return true for a point inside the box', () => {
        expect(pointInBox(50, 40, box)).toBe(true);
    });

    it('should return true for a point on the boundary', () => {
        expect(pointInBox(10, 20, box)).toBe(true);
        expect(pointInBox(110, 70, box)).toBe(true);
    });

    it('should return false for a point outside the box', () => {
        expect(pointInBox(5, 40, box)).toBe(false);   // left
        expect(pointInBox(115, 40, box)).toBe(false);  // right
        expect(pointInBox(50, 15, box)).toBe(false);   // top
        expect(pointInBox(50, 75, box)).toBe(false);   // bottom
    });
});

describe('Geometry Engine - getBoxCenter', () => {
    it('should calculate the center correctly', () => {
        const box = { x: 10, y: 20, width: 100, height: 50 };
        expect(getBoxCenter(box)).toEqual({ x: 60, y: 45 });
    });
});

describe('Geometry Engine - distanceToBox', () => {
    it('should calculate the Euclidean distance to the center correctly', () => {
        const box = { x: 0, y: 0, width: 10, height: 10 }; // Center is (5, 5)
        // Distance from (5, 8) to (5, 5) is 3
        expect(distanceToBox(5, 8, box)).toBeCloseTo(3);
        // Distance from (9, 8) to (5, 5) is sqrt(4^2 + 3^2) = 5
        expect(distanceToBox(9, 8, box)).toBeCloseTo(5);
    });
});

describe('Geometry Engine - findDetectionAtPoint (Spatial Priority)', () => {
    it('should return null if no detection contains the point', () => {
        const detections: Detection[] = [
            { id: '1', classId: 0, className: 'person', confidence: 0.9, x: 0, y: 0, width: 10, height: 10 }
        ];
        expect(findDetectionAtPoint(15, 15, detections)).toBeNull();
    });

    it('should return the box if only one contains the point', () => {
        const detections: Detection[] = [
            { id: '1', classId: 0, className: 'person', confidence: 0.9, x: 0, y: 0, width: 10, height: 10 },
            { id: '2', classId: 1, className: 'car', confidence: 0.8, x: 20, y: 20, width: 10, height: 10 }
        ];
        expect(findDetectionAtPoint(5, 5, detections)).toEqual(detections[0]);
    });

    it('should prioritize the SMALLEST AREA when boxes overlap', () => {
        const detections: Detection[] = [
            // Large box (e.g., person)
            { id: '1', classId: 0, className: 'person', confidence: 0.95, x: 0, y: 0, width: 100, height: 100 },
            // Small box inside (e.g., handbag)
            { id: '2', classId: 1, className: 'handbag', confidence: 0.8, x: 10, y: 10, width: 20, height: 20 }
        ];
        // Point is inside both boxes. Handbag has area 400, person has area 10000.
        // Should select handbag because it is smaller.
        expect(findDetectionAtPoint(15, 15, detections)).toEqual(detections[1]);
    });

    it('should prioritize HIGHEST CONFIDENCE if areas are identical', () => {
        const detections: Detection[] = [
            { id: '1', classId: 0, className: 'dog', confidence: 0.7, x: 10, y: 10, width: 50, height: 50 },
            { id: '2', classId: 1, className: 'cat', confidence: 0.9, x: 10, y: 10, width: 50, height: 50 }
        ];
        // Same dimensions, different confidences. Should choose the cat (higher confidence).
        expect(findDetectionAtPoint(20, 20, detections)).toEqual(detections[1]);
    });

    it('should prioritize NEAREST CENTER if areas and confidences are identical', () => {
        const detections: Detection[] = [
            // Center is (25, 25)
            { id: '1', classId: 0, className: 'box1', confidence: 0.8, x: 0, y: 0, width: 50, height: 50 },
            // Center is (35, 35)
            { id: '2', classId: 1, className: 'box2', confidence: 0.8, x: 10, y: 10, width: 50, height: 50 }
        ];
        // Point (5, 5) is inside both.
        // Center of box1 is (25, 25) -> distance to (5,5) is sqrt(20^2 + 20^2) = 28.28
        // Center of box2 is (35, 35) -> distance to (5,5) is sqrt(30^2 + 30^2) = 42.42
        // Should select box1 because it's closer to the query point.
        expect(findDetectionAtPoint(15, 15, detections)).toEqual(detections[0]);
    });
});

describe('Geometry Engine - Stress Test with 1000 Overlapping Boxes', () => {
    it('should handle 1,000 overlapping boxes quickly and correctly', () => {
        const detections: Detection[] = [];
        // Generate 1000 overlapping detections
        for (let i = 1; i <= 1000; i++) {
            detections.push({
                id: `det_${i}`,
                classId: i % 10,
                className: `class_${i % 10}`,
                confidence: 0.5 + (i / 2000), // confidence increases with index
                x: 0,
                y: 0,
                width: 1000 - i, // area decreases with index (smallest area is the last one, i=1000)
                height: 1000 - i
            });
        }

        const tStart = performance.now();
        const selected = findDetectionAtPoint(5, 5, detections);
        const duration = performance.now() - tStart;

        console.log(`findDetectionAtPoint on 1,000 boxes took ${duration.toFixed(3)} ms`);

        // The smallest area box should be `det_1000` (width = 0, height = 0, which is technically point-in-box valid at 0, 0 but wait, x=0, y=0, w=0, h=0 doesn't contain 5,5!)
        // Wait, for query point (5, 5) to be inside the box, the width and height must be >= 5.
        // Since box width = 1000 - i, for width >= 5 we must have 1000 - i >= 5 => i <= 995.
        // So the smallest valid box containing (5, 5) is when i = 995, which has width = 5, height = 5.
        // Let's verify if `det_995` is selected.
        expect(selected).toBeDefined();
        expect(selected?.id).toBe('det_995');
        expect(duration).toBeLessThan(50); // should run well within 50ms (normally <1ms)
    });
});
