import type { Detection } from '@infera/plugin-object-detection';

export class PostprocessWorkerManager {
    private worker: Worker | null = null;
    private initFailed = false;

    constructor() {
        this.initWorker();
    }

    private initWorker() {
        try {
            if (this.worker) {
                this.worker.terminate();
            }
            // Use Vite worker URL resolver
            this.worker = new Worker(
                new URL('../workers/postprocess.worker.ts', import.meta.url),
                { type: 'module' }
            );
            this.worker.onerror = (e) => {
                console.error('[worker] Worker global crash or load error:', e);
                this.worker = null;
            };
            this.initFailed = false;
        } catch (e) {
            console.error('[worker] Failed to initialize worker, falling back to main thread:', e);
            this.initFailed = true;
            this.worker = null;
        }
    }

    public async postprocess(
        outputData: Float32Array,
        outputDims: number[],
        config: { inputWidth: number; inputHeight: number; confidenceThreshold: number; iouThreshold: number },
        labels: string[],
        preprocessMeta: { scale: number; padX: number; padY: number; originalWidth: number; originalHeight: number } | null,
        signal?: AbortSignal
    ): Promise<Detection[]> {
        // Fall back to main thread if Worker is not supported or failed to launch
        if (this.initFailed || !this.worker) {
            console.warn('[worker] Using main thread fallback for post-processing.');
            return this.runMainThread(outputData, outputDims, config, labels, preprocessMeta);
        }

        return new Promise<Detection[]>((resolve, reject) => {
            const currentWorker = this.worker;
            if (!currentWorker) {
                reject(new Error('Worker not available'));
                return;
            }

            const onMessage = (e: MessageEvent) => {
                cleanup();
                if (e.data.status === 'success') {
                    resolve(e.data.detections);
                } else {
                    reject(new Error(e.data.error || 'Worker execution failed'));
                }
            };

            const onError = (e: ErrorEvent) => {
                cleanup();
                console.error('[worker] Worker crashed during execution. Recovering...', e);
                this.initWorker(); // recreate worker for future runs
                reject(new Error('Postprocess worker crashed mid-execution'));
            };

            const onAbort = () => {
                cleanup();
                reject(new DOMException('Post-processing aborted', 'AbortError'));
            };

            const cleanup = () => {
                currentWorker.removeEventListener('message', onMessage);
                currentWorker.removeEventListener('error', onError);
                if (signal) {
                    signal.removeEventListener('abort', onAbort);
                }
            };

            currentWorker.addEventListener('message', onMessage);
            currentWorker.addEventListener('error', onError);

            if (signal) {
                if (signal.aborted) {
                    onAbort();
                    return;
                }
                signal.addEventListener('abort', onAbort);
            }

            // Transfer ArrayBuffer by copying the data first to ensure no side effects if main thread fallback is triggered on crash
            const buffer = outputData.buffer.slice(0);
            currentWorker.postMessage({
                outputData: new Float32Array(buffer),
                outputDims,
                config,
                labels,
                preprocessMeta
            }, [buffer]);
        });
    }

    private async runMainThread(
        outputData: Float32Array,
        outputDims: number[],
        config: { inputWidth: number; inputHeight: number; confidenceThreshold: number; iouThreshold: number },
        labels: string[],
        preprocessMeta: { scale: number; padX: number; padY: number; originalWidth: number; originalHeight: number } | null
    ): Promise<Detection[]> {
        // Dynamically import to avoid bloat in main bundle
        const { decodeYOLO, restoreBoxes, nonMaxSuppression } = await import('@infera/plugin-object-detection');

        const tensor = {
            data: outputData,
            dims: outputDims,
            type: 'float32' as const
        };

        const metadata = {
            inputWidth: config.inputWidth,
            inputHeight: config.inputHeight,
            classNames: labels,
            outputNames: ['output0'],
            confidenceThreshold: config.confidenceThreshold,
            iouThreshold: config.iouThreshold,
        };

        const candidates = decodeYOLO(tensor, metadata, config.confidenceThreshold);
        const restored = preprocessMeta
            ? restoreBoxes(candidates, {
                scale: preprocessMeta.scale,
                padX: preprocessMeta.padX,
                padY: preprocessMeta.padY,
                originalWidth: preprocessMeta.originalWidth,
                originalHeight: preprocessMeta.originalHeight,
            })
            : candidates;

        const nmsDetections = nonMaxSuppression(restored, config.iouThreshold);

        return nmsDetections.map((d, index) => ({
            ...d,
            id: `det_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 9)}`,
            label: d.className,
        }));
    }

    public restart() {
        console.log('[worker] Manually restarting post-processing worker...');
        this.initWorker();
    }

    public terminate() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
    }
}

// Singleton manager instance
export const postprocessWorkerManager = new PostprocessWorkerManager();
