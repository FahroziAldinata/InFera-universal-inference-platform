import type { ObjectDetectionConfig, PluginCapabilities } from './types';

export const DEFAULT_CONFIG: ObjectDetectionConfig = {
    inputWidth: 640,
    inputHeight: 640,
    confidenceThreshold: 0.25,
    iouThreshold: 0.45,
    normalize: true,
};

export const DEFAULT_CAPABILITIES: PluginCapabilities = {
    supportsBatch: false,
    supportsWebGPU: false,
    supportsNMS: true,
    supportsCustomLabels: true,
    supportsCanvasOverlay: true,
};
