import { describe, it, expect, vi, beforeAll } from 'vitest';
import { resizeImage } from '../resize';

beforeAll(() => {
    if (typeof globalThis.OffscreenCanvas === 'undefined') {
        globalThis.OffscreenCanvas = class MockOffscreenCanvas {
            width: number;
            height: number;
            constructor(width: number, height: number) {
                this.width = width;
                this.height = height;
            }
            getContext() {
                return {
                    drawImage: vi.fn(),
                    putImageData: vi.fn(),
                    getImageData: (x: number, y: number, w: number, h: number) => {
                        return {
                            data: new Uint8ClampedArray(w * h * 4),
                            width: w,
                            height: h,
                        };
                    },
                };
            }
        } as any;
    }
    
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

describe('resizeImage', () => {
    it('should successfully resize ImageData to target dimensions', () => {
        const dummyData = new Uint8ClampedArray(10 * 10 * 4);
        const originalImage = new ImageData(dummyData, 10, 10);
        
        const result = resizeImage(originalImage, 20, 30);
        expect(result.width).toBe(20);
        expect(result.height).toBe(30);
        expect(result.imageData.width).toBe(20);
        expect(result.imageData.height).toBe(30);
    });
});
