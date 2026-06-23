import { describe, it, expect, vi, beforeAll } from 'vitest';
import { fileToImageData } from '../image_data';

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

    if (typeof globalThis.createImageBitmap === 'undefined') {
        globalThis.createImageBitmap = async (input: any) => {
            return {
                width: 100,
                height: 100,
                close: vi.fn(),
            } as any;
        };
    }

    if (typeof globalThis.HTMLImageElement === 'undefined') {
        globalThis.HTMLImageElement = class MockHTMLImageElement {
            complete = true;
            width = 100;
            height = 100;
        } as any;
    }

    if (typeof globalThis.ImageBitmap === 'undefined') {
        globalThis.ImageBitmap = class MockImageBitmap {} as any;
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

describe('fileToImageData', () => {
    it('should successfully decode a mock File into ImageData', async () => {
        const file = new File([], 'test.jpg', { type: 'image/jpeg' });
        const result = await fileToImageData(file);
        expect(result.width).toBe(100);
        expect(result.height).toBe(100);
        expect(result.data).toBeInstanceOf(Uint8ClampedArray);
        expect(result.data.length).toBe(100 * 100 * 4);
    });

    it('should successfully decode a mock ImageBitmap into ImageData', async () => {
        const mockBitmap = {
            width: 50,
            height: 50,
            close: vi.fn(),
        } as unknown as ImageBitmap;

        const result = await fileToImageData(mockBitmap);
        expect(result.width).toBe(50);
        expect(result.height).toBe(50);
    });
});
