import { describe, it, expect } from 'vitest';
import { calculateIoU } from '../iou';
import type { BoundingBox } from '../../types';

function box(x: number, y: number, w: number, h: number): BoundingBox {
    return { x, y, width: w, height: h, centerX: x + w / 2, centerY: y + h / 2 };
}

describe('calculateIoU', () => {
    it('should return 1.0 for identical boxes', () => {
        expect(calculateIoU(box(0, 0, 100, 100), box(0, 0, 100, 100))).toBeCloseTo(1.0);
    });

    it('should return 0.0 for non-overlapping boxes', () => {
        expect(calculateIoU(box(0, 0, 50, 50), box(100, 100, 50, 50))).toBeCloseTo(0.0);
    });

    it('should return 0.0 for adjacent (touching) boxes', () => {
        expect(calculateIoU(box(0, 0, 50, 50), box(50, 0, 50, 50))).toBeCloseTo(0.0);
    });

    it('should return correct value for 50% overlap', () => {
        // box A [0,0,100,100] and box B [50,0,100,100] share 50x100 area
        const a = box(0, 0, 100, 100);
        const b = box(50, 0, 100, 100);
        const iou = calculateIoU(a, b);
        // intersection = 50*100 = 5000, union = 10000 + 10000 - 5000 = 15000
        expect(iou).toBeCloseTo(5000 / 15000);
    });

    it('should handle contained boxes (one box fully inside another)', () => {
        const outer = box(0, 0, 100, 100);
        const inner = box(25, 25, 50, 50);
        const iou = calculateIoU(outer, inner);
        // intersection = 50*50 = 2500, union = 10000 + 2500 - 2500 = 10000
        expect(iou).toBeCloseTo(2500 / 10000);
    });
});
