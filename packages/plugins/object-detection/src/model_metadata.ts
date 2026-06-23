export interface DetectionModelMetadata {
    inputWidth: number;
    inputHeight: number;
    classNames: string[];
    outputNames: string[];
    confidenceThreshold: number;
    iouThreshold: number;
    architecture?: 'yolov5' | 'yolov8';
}
