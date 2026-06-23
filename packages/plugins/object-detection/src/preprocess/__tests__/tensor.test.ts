import { describe, it, expect } from 'vitest';
import { toCHWTensor } from '../tensor';

describe('toCHWTensor', () => {
    it('should correctly convert HWC format to CHW format', () => {
        // 2x1 image (2 pixels, 3 channels)
        // Pixel 0: R=0.1, G=0.2, B=0.3
        // Pixel 1: R=0.4, G=0.5, B=0.6
        const hwc = new Float32Array([
            0.1, 0.2, 0.3,
            0.4, 0.5, 0.6
        ]);
        
        const result = toCHWTensor(hwc, 2, 1);
        expect(result.length).toBe(6);
        
        // Expected CHW: R channel first, then G, then B
        // R channels: [0.1, 0.4]
        // G channels: [0.2, 0.5]
        // B channels: [0.3, 0.6]
        // Expected flat output: [0.1, 0.4, 0.2, 0.5, 0.3, 0.6]
        expect(result[0]).toBeCloseTo(0.1);
        expect(result[1]).toBeCloseTo(0.4);
        expect(result[2]).toBeCloseTo(0.2);
        expect(result[3]).toBeCloseTo(0.5);
        expect(result[4]).toBeCloseTo(0.3);
        expect(result[5]).toBeCloseTo(0.6);
    });
});
