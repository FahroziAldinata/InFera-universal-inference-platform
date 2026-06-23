import { describe, it, expect, vi, afterEach } from 'vitest';
import { detectBestBackend } from '../capability';

describe('Runtime Capability Detection (Tahap 7.1)', () => {
    const originalNavigator = globalThis.navigator;

    function mockNavigator(value: any) {
        Object.defineProperty(globalThis, 'navigator', {
            value: value,
            writable: true,
            configurable: true
        });
    }

    afterEach(() => {
        Object.defineProperty(globalThis, 'navigator', {
            value: originalNavigator,
            writable: true,
            configurable: true
        });
    });

    it('should fallback to wasm if navigator.gpu does not exist', async () => {
        mockNavigator({} as any);
        const backend = await detectBestBackend();
        expect(backend).toBe('wasm');
    });

    it('should fallback to wasm if requestAdapter returns null', async () => {
        mockNavigator({
            gpu: {
                requestAdapter: vi.fn().mockResolvedValue(null)
            }
        });
        const backend = await detectBestBackend();
        expect(backend).toBe('wasm');
    });

    it('should fallback to wasm if requestAdapter throws an error', async () => {
        mockNavigator({
            gpu: {
                requestAdapter: vi.fn().mockRejectedValue(new Error('GPU context creation failed'))
            }
        });
        const backend = await detectBestBackend();
        expect(backend).toBe('wasm');
    });

    it('should return webgpu if navigator.gpu and requestAdapter returns valid adapter', async () => {
        mockNavigator({
            gpu: {
                requestAdapter: vi.fn().mockResolvedValue({
                    limits: {},
                    features: new Set()
                })
            }
        });
        const backend = await detectBestBackend();
        expect(backend).toBe('webgpu');
    });
});
