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

        // Auto-detect input shape from the ONNX session metadata.
        // This prevents dimension mismatches when the model expects e.g. 224×224
        // but the plugin defaults to 640×640.
        this.autoDetectInputShape(session);
    }

    /**
     * Returns the current input shape (NCHW format).
     * Consumers should prefer this getter over accessing the private field.
     */
    getInputShape(): number[] {
        return [...this.inputShape];
    }

    /**
     * Reads the first input tensor's shape from an ONNX session and updates
     * this.inputShape + this.config.inputWidth/inputHeight accordingly.
     * Tries multiple internal paths to cover different onnxruntime-web versions.
     */
    private autoDetectInputShape(session: ort.InferenceSession): void {
        try {
            const firstInputName = session.inputNames[0];
            if (!firstInputName) return;

            const s = session as any;

            // Strategy 1: handler._model.graph.input (onnxruntime-web ~1.17+)
            let dims = this.extractDimsFromGraphInput(
                s?.handler?.['_model']?.graph?.input
            );

            // Strategy 2: handler._model.graph.node input (alternative path)
            if (!dims) {
                dims = this.extractDimsFromGraphInput(
                    s?.handler?.model?.graph?.input
                );
            }

            // Strategy 3: session._model (some builds)
            if (!dims) {
                dims = this.extractDimsFromGraphInput(
                    s?.['_model']?.graph?.input
                );
            }

            if (dims) {
                const [n, c, h, w] = dims;
                if (h > 0 && w > 0) {
                    this.inputShape = [n || 1, c || 3, h, w];
                    this.config.inputHeight = h;
                    this.config.inputWidth = w;
                    console.log(`[${this.id}] Auto-detected input shape from ONNX: [${this.inputShape.join(', ')}]`);
                    return;
                }
            }
        } catch (err) {
            console.warn(`[${this.id}] Could not auto-detect input shape from session:`, err);
        }
        // If auto-detection fails, keep current defaults
        console.log(`[${this.id}] Using default input shape: [${this.inputShape.join(', ')}]`);
    }

    /**
     * Extracts NCHW dims from a graph input array structure.
     * Returns a 4-element number array or null if extraction fails.
     */
    private extractDimsFromGraphInput(graphInput: any): number[] | null {
        try {
            if (!graphInput || !Array.isArray(graphInput) || graphInput.length === 0) return null;
            const dimArray = graphInput[0]?.type?.tensorType?.shape?.dim;
            if (!dimArray || !Array.isArray(dimArray) || dimArray.length !== 4) return null;
            return dimArray.map((d: any) => {
                const val = d.dimValue;
                if (val !== undefined && val !== null) {
                    return typeof val === 'bigint' ? Number(val) : Number(val);
                }
                return 0;
            });
        } catch {
            return null;
        }
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

        // 1.5 Validate preprocessed tensor shape matches model expectations
        const expectedH = this.inputShape[2] ?? this.config.inputHeight;
        const expectedW = this.inputShape[3] ?? this.config.inputWidth;
        const actualH = preprocessed.dims[2];
        const actualW = preprocessed.dims[3];
        if (actualH !== expectedH || actualW !== expectedW) {
            throw new Error(
                `Input shape mismatch: model expects ${expectedW}×${expectedH} ` +
                `but preprocessed tensor is ${actualW}×${actualH}. ` +
                `Current inputShape: [${this.inputShape.join(', ')}]`
            );
        }

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
        const nmsDetections = nonMaxSuppression(restored, this.config.iouThreshold);
        
        const detections = nmsDetections.map((d, index) => ({
            ...d,
            id: `det_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 9)}`,
            label: d.className,
        }));

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
