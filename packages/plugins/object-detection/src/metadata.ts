import type { DetectionModelMetadata } from './types';

/**
 * Helper to construct and retrieve model metadata configurations
 */
export function getModelMetadata(
    architecture: 'yolov5' | 'yolov8' | 'yolo_nas' | 'custom',
    inputSize = 640,
    classCount = 80,
    outputNames: string[] = []
): DetectionModelMetadata {
    return {
        architecture,
        inputSize,
        classCount,
        outputNames,
    };
}
