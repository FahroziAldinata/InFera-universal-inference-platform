import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { ObjectDetectionPlugin } from '../plugin';

// Mock ONNX Runtime
vi.mock('onnxruntime-web', () => {
    return {
        InferenceSession: {
            create: vi.fn().mockImplementation(async (data: any, options: any) => {
                const providers = options?.executionProviders || [];
                if (providers.includes('webgpu') && (globalThis as any).__mockMetricsWebGpuFail) {
                    throw new Error('Mock WebGPU failure');
                }
                return {
                    inputNames: ['images'],
                    outputNames: ['output0'],
                    run: vi.fn().mockResolvedValue({
                        output0: {
                            data: new Float32Array([10, 20, 30, 40, 0.9, 0.9, 0.9, 0.9]), // box coordinates + conf
                            dims: [1, 1, 8],
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
    // Mock canvas context
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
                        return {
                            data: new Uint8ClampedArray(w * h * 4),
                            width: w,
                            height: h
                        };
                    }
                };
            }
        } as any;
    }

    if (typeof globalThis.ImageData === 'undefined') {
        globalThis.ImageData = class MockImageData {
            width: number;
            height: number;
            data: Uint8ClampedArray;
            constructor(data: Uint8ClampedArray, width: number, height: number) {
                this.width = width;
                this.height = height;
                this.data = data;
            }
        } as any;
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
});

describe('Plugin Metrics & WebGPU Integration Tests (Tahap 7.5)', () => {
    const originalNavigator = globalThis.navigator;

    function mockNavigator(value: any) {
        Object.defineProperty(globalThis, 'navigator', {
            value: value,
            writable: true,
            configurable: true
        });
    }

    afterEach(() => {
        delete (globalThis as any).__mockMetricsWebGpuFail;
        Object.defineProperty(globalThis, 'navigator', {
            value: originalNavigator,
            writable: true,
            configurable: true
        });
        vi.clearAllMocks();
    });

    it('should generate metrics under WASM backend mode', async () => {
        // Force WASM mode
        const plugin = new ObjectDetectionPlugin({ preferredBackend: 'wasm' });
        await plugin.init();

        const modelFile = new File([new Uint8Array([0])], 'model.onnx');
        await plugin.loadModel(modelFile);

        // Mock input image
        const img = new ImageData(new Uint8ClampedArray(10 * 10 * 4), 10, 10);
        const result = await plugin.predict(img);

        expect(result.metrics).toBeDefined();
        expect(result.metrics?.backend).toBe('wasm');
        expect(result.metrics?.preprocessTimeMs).toBeGreaterThanOrEqual(0);
        expect(result.metrics?.inferenceTimeMs).toBeGreaterThanOrEqual(0);
        expect(result.metrics?.postprocessTimeMs).toBeGreaterThanOrEqual(0);
        expect(result.metrics?.totalTimeMs).toBe(result.executionTimeMs);
        expect(result.metrics?.fps).toBeGreaterThanOrEqual(0);
    });

    it('should generate metrics under WebGPU backend mode', async () => {
        // Mock WebGPU presence
        mockNavigator({
            gpu: {
                requestAdapter: vi.fn().mockResolvedValue({ limits: {} })
            }
        });

        const plugin = new ObjectDetectionPlugin({ preferredBackend: 'auto' });
        await plugin.init();

        const modelFile = new File([new Uint8Array([0])], 'model.onnx');
        await plugin.loadModel(modelFile);

        const img = new ImageData(new Uint8ClampedArray(10 * 10 * 4), 10, 10);
        const result = await plugin.predict(img);

        expect(result.metrics).toBeDefined();
        expect(result.metrics?.backend).toBe('webgpu');
    });

    it('should fallback to WASM backend if WebGPU session initialization throws', async () => {
        // Mock WebGPU presence
        mockNavigator({
            gpu: {
                requestAdapter: vi.fn().mockResolvedValue({ limits: {} })
            }
        });
        // WebGPU compiles fail
        (globalThis as any).__mockMetricsWebGpuFail = true;

        const plugin = new ObjectDetectionPlugin({ preferredBackend: 'webgpu' });
        await plugin.init();

        const modelFile = new File([new Uint8Array([0])], 'model.onnx');
        await plugin.loadModel(modelFile);

        const img = new ImageData(new Uint8ClampedArray(10 * 10 * 4), 10, 10);
        const result = await plugin.predict(img);

        expect(result.metrics).toBeDefined();
        // Failed WebGPU -> Graceful fallback to WASM
        expect(result.metrics?.backend).toBe('wasm');
    });

    it('should calculate metrics repeatedly without state leakages', async () => {
        const plugin = new ObjectDetectionPlugin({ preferredBackend: 'wasm' });
        await plugin.init();

        const modelFile = new File([new Uint8Array([0])], 'model.onnx');
        await plugin.loadModel(modelFile);

        const img = new ImageData(new Uint8ClampedArray(10 * 10 * 4), 10, 10);
        
        // Predict 1
        const result1 = await plugin.predict(img);
        const ts1 = result1.metrics?.timestamp || 0;

        // Predict 2
        const result2 = await plugin.predict(img);
        const ts2 = result2.metrics?.timestamp || 0;

        expect(ts2).toBeGreaterThanOrEqual(ts1);
        expect(result1.metrics?.backend).toBe('wasm');
        expect(result2.metrics?.backend).toBe('wasm');
    });
});
