import type { InferencePlugin, Tensor, InferenceResult } from '@infera/core';
import type { DetectionResult, ObjectDetectionConfig, PluginCapabilities } from './types';
import { DEFAULT_CONFIG, DEFAULT_CAPABILITIES } from './constants';

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

    constructor(config: Partial<ObjectDetectionConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    async init(): Promise<void> {
        console.log(`[${this.id}] init — config:`, this.config);
    }

    async dispose(): Promise<void> {
        this.labels = [];
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

    async preprocess(input: unknown): Promise<Tensor> {
        // Skeleton for Phase 1
        console.log(`[${this.id}] preprocess running...`);
        return {
            data: new Float32Array(0),
            dims: this.inputShape,
            type: 'float32',
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
