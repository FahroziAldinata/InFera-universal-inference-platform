import type { InputType, ModelFormat } from '@infera/core';

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
    box: BoundingBox;
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

export interface DetectionModelMetadata {
    architecture: 'yolov5' | 'yolov8' | 'yolo_nas' | 'custom';
    inputSize: number;
    classCount: number;
    outputNames: string[];
}

export interface ObjectDetectionConfig {
    inputWidth: number;
    inputHeight: number;
    confidenceThreshold: number;
    iouThreshold: number;
    normalize: boolean;
}
