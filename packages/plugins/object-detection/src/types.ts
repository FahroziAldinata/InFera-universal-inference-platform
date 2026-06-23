import type { InputType, ModelFormat, Tensor } from '@infera/core';

export interface BoundingBox {
    x: number;      // x coordinate (top-left or normalized depending on use-case, typically normalized [0, 1])
    y: number;      // y coordinate (top-left or normalized)
    width: number;  // width
    height: number; // height
    centerX: number;
    centerY: number;
}

export interface Detection {
    classId: number;
    className: string;
    confidence: number; // 0.0 - 1.0
    x: number;
    y: number;
    width: number;
    height: number;
    color?: string;     // color code for bounding box rendering
}

export interface DetectionResult {
    detections: Detection[];
}

export interface PluginCapabilities {
    supportsBatch: boolean;
    supportsWebGPU: boolean;
    supportsNMS: boolean;
    supportsCustomLabels: boolean;
    supportsCanvasOverlay: boolean;
}

import type { DetectionModelMetadata } from './model_metadata';
export type { DetectionModelMetadata };

export interface ObjectDetectionConfig {
    inputWidth: number;
    inputHeight: number;
    confidenceThreshold: number;
    iouThreshold: number;
    normalize: boolean;
    executionProviders?: string[];
    preferredBackend?: 'auto' | 'webgpu' | 'wasm';
}

export interface ImageTensor {
    data: Float32Array;
    width: number;
    height: number;
    channels: number;
}

export interface ResizeResult {
    imageData: ImageData;
    width: number;
    height: number;
}

export interface LetterboxResult {
    imageData: ImageData;
    scale: number;
    padX: number;
    padY: number;
}

export interface PreprocessResult extends Tensor {
    data: Float32Array;
    dims: number[];
    type: 'float32';
    inputWidth: number;
    inputHeight: number;
    originalWidth: number;
    originalHeight: number;
    scale: number;
    padX: number;
    padY: number;
}

