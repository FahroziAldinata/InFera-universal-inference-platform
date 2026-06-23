import { describe, it, expect, vi, beforeAll } from 'vitest';
import { ObjectDetectionPlugin } from '../plugin';
import { DEFAULT_CONFIG } from '../constants';
import type { PreprocessResult } from '../types';

vi.mock('onnxruntime-web', () => {
    return {
        InferenceSession: {
            create: vi.fn().mockImplementation(async (data: any, options: any) => {
                return {
                    inputNames: ['images'],
                    outputNames: ['output0'],
                    run: vi.fn().mockResolvedValue({
                        output0: {
                            data: new Float32Array([0.1, 0.2, 0.3]),
                            dims: [1, 3],
                            type: 'float32',
                        },
                    }),
                    release: vi.fn(),
                };
            }),
        },
        Tensor: class MockTensor {
            data: any;
            dims: number[];
            type: string;
            constructor(type: string, data: any, dims: number[]) {
                this.type = type;
                this.data = data;
                this.dims = dims;
            }
        },
    };
});

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
                    fillRect: vi.fn(),
                    fillStyle: '',
                    putImageData: vi.fn(),
                    getImageData: (x: number, y: number, w: number, h: number) => {
                        const data = new Uint8ClampedArray(w * h * 4);
                        // Fill dummy data: R=100, G=150, B=200
                        for (let i = 0; i < w * h; i++) {
                            data[i * 4] = 100;
                            data[i * 4 + 1] = 150;
                            data[i * 4 + 2] = 200;
                            data[i * 4 + 3] = 255;
                        }
                        return {
                            data,
                            width: w,
                            height: h,
                        };
                    },
                };
            }
            // Put ImageData mock helper
            putImageData() {}
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

describe('ObjectDetectionPlugin', () => {
    it('should initialize with default config', () => {
        const plugin = new ObjectDetectionPlugin();
        expect(plugin.id).toBe('object-detection');
        expect(plugin.name).toBe('Object Detection');
    });

    it('should allow custom configuration', () => {
        const plugin = new ObjectDetectionPlugin({
            confidenceThreshold: 0.5,
            normalize: false
        });
        // Config is private, but we can verify it builds and behaves as expected
        expect(plugin).toBeDefined();
    });

    it('should parse labels correctly', () => {
        const plugin = new ObjectDetectionPlugin();
        plugin.loadLabels('person\nbicycle\ncar\n');
        // Internal labels is private, but loadLabels runs without error
    });

    it('should set and validate input shape', () => {
        const plugin = new ObjectDetectionPlugin();
        plugin.setInputShape([1, 3, 320, 320]);
        
        expect(() => {
            plugin.setInputShape([3, 320, 320]); // Invalid dimension count
        }).toThrow();
    });

    it('should execute the preprocess pipeline successfully', async () => {
        const plugin = new ObjectDetectionPlugin();
        plugin.setInputShape([1, 3, 640, 640]);

        const file = new File([], 'test.jpg', { type: 'image/jpeg' });
        
        // Run preprocessing
        const result = await plugin.preprocess(file) as PreprocessResult;

        // Check outputs
        expect(result.dims).toEqual([1, 3, 640, 640]);
        expect(result.type).toBe('float32');
        expect(result.originalWidth).toBe(100); // from createImageBitmap mock
        expect(result.originalHeight).toBe(100);
        expect(result.inputWidth).toBe(640);
        expect(result.inputHeight).toBe(640);

        // Check scale and padding calculations
        // scale = Math.min(640/100, 640/100) = 6.4
        // newW = 100 * 6.4 = 640, newH = 100 * 6.4 = 640
        // padX = 0, padY = 0
        expect(result.scale).toBeCloseTo(6.4);
        expect(result.padX).toBeCloseTo(0);
        expect(result.padY).toBeCloseTo(0);

        // Verify CHW Float32Array format and values
        // Our mock OffscreenCanvas fills with R=100, G=150, B=200
        // normalized values should be R=100/255=0.392, G=150/255=0.588, B=200/255=0.784
        const totalPixels = 640 * 640;
        expect(result.data.length).toBe(totalPixels * 3);
        expect(result.data[0]).toBeCloseTo(100 / 255); // R channel first element
        expect(result.data[totalPixels]).toBeCloseTo(150 / 255); // G channel first element
        expect(result.data[totalPixels * 2]).toBeCloseTo(200 / 255); // B channel first element
    });

    it('should skip normalization if config.normalize is false', async () => {
        const plugin = new ObjectDetectionPlugin({ normalize: false });
        plugin.setInputShape([1, 3, 640, 640]);

        const file = new File([], 'test.jpg', { type: 'image/jpeg' });
        const result = await plugin.preprocess(file) as PreprocessResult;

        const totalPixels = 640 * 640;
        expect(result.data[0]).toBe(100); // R channel unnormalized
        expect(result.data[totalPixels]).toBe(150); // G channel unnormalized
        expect(result.data[totalPixels * 2]).toBe(200); // B channel unnormalized
    });

    it('should load model successfully', async () => {
        const plugin = new ObjectDetectionPlugin();
        const file = new File([], 'test.onnx');
        await expect(plugin.loadModel(file)).resolves.not.toThrow();
    });

    it('should throw error on predict if model is not loaded', async () => {
        const plugin = new ObjectDetectionPlugin();
        const file = new File([], 'test.jpg', { type: 'image/jpeg' });
        await expect(plugin.predict(file)).rejects.toThrow('Model belum dimuat. Panggil loadModel() terlebih dahulu.');
    });

    it('should execute predict pipeline successfully when model is loaded', async () => {
        const plugin = new ObjectDetectionPlugin();
        const modelFile = new File([], 'test.onnx');
        await plugin.loadModel(modelFile);

        const file = new File([], 'test.jpg', { type: 'image/jpeg' });
        const result = await plugin.predict(file);

        expect(result.pluginId).toBe('object-detection');
        expect(result.data.detections).toEqual([]);
    });
});
