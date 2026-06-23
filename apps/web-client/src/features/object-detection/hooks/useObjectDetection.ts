import { useState } from 'react';
import { ObjectDetectionPlugin, loadPackage } from '@infera/plugin-object-detection';
import { useDetectionStore } from '../store/detectionStore';

let globalPluginInstance: ObjectDetectionPlugin | null = null;

export function useObjectDetection() {
    const {
        preferredBackend,
        enableMetrics,
        imageFile,
        setModelInfo,
        setStep,
        setDetections,
        setError,
    } = useDetectionStore();

    const [loading, setLoading] = useState(false);

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
        return globalPluginInstance;
    }

    async function loadModelFiles(modelFile: File, labelFile: File | null) {
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
            // @ts-ignore
            const inputShape = plugin.inputShape || [1, 3, 640, 640];

            setModelInfo(modelFile.name, labelsList, inputShape);
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(`Failed to load model: ${msg}`);
        } finally {
            setLoading(false);
        }
    }

    async function loadUampFile(zipFile: File) {
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
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(`Failed to load UAMP package: ${msg}`);
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
            const msg = err instanceof Error ? err.message : String(err);
            setError(`Inference failed: ${msg}`);
        }
    }

    return {
        loading,
        loadModelFiles,
        loadUampFile,
        runInference,
        pluginInstance: globalPluginInstance,
    };
}
