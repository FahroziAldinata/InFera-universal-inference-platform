import { describe, it, expect, beforeAll } from 'vitest';
import { normalizePixels } from '../normalize';

beforeAll(() => {
    if (typeof globalThis.ImageData === 'undefined') {
        globalThis.ImageData = class MockImageData {
            data: Uint8ClampedArray;
            width: number;
            height: number;
            constructor(data: Uint8ClampedArray, width: number, height: number) {
                this.data = data;
                this.width = width;
                this.height = height;
            }
        } as any;
    }
});

describe('normalizePixels', () => {
    it('should correctly normalize RGB pixel values from 0-255 to 0-1', () => {
        const dummyData = new Uint8ClampedArray([
            0, 255, 127, 255, // Pixel 1: R=0, G=255, B=127, A=255
        ]);
        const img = new ImageData(dummyData, 1, 1);
        
        const result = normalizePixels(img);
        expect(result).toBeInstanceOf(Float32Array);
        expect(result.length).toBe(3);
        
        expect(result[0]).toBe(0);
        expect(result[1]).toBe(1);
        expect(result[2]).toBeCloseTo(0.498, 3);
    });
});
