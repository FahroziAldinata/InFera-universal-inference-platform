import type { DetectionModelMetadata } from './model_metadata';

export function getModelMetadata(
    architecture?: 'yolov5' | 'yolov8',
    inputWidth = 640,
    inputHeight = 640,
    classNames: string[] = [],
    outputNames: string[] = [],
    confidenceThreshold = 0.25,
    iouThreshold = 0.45
): DetectionModelMetadata {
    return {
        architecture,
        inputWidth,
        inputHeight,
        classNames,
        outputNames,
        confidenceThreshold,
        iouThreshold,
    };
}
