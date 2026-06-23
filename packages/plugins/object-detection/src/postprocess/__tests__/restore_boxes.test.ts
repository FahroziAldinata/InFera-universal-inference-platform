import { describe, it, expect } from 'vitest';
import { restoreBoxes } from '../restore_boxes';
import type { Detection } from '../../types';

const BASE_DET: Detection = {
    classId: 0,
    className: 'person',
    confidence: 0.9,
    x: 0,
    y: 0,
    width: 100,
    height: 100,
};

describe('restoreBoxes', () => {
    it('should restore coordinates with no padding (scale=1)', () => {
        const dets: Detection[] = [{ ...BASE_DET, x: 50, y: 60, width: 100, height: 80 }];
        const result = restoreBoxes(dets, { scale: 1, padX: 0, padY: 0, originalWidth: 1280, originalHeight: 720 });

        expect(result[0]!.x).toBeCloseTo(50);
        expect(result[0]!.y).toBeCloseTo(60);
        expect(result[0]!.width).toBeCloseTo(100);
        expect(result[0]!.height).toBeCloseTo(80);
    });

    it('should correctly undo letterbox scaling and padding', () => {
        // Scenario: 800×600 original → letterboxed to 640×640
        // scale = 640 / 800 = 0.8, padY = (640 - 600*0.8) / 2 = (640 - 480) / 2 = 80
        const scale = 0.8;
        const padX = 0;
        const padY = 80;

        // In model space: box at (0, 80) with size (640, 480) → full image
        const dets: Detection[] = [{ ...BASE_DET, x: 0, y: 80, width: 640, height: 480 }];
        const result = restoreBoxes(dets, { scale, padX, padY, originalWidth: 800, originalHeight: 600 });

        expect(result[0]!.x).toBeCloseTo(0);
        expect(result[0]!.y).toBeCloseTo(0);
        expect(result[0]!.width).toBeCloseTo(800);
        expect(result[0]!.height).toBeCloseTo(600);
    });

    it('should clamp coordinates to original image bounds', () => {
        // Box that slightly overflows model-space boundaries due to numerical imprecision
        const dets: Detection[] = [{ ...BASE_DET, x: -5, y: -5, width: 660, height: 660 }];
        const result = restoreBoxes(dets, { scale: 1, padX: 0, padY: 0, originalWidth: 640, originalHeight: 640 });

        expect(result[0]!.x).toBe(0);
        expect(result[0]!.y).toBe(0);
        expect(result[0]!.width).toBeLessThanOrEqual(640);
        expect(result[0]!.height).toBeLessThanOrEqual(640);
    });

    it('should preserve other detection fields unchanged', () => {
        const dets: Detection[] = [{ ...BASE_DET, x: 10, y: 10, confidence: 0.75, className: 'car' }];
        const result = restoreBoxes(dets, { scale: 1, padX: 0, padY: 0, originalWidth: 1280, originalHeight: 720 });

        expect(result[0]!.confidence).toBe(0.75);
        expect(result[0]!.className).toBe('car');
        expect(result[0]!.classId).toBe(0);
    });
});
