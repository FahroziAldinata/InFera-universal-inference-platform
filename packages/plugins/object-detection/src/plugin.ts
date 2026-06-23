import type { InferencePlugin, Tensor, InferenceResult } from '@infera/core';
import type { DetectionResult, ObjectDetectionConfig, PluginCapabilities, PreprocessResult } from './types';
import { DEFAULT_CONFIG, DEFAULT_CAPABILITIES } from './constants';
import { fileToImageData } from './preprocess/image_data';
import { letterboxImage } from './preprocess/letterbox';
import { normalizePixels } from './preprocess/normalize';
import { toCHWTensor } from './preprocess/tensor';
import * as ort from 'onnxruntime-web';
import { loadModel as loadModelHelper, createSession, disposeSession } from './runtime/session';
import { runInference } from './runtime/inference';

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

    constructor(config: Partial<ObjectDetectionConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    async init(): Promise<void> {
        console.log(`[${this.id}] init — config:`, this.config);
    }

    async loadModel(modelFile: File): Promise<void> {
        console.log(`[${this.id}] Loading model: ${modelFile.name}`);
        const modelData = await loadModelHelper(modelFile);
        this.session = await createSession(modelData, this.config.executionProviders);
    }

    async dispose(): Promise<void> {
        this.labels = [];
        if (this.session) {
            await disposeSession(this.session);
            this.session = null;
        }
    }

    async predict(input: unknown): Promise<InferenceResult<DetectionResult>> {
        const startTime = performance.now();
        if (!this.session) {
            throw new Error('Model belum dimuat. Panggil loadModel() terlebih dahulu.');
        }

        // 1. Preprocess
        const preprocessed = await this.preprocess(input);

        // 2. Inference
        const rawOutput = await runInference(this.session, preprocessed);

        // 3. Postprocess
        const outputNames = this.session.outputNames;
        const primaryOutputName = outputNames[0] || 'output0';
        const primaryOutputTensor = rawOutput.outputs[primaryOutputName];
        if (!primaryOutputTensor) {
            throw new Error(`Output tensor "${primaryOutputName}" tidak ditemukan.`);
        }

        const postprocessed = await this.postprocess(primaryOutputTensor);
        const executionTimeMs = performance.now() - startTime;

        return {
            ...postprocessed,
            executionTimeMs,
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
        // Skeleton for Phase 1
        console.log(`[${this.id}] postprocess running...`);
        return {
            pluginId: this.id,
            modelId: 'default',
            executionTimeMs: 0,
            data: {
                detections: [],
            },
            rawOutputShape: output.dims,
        };
    }
}

// Export singleton instance
export const objectDetectionPlugin = new ObjectDetectionPlugin();
