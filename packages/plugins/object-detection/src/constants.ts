import type { ObjectDetectionConfig, PluginCapabilities } from './types';

export const DEFAULT_INPUT_SIZE = 640;
export const LETTERBOX_COLOR = [114, 114, 114];
export const DEFAULT_MEAN = [0, 0, 0];
export const DEFAULT_STD = [255, 255, 255];

export const DEFAULT_CONFIG: ObjectDetectionConfig = {
    inputWidth: DEFAULT_INPUT_SIZE,
    inputHeight: DEFAULT_INPUT_SIZE,
    confidenceThreshold: 0.25,
    iouThreshold: 0.45,
    normalize: true,
    executionProviders: ['wasm'],
};

export const DEFAULT_CAPABILITIES: PluginCapabilities = {
    supportsBatch: false,
    supportsWebGPU: false,
    supportsNMS: true,
    supportsCustomLabels: true,
    supportsCanvasOverlay: true,
};

