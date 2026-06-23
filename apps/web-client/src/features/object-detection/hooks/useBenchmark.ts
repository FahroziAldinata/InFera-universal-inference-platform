import { useState, useEffect } from 'react';
import { useDetectionStore } from '../store/detectionStore';

export interface BenchmarkRecord {
    modelName: string;
    backend: 'webgpu' | 'wasm';
    preprocessTimeMs: number;
    inferenceTimeMs: number;
    postprocessTimeMs: number;
    totalTimeMs: number;
    fps: number;
    timestamp: number;
}

export function useBenchmark() {
    const { metrics, modelName } = useDetectionStore();
    const [history, setHistory] = useState<BenchmarkRecord[]>([]);

    useEffect(() => {
        if (metrics && modelName) {
            const record: BenchmarkRecord = {
                modelName,
                backend: metrics.backend,
                preprocessTimeMs: metrics.preprocessTimeMs,
                inferenceTimeMs: metrics.inferenceTimeMs,
                postprocessTimeMs: metrics.postprocessTimeMs,
                totalTimeMs: metrics.totalTimeMs,
                fps: metrics.fps,
                timestamp: metrics.timestamp || Date.now(),
            };
            setHistory((prev) => [record, ...prev].slice(0, 10)); // Keep last 10 runs
        }
    }, [metrics, modelName]);

    const clearHistory = () => setHistory([]);

    return {
        history,
        clearHistory,
    };
}
