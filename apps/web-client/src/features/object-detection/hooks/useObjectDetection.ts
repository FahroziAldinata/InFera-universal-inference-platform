import { useState, useCallback } from 'react';
import { ObjectDetectionPlugin, loadPackage } from '@infera/plugin-object-detection';
import { useDetectionStore } from '../store/detectionStore';
import { db, saveModelToCache, updateModelLastUsed } from '../db/detectionDb';
import type { SavedModel } from '../db/detectionDb';
import { postprocessWorkerManager } from '../utils/postprocessManager';

let globalPluginInstance: ObjectDetectionPlugin | null = null;
let activeAbortController: AbortController | null = null;

export function useObjectDetection() {
    const {
        preferredBackend,
        enableMetrics,
        imageFile,
        setModelInfo,
        setStep,
        setDetections,
        setError,
        setCachedModels,
    } = useDetectionStore();

    const [loading, setLoading] = useState(false);

    const refreshCachedModels = useCallback(async () => {
        try {
            const models = await db.models.toArray();
            setCachedModels(models);
        } catch (err) {
            console.error('Failed to load models from DB', err);
        }
    }, [setCachedModels]);

    async function initPluginInstance() {
        if (globalPluginInstance) {
            try {
                await globalPluginInstance.dispose();
            } catch (e) {
                console.warn('Error disposing previous plugin instance:', e);
            }
            globalPluginInstance = null;
        }

        globalPluginInstance = new ObjectDetectionPlugin({
            preferredBackend,
            enableMetrics,
        });
        await globalPluginInstance.init();

        // Override postprocess to run in postprocessing Web Worker
        globalPluginInstance.postprocess = async (output) => {
            const instance = globalPluginInstance as unknown as Record<string, unknown>;
            const pre = (instance?.lastPreprocessResult || null) as { scale: number; padX: number; padY: number; originalWidth: number; originalHeight: number } | null;
            const config = (instance?.config || {}) as { inputWidth: number; inputHeight: number; confidenceThreshold: number; iouThreshold: number };
            const labels = (instance?.labels || []) as string[];

            if (activeAbortController) {
                activeAbortController.abort();
            }
            activeAbortController = new AbortController();

            const detections = await postprocessWorkerManager.postprocess(
                output.data as Float32Array,
                output.dims,
                config,
                labels,
                pre,
                activeAbortController.signal
            );

            return {
                pluginId: globalPluginInstance?.id || 'object-detection',
                modelId: 'default',
                executionTimeMs: 0,
                data: { detections },
                rawOutputShape: output.dims,
            };
        };

        return globalPluginInstance;
    }

    async function loadModelFiles(modelFile: File, labelFile: File | null, skipCache = false) {
        setLoading(true);
        try {
            const plugin = await initPluginInstance();
            await plugin.loadModel(modelFile);

            let labelsList: string[] = [];
            if (labelFile) {
                const labelText = await labelFile.text();
                plugin.loadLabels(labelText);
                labelsList = labelText.split('\n').map(l => l.trim()).filter(Boolean);
            }

            // Read the dynamic/default input shape from plugin config
            const inputShape = ((plugin as unknown as Record<string, unknown>).inputShape as number[]) || [1, 3, 640, 640];

            setModelInfo(modelFile.name, labelsList, inputShape);

            // Save to IndexedDB cache
            if (!skipCache) {
                const onnxData = await modelFile.arrayBuffer();
                await saveModelToCache({
                    id: modelFile.name,
                    name: modelFile.name.replace('.onnx', ''),
                    fileName: modelFile.name,
                    onnxData,
                    labels: labelsList,
                    inputShape,
                    architecture: inputShape[2] === 640 ? 'yolov8' : 'yolov5',
                    isFavorite: 0,
                    lastUsed: Date.now(),
                });
                await refreshCachedModels();
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(`Failed to load model: ${msg}`);
        } finally {
            setLoading(false);
        }
    }

    async function loadUampFile(zipFile: File, skipCache = false) {
        setLoading(true);
        try {
            // 1. Decompress & Validate package
            const parsedPackage = await loadPackage(zipFile);

            // 2. Setup plugin instance
            const plugin = await initPluginInstance();
            await plugin.loadModel(parsedPackage.modelFile);

            if (parsedPackage.labels && parsedPackage.labels.length > 0) {
                plugin.loadLabels(parsedPackage.labels.join('\n'));
            }

            const inputSize = parsedPackage.metadata.inputSize || 640;
            const inputShape = [1, 3, inputSize, inputSize];
            plugin.setInputShape(inputShape);

            setModelInfo(
                zipFile.name,
                parsedPackage.labels || [],
                inputShape
            );

            // Save UAMP package to IndexedDB cache
            if (!skipCache) {
                const zipBuffer = await zipFile.arrayBuffer();
                await saveModelToCache({
                    id: zipFile.name,
                    name: zipFile.name.replace('.zip', ''),
                    fileName: zipFile.name,
                    onnxData: zipBuffer,
                    labels: parsedPackage.labels || [],
                    inputShape,
                    architecture: parsedPackage.metadata.architecture || 'yolov8',
                    isFavorite: 0,
                    lastUsed: Date.now(),
                });
                await refreshCachedModels();
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(`Failed to load UAMP package: ${msg}`);
        } finally {
            setLoading(false);
        }
    }

    async function loadCachedModel(savedModel: SavedModel) {
        setLoading(true);
        try {
            const file = new File([savedModel.onnxData], savedModel.fileName, {
                type: savedModel.fileName.endsWith('.zip') ? 'application/zip' : 'application/octet-stream',
            });

            if (savedModel.fileName.endsWith('.zip')) {
                await loadUampFile(file, true);
            } else {
                const labelText = savedModel.labels.join('\n');
                const labelFile = labelText ? new File([labelText], 'labels.txt', { type: 'text/plain' }) : null;
                await loadModelFiles(file, labelFile, true);
            }
            await updateModelLastUsed(savedModel.id);
            await refreshCachedModels();
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(`Failed to load cached model: ${msg}`);
        } finally {
            setLoading(false);
        }
    }

    async function runInference() {
        if (!globalPluginInstance || !imageFile) return;

        setStep('running');
        try {
            // Runs preprocess -> model inference -> postprocess -> metrics internally!
            const result = await globalPluginInstance.predict(imageFile);
            setDetections(result.data.detections, result.metrics || null);
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') {
                console.log('[useObjectDetection] Active post-processing run aborted.');
                return;
            }
            const msg = err instanceof Error ? err.message : String(err);
            setError(`Inference failed: ${msg}`);
        }
    }

    return {
        loading,
        loadModelFiles,
        loadUampFile,
        loadCachedModel,
        runInference,
        refreshCachedModels,
        pluginInstance: globalPluginInstance,
    };
}

export async function disposeActivePluginInstance() {
    if (globalPluginInstance) {
        try {
            await globalPluginInstance.dispose();
        } catch (e) {
            console.warn('Failed to dispose plugin instance on exit:', e);
        }
        globalPluginInstance = null;
    }
    if (activeAbortController) {
        activeAbortController.abort();
        activeAbortController = null;
    }
}
