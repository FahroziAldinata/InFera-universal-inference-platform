import { describe, it, expect, vi, beforeAll } from 'vitest';
import { letterboxImage } from '../letterbox';

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
                    fillRect: vi.fn(),
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

describe('letterboxImage', () => {
    it('should correctly process a landscape image', () => {
        const dummyData = new Uint8ClampedArray(100 * 50 * 4);
        const landscapeImg = new ImageData(dummyData, 100, 50);
        
        const result = letterboxImage(landscapeImg, 640, 640);
        expect(result.scale).toBe(6.4);
        expect(result.padX).toBe(0);
        expect(result.padY).toBe(160);
        expect(result.imageData.width).toBe(640);
        expect(result.imageData.height).toBe(640);
    });

    it('should correctly process a portrait image', () => {
        const dummyData = new Uint8ClampedArray(50 * 100 * 4);
        const portraitImg = new ImageData(dummyData, 50, 100);
        
        const result = letterboxImage(portraitImg, 640, 640);
        expect(result.scale).toBe(6.4);
        expect(result.padX).toBe(160);
        expect(result.padY).toBe(0);
    });

    it('should correctly process a square image', () => {
        const dummyData = new Uint8ClampedArray(100 * 100 * 4);
        const squareImg = new ImageData(dummyData, 100, 100);
        
        const result = letterboxImage(squareImg, 640, 640);
        expect(result.scale).toBe(6.4);
        expect(result.padX).toBe(0);
        expect(result.padY).toBe(0);
    });

    it('should correctly process a very small image', () => {
        const dummyData = new Uint8ClampedArray(10 * 10 * 4);
        const smallImg = new ImageData(dummyData, 10, 10);
        
        const result = letterboxImage(smallImg, 640, 640);
        expect(result.scale).toBe(64);
        expect(result.padX).toBe(0);
        expect(result.padY).toBe(0);
    });
});
