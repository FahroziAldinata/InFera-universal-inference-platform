import { describe, it, expect, vi, afterEach } from 'vitest';
import { calculateMetrics, getMemoryUsageMB } from '../benchmark';

describe('Benchmark and Metrics (Tahap 7.3)', () => {
    const originalWindow = typeof globalThis.window !== 'undefined' ? globalThis.window : undefined;
    const originalPerformance = typeof globalThis.performance !== 'undefined' ? globalThis.performance : undefined;

    afterEach(() => {
        // Restore window
        if (originalWindow === undefined) {
            // @ts-ignore
            delete globalThis.window;
        } else {
            // @ts-ignore
            globalThis.window = originalWindow;
        }
        
        // Restore performance
        if (originalPerformance === undefined) {
            // @ts-ignore
            delete globalThis.performance;
        } else {
            // @ts-ignore
            globalThis.performance = originalPerformance;
        }
    });

    it('should calculate total time and FPS correctly', () => {
        const metrics = calculateMetrics(10, 20, 10, 'wasm');

        expect(metrics.preprocessTimeMs).toBe(10);
        expect(metrics.inferenceTimeMs).toBe(20);
        expect(metrics.postprocessTimeMs).toBe(10);
        
        expect(metrics.totalTimeMs).toBe(40); // 10 + 20 + 10 = 40
        expect(metrics.fps).toBe(25); // 1000 / 40 = 25
        expect(metrics.backend).toBe('wasm');
        expect(metrics.timestamp).toBeLessThanOrEqual(Date.now());
    });

    it('should return fps as 0 if totalTimeMs is 0', () => {
        const metrics = calculateMetrics(0, 0, 0, 'webgpu');
        expect(metrics.totalTimeMs).toBe(0);
        expect(metrics.fps).toBe(0);
    });

    it('should return undefined for memory usage in Node (where window is undefined)', () => {
        // @ts-ignore
        delete globalThis.window;
        
        const memory = getMemoryUsageMB();
        expect(memory).toBeUndefined();
    });

    it('should return undefined if window exists but performance.memory does not', () => {
        // @ts-ignore
        globalThis.window = {} as any;
        // @ts-ignore
        globalThis.performance = {} as any; // mock empty performance

        const memory = getMemoryUsageMB();
        expect(memory).toBeUndefined();
    });

    it('should calculate and return memory usage in Megabytes if window.performance.memory exists', () => {
        // Mock global window and performance with memory API
        // @ts-ignore
        globalThis.window = {} as any;
        // @ts-ignore
        globalThis.performance = {
            memory: {
                usedJSHeapSize: 50 * 1024 * 1024 // 50 Megabytes in bytes
            }
        } as any;

        const memory = getMemoryUsageMB();
        expect(memory).toBeCloseTo(50, 2);

        const metrics = calculateMetrics(5, 5, 5, 'webgpu');
        expect(metrics.memoryUsageMB).toBeCloseTo(50, 2);
    });
});
