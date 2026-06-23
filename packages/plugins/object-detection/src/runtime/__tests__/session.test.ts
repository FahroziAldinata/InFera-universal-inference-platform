import { describe, it, expect, vi, afterEach } from 'vitest';
import * as ort from 'onnxruntime-web';
import { loadModel, createSession, disposeSession, getSessionInfo, createSessionWithFallback } from '../session';

vi.mock('onnxruntime-web', () => {
    return {
        InferenceSession: {
            create: vi.fn().mockImplementation(async (data: any, options: any) => {
                const providers = options?.executionProviders || [];
                if (providers.includes('webgpu') && (globalThis as any).__mockWebGpuFail) {
                    throw new Error('Mock WebGPU creation error');
                }
                return {
                    inputNames: ['images'],
                    outputNames: ['output0'],
                    release: vi.fn(),
                };
            }),
        },
    };
});

describe('Session Manager with WebGPU Fallback (Tahap 7.2)', () => {
    const originalNavigator = globalThis.navigator;

    function mockNavigator(value: any) {
        Object.defineProperty(globalThis, 'navigator', {
            value: value,
            writable: true,
            configurable: true
        });
    }

    afterEach(() => {
        // Reset mocks & global configs
        delete (globalThis as any).__mockWebGpuFail;
        Object.defineProperty(globalThis, 'navigator', {
            value: originalNavigator,
            writable: true,
            configurable: true
        });
        vi.clearAllMocks();
    });

    it('should load a file into a Uint8Array', async () => {
        const file = new File([new Uint8Array([1, 2, 3])], 'model.onnx');
        const data = await loadModel(file);
        expect(data).toBeInstanceOf(Uint8Array);
        expect(data.length).toBe(3);
        expect(data[0]).toBe(1);
    });

    it('should create a session with execution providers', async () => {
        const data = new Uint8Array([1, 2, 3]);
        const session = await createSession(data, ['wasm']);
        
        expect(ort.InferenceSession.create).toHaveBeenCalledWith(data, {
            executionProviders: ['wasm'],
        });
        expect(session.inputNames).toEqual(['images']);
    });

    it('should retrieve session info', async () => {
        const mockSession = {
            inputNames: ['input'],
            outputNames: ['output'],
        } as any;
        const info = getSessionInfo(mockSession, 'webgpu');
        expect(info.inputNames).toEqual(['input']);
        expect(info.outputNames).toEqual(['output']);
        expect(info.executionProvider).toBe('webgpu');
    });

    it('should release session on dispose', async () => {
        const releaseMock = vi.fn();
        const mockSession = {
            release: releaseMock,
        } as any;
        await disposeSession(mockSession);
        expect(releaseMock).toHaveBeenCalled();
    });

    it('should create webgpu session directly if preferred and successful', async () => {
        const data = new Uint8Array([0]);
        const res = await createSessionWithFallback(data, 'webgpu');
        
        expect(res.backend).toBe('webgpu');
        expect(ort.InferenceSession.create).toHaveBeenCalledWith(data, {
            executionProviders: ['webgpu']
        });
    });

    it('should fallback to wasm if preferred webgpu creation throws error', async () => {
        (globalThis as any).__mockWebGpuFail = true;
        const data = new Uint8Array([0]);
        
        const res = await createSessionWithFallback(data, 'webgpu');
        
        expect(res.backend).toBe('wasm');
        // It should try WebGPU, throw, and fallback to WASM
        expect(ort.InferenceSession.create).toHaveBeenCalledWith(data, {
            executionProviders: ['webgpu']
        });
        expect(ort.InferenceSession.create).toHaveBeenCalledWith(data, {
            executionProviders: ['wasm']
        });
    });

    it('should create webgpu in auto mode if capability returns webgpu', async () => {
        mockNavigator({
            gpu: {
                requestAdapter: vi.fn().mockResolvedValue({ limits: {} })
            }
        });
        const data = new Uint8Array([0]);
        const res = await createSessionWithFallback(data, 'auto');
        
        expect(res.backend).toBe('webgpu');
        expect(ort.InferenceSession.create).toHaveBeenCalledWith(data, {
            executionProviders: ['webgpu']
        });
    });

    it('should create wasm in auto mode if capability returns wasm', async () => {
        mockNavigator({}); // no WebGPU
        const data = new Uint8Array([0]);
        const res = await createSessionWithFallback(data, 'auto');
        
        expect(res.backend).toBe('wasm');
        expect(ort.InferenceSession.create).toHaveBeenCalledWith(data, {
            executionProviders: ['wasm']
        });
    });

    it('should execute custom providers if provided', async () => {
        const data = new Uint8Array([0]);
        const res = await createSessionWithFallback(data, 'auto', ['webgl']);
        
        expect(res.backend).toBe('wasm'); // since webgl doesn't contain 'webgpu'
        expect(ort.InferenceSession.create).toHaveBeenCalledWith(data, {
            executionProviders: ['webgl']
        });
    });
});
