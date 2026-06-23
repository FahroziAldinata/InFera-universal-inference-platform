import type { Tensor } from '@infera/core';
import type { Detection } from '../types';
import type { DetectionModelMetadata } from '../model_metadata';
import { decodeYOLOv5 } from './yolov5_decoder';
import { decodeYOLOv8 } from './yolov8_decoder';

/**
 * Auto-detects YOLO format from output tensor shape and dispatches to the correct decoder.
 *
 * YOLOv5: output shape [1, num_candidates, 5 + num_classes] — rows are candidates
 * YOLOv8: output shape [1, 4 + num_classes, num_candidates] — columns are candidates
 */
export function decodeYOLO(
    outputTensor: Tensor,
    metadata: DetectionModelMetadata,
    confidenceThreshold: number
): Detection[] {
    const dims = outputTensor.dims;
    if (dims.length !== 3) {
        throw new Error(`Unsupported YOLO output shape: [${dims.join(', ')}]. Expected rank 3.`);
    }

    const d1 = dims[1]!;
    const d2 = dims[2]!;

    // YOLOv8: d1 = 4 + num_classes (small), d2 = num_candidates (large)
    // YOLOv5: d1 = num_candidates (large), d2 = 5 + num_classes (small)
    const isYOLOv8 = (metadata.architecture === 'yolov8') || (d1 < d2 && d1 > 4);

    if (isYOLOv8) {
        return decodeYOLOv8(outputTensor, metadata, confidenceThreshold);
    } else {
        return decodeYOLOv5(outputTensor, metadata, confidenceThreshold);
    }
}

