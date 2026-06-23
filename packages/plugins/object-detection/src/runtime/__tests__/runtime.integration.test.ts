import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { ObjectDetectionPlugin } from '../../plugin';

// Mock ONNX Runtime
vi.mock('onnxruntime-web', () => {
    return {
        InferenceSession: {
            create: vi.fn().mockImplementation(async (data: any, options: any) => {
                const providers = options?.executionProviders || [];
                if (providers.includes('webgpu') && (globalThis as any).__mockIntegrationWebGpuFail) {
                    throw new Error('Mock WebGPU integration failure');
                }
                return {
                    inputNames: ['images'],
                    outputNames: ['output0'],
                    run: vi.fn().mockResolvedValue({
                        output0: {
                            data: new Float32Array([10, 20, 30, 40, 0.95, 0.95, 0.95, 0.95]), // mock output tensor
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
    // Mock canvas-related globals if not present
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
});

describe('Runtime and Plugin Integration Tests (Tahap 7.5)', () => {
    const originalNavigator = globalThis.navigator;

    function mockNavigator(value: any) {
        Object.defineProperty(globalThis, 'navigator', {
            value: value,
            writable: true,
            configurable: true
        });
    }

    afterEach(() => {
        delete (globalThis as any).__mockIntegrationWebGpuFail;
        Object.defineProperty(globalThis, 'navigator', {
            value: originalNavigator,
            writable: true,
            configurable: true
        });
        vi.clearAllMocks();
    });

    it('should perform inference under WASM backend successfully', async () => {
        const plugin = new ObjectDetectionPlugin({ preferredBackend: 'wasm' });
        await plugin.init();

        const modelFile = new File([new Uint8Array([1, 2, 3])], 'model.onnx');
        await plugin.loadModel(modelFile);

        const img = new ImageData(new Uint8ClampedArray(10 * 10 * 4), 10, 10);
        const result = await plugin.predict(img);

        expect(result).toBeDefined();
        expect(result.metrics).toBeDefined();
        expect(result.metrics?.backend).toBe('wasm');
        expect(result.executionTimeMs).toBeGreaterThan(0);
    });

    it('should perform inference under WebGPU backend successfully', async () => {
        mockNavigator({
            gpu: {
                requestAdapter: vi.fn().mockResolvedValue({ limits: {} })
            }
        });

        const plugin = new ObjectDetectionPlugin({ preferredBackend: 'auto' });
        await plugin.init();

        const modelFile = new File([new Uint8Array([1, 2, 3])], 'model.onnx');
        await plugin.loadModel(modelFile);

        const img = new ImageData(new Uint8ClampedArray(10 * 10 * 4), 10, 10);
        const result = await plugin.predict(img);

        expect(result).toBeDefined();
        expect(result.metrics).toBeDefined();
        expect(result.metrics?.backend).toBe('webgpu');
    });

    it('should gracefully fallback to WASM when WebGPU fails', async () => {
        mockNavigator({
            gpu: {
                requestAdapter: vi.fn().mockResolvedValue({ limits: {} })
            }
        });
        // Mock error on WebGPU creation
        (globalThis as any).__mockIntegrationWebGpuFail = true;

        const plugin = new ObjectDetectionPlugin({ preferredBackend: 'webgpu' });
        await plugin.init();

        const modelFile = new File([new Uint8Array([1, 2, 3])], 'model.onnx');
        await plugin.loadModel(modelFile);

        const img = new ImageData(new Uint8ClampedArray(10 * 10 * 4), 10, 10);
        const result = await plugin.predict(img);

        expect(result).toBeDefined();
        expect(result.metrics).toBeDefined();
        expect(result.metrics?.backend).toBe('wasm'); // Fallback to wasm
    });

    it('should not generate metrics when enableMetrics is disabled', async () => {
        const plugin = new ObjectDetectionPlugin({
            preferredBackend: 'wasm',
            enableMetrics: false
        });
        await plugin.init();

        const modelFile = new File([new Uint8Array([1, 2, 3])], 'model.onnx');
        await plugin.loadModel(modelFile);

        const img = new ImageData(new Uint8ClampedArray(10 * 10 * 4), 10, 10);
        const result = await plugin.predict(img);

        expect(result).toBeDefined();
        expect(result.metrics).toBeUndefined(); // Metrics should be disabled
        expect(result.executionTimeMs).toBeGreaterThan(0);
    });

    it('should perform repeated inferences without leakage and with valid timestamps', async () => {
        const plugin = new ObjectDetectionPlugin({ preferredBackend: 'wasm' });
        await plugin.init();

        const modelFile = new File([new Uint8Array([1, 2, 3])], 'model.onnx');
        await plugin.loadModel(modelFile);

        const img = new ImageData(new Uint8ClampedArray(10 * 10 * 4), 10, 10);

        // First Inference
        const result1 = await plugin.predict(img);
        const time1 = result1.metrics?.timestamp || 0;

        // Second Inference
        const result2 = await plugin.predict(img);
        const time2 = result2.metrics?.timestamp || 0;

        expect(time2).toBeGreaterThanOrEqual(time1);
        expect(result1.metrics?.backend).toBe('wasm');
        expect(result2.metrics?.backend).toBe('wasm');
    });
});
