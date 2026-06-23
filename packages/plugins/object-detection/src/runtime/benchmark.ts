/**
 * Interface detailing execution duration metrics, frame rates, memory usage,
 * and time of execution.
 */
export interface InferenceMetrics {
    preprocessTimeMs: number;
    inferenceTimeMs: number;
    postprocessTimeMs: number;
    totalTimeMs: number;
    fps: number;
    backend: 'webgpu' | 'wasm';
    memoryUsageMB?: number;
    timestamp: number;
}

/**
 * Helper to retrieve current used JS heap size in Megabytes.
 * Returns undefined in Node.js or browsers without performance.memory API.
 */
export function getMemoryUsageMB(): number | undefined {
    if (
        typeof window !== 'undefined' && 
        typeof performance !== 'undefined' && 
        (performance as any).memory
    ) {
        return (performance as any).memory.usedJSHeapSize / (1024 * 1024);
    }
    return undefined;
}

/**
 * Evaluates execution durations and aggregates them into a benchmark metrics record.
 */
export function calculateMetrics(
    preprocessTimeMs: number,
    inferenceTimeMs: number,
    postprocessTimeMs: number,
    backend: 'webgpu' | 'wasm'
): InferenceMetrics {
    const totalTimeMs = preprocessTimeMs + inferenceTimeMs + postprocessTimeMs;
    const fps = totalTimeMs > 0 ? 1000 / totalTimeMs : 0;

    return {
        preprocessTimeMs,
        inferenceTimeMs,
        postprocessTimeMs,
        totalTimeMs,
        fps,
        backend,
        memoryUsageMB: getMemoryUsageMB(),
        timestamp: Date.now()
    };
}
