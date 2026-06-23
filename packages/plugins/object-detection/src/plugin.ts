import type { InferencePlugin, Tensor, InferenceResult } from '@infera/core';
import type { DetectionResult, ObjectDetectionConfig, PluginCapabilities, PreprocessResult } from './types';
import type { DetectionModelMetadata } from './model_metadata';
import { DEFAULT_CONFIG, DEFAULT_CAPABILITIES } from './constants';
import { fileToImageData } from './preprocess/image_data';
import { letterboxImage } from './preprocess/letterbox';
import { normalizePixels } from './preprocess/normalize';
import { toCHWTensor } from './preprocess/tensor';
import * as ort from 'onnxruntime-web';
import { loadModel as loadModelHelper, createSessionWithFallback, disposeSession } from './runtime/session';
import { runInference } from './runtime/inference';
import { decodeYOLO } from './postprocess/decoder';
import { restoreBoxes } from './postprocess/restore_boxes';
import { nonMaxSuppression } from './postprocess/nms';
import { calculateMetrics } from './runtime/benchmark';
import type { RuntimeBackend } from './runtime/capability';

export class ObjectDetectionPlugin implements InferencePlugin<DetectionResult> {
    readonly id = 'object-detection';
    readonly name = 'Object Detection';
    readonly version = '0.1.0';
    readonly supportedInputTypes = ['image'] as const;
    readonly supportedModelFormats = ['onnx'] as const;

    readonly capabilities: PluginCapabilities = DEFAULT_CAPABILITIES;

    private config: ObjectDetectionConfig;
    private labels: string[] = [];
    private inputShape: number[] = [1, 3, DEFAULT_CONFIG.inputHeight, DEFAULT_CONFIG.inputWidth];
    private session: ort.InferenceSession | null = null;
    private lastPreprocessResult: PreprocessResult | null = null;
    private backend: RuntimeBackend = 'wasm';

    constructor(config: Partial<ObjectDetectionConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    async init(): Promise<void> {
        console.log(`[${this.id}] init — config:`, this.config);
    }

    async loadModel(modelFile: File): Promise<void> {
        console.log(`[${this.id}] Loading model: ${modelFile.name}`);
        const modelData = await loadModelHelper(modelFile);
        
        const usePreferred = this.config.preferredBackend === 'auto' || this.config.preferredBackend === 'webgpu';
        const isDefaultProviders = this.config.executionProviders &&
            this.config.executionProviders.length === 1 &&
            this.config.executionProviders[0] === 'wasm';
        const customProviders = usePreferred && isDefaultProviders
            ? undefined
            : this.config.executionProviders;

        const { session, backend } = await createSessionWithFallback(
            modelData,
            this.config.preferredBackend || 'auto',
            customProviders
        );
        this.session = session;
        this.backend = backend;
    }

    async dispose(): Promise<void> {
        this.labels = [];
        if (this.session) {
            await disposeSession(this.session);
            this.session = null;
        }
    }

    async predict(input: unknown): Promise<InferenceResult<DetectionResult>> {
        if (!this.session) {
            throw new Error('Model belum dimuat. Panggil loadModel() terlebih dahulu.');
        }

        // 1. Preprocess
        const tPreStart = performance.now();
        const preprocessed = await this.preprocess(input);
        this.lastPreprocessResult = preprocessed;
        const preprocessTimeMs = performance.now() - tPreStart;

        // 2. Inference
        const tInfStart = performance.now();
        const rawOutput = await runInference(this.session, preprocessed);
        const inferenceTimeMs = performance.now() - tInfStart;

        // 3. Postprocess
        const tPostStart = performance.now();
        const outputNames = this.session.outputNames;
        const primaryOutputName = outputNames[0] || 'output0';
        const primaryOutputTensor = rawOutput.outputs[primaryOutputName];
        if (!primaryOutputTensor) {
            throw new Error(`Output tensor "${primaryOutputName}" tidak ditemukan.`);
        }

        const postprocessed = await this.postprocess(primaryOutputTensor);
        const postprocessTimeMs = performance.now() - tPostStart;

        const useMetrics = this.config.enableMetrics !== false;
        const metrics = useMetrics ? calculateMetrics(
            preprocessTimeMs,
            inferenceTimeMs,
            postprocessTimeMs,
            this.backend
        ) : undefined;

        return {
            ...postprocessed,
            executionTimeMs: metrics ? metrics.totalTimeMs : (preprocessTimeMs + inferenceTimeMs + postprocessTimeMs),
            ...(metrics ? { metrics } : {})
        };
    }

    loadLabels(rawText: string): void {
        this.labels = rawText
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean);
        console.log(`[${this.id}] Loaded ${this.labels.length} labels`);
    }

    setInputShape(shape: number[]): void {
        if (shape.length !== 4) {
            throw new Error(
                `Input shape tidak valid: ${JSON.stringify(shape)}. ` +
                `Harus berformat NCHW [N, C, H, W] dengan 4 dimensi.`
            );
        }
        this.inputShape = shape;
        console.log(`[${this.id}] Input shape diset ke: ${JSON.stringify(shape)}`);
    }

    async preprocess(input: unknown): Promise<PreprocessResult> {
        console.log(`[${this.id}] preprocess running...`);

        // 1. Decode to ImageData
        const imageData = await fileToImageData(input as any);
        const originalWidth = imageData.width;
        const originalHeight = imageData.height;

        // 2. Read target shape
        const targetHeight = this.inputShape[2] ?? this.config.inputHeight;
        const targetWidth = this.inputShape[3] ?? this.config.inputWidth;

        // 3. Letterbox
        const letterboxed = letterboxImage(imageData, targetWidth, targetHeight);

        // 4. Normalize
        let normalizedHWC: Float32Array;
        if (this.config.normalize) {
            normalizedHWC = normalizePixels(letterboxed.imageData);
        } else {
            const hwcData = new Float32Array(targetWidth * targetHeight * 3);
            const rgba = letterboxed.imageData.data;
            for (let i = 0; i < targetWidth * targetHeight; i++) {
                hwcData[i * 3] = rgba[i * 4]!;
                hwcData[i * 3 + 1] = rgba[i * 4 + 1]!;
                hwcData[i * 3 + 2] = rgba[i * 4 + 2]!;
            }
            normalizedHWC = hwcData;
        }

        // 5. CHW conversion
        const chwData = toCHWTensor(normalizedHWC, targetWidth, targetHeight);

        return {
            data: chwData,
            dims: [1, 3, targetHeight, targetWidth],
            type: 'float32',
            inputWidth: targetWidth,
            inputHeight: targetHeight,
            originalWidth,
            originalHeight,
            scale: letterboxed.scale,
            padX: letterboxed.padX,
            padY: letterboxed.padY,
        };
    }

    async postprocess(output: Tensor): Promise<InferenceResult<DetectionResult>> {
        console.log(`[${this.id}] postprocess running...`);

        const pre = this.lastPreprocessResult;

        // Build metadata from current config and labels
        const metadata: DetectionModelMetadata = {
            inputWidth: this.config.inputWidth,
            inputHeight: this.config.inputHeight,
            classNames: this.labels,
            outputNames: ['output0'],
            confidenceThreshold: this.config.confidenceThreshold,
            iouThreshold: this.config.iouThreshold,
        };

        // 1. Decode raw output tensor → candidate detections
        const candidates = decodeYOLO(output, metadata, this.config.confidenceThreshold);

        // 2. Restore coordinates from letterbox space → original image space
        const restored = pre
            ? restoreBoxes(candidates, {
                scale: pre.scale,
                padX: pre.padX,
                padY: pre.padY,
                originalWidth: pre.originalWidth,
                originalHeight: pre.originalHeight,
            })
            : candidates;

        // 3. Non-Maximum Suppression
        const detections = nonMaxSuppression(restored, this.config.iouThreshold);

        return {
            pluginId: this.id,
            modelId: 'default',
            executionTimeMs: 0,
            data: { detections },
            rawOutputShape: output.dims,
        };
    }
}

// Export singleton instance
export const objectDetectionPlugin = new ObjectDetectionPlugin();
