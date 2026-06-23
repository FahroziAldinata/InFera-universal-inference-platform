import type { Tensor } from '@infera/core';
import type { Detection } from '../types';
import type { DetectionModelMetadata } from '../model_metadata';

/**
 * Decodes YOLOv8 output tensor.
 *
 * YOLOv8 output shape: [1, 4 + num_classes, num_candidates]
 * e.g. [1, 84, 8400] for COCO 80-class model
 *
 * Each column: [cx, cy, w, h, class0_conf, class1_conf, ...]
 * Note: YOLOv8 does NOT have an objectness score — class scores are direct.
 */
export function decodeYOLOv8(
    outputTensor: Tensor,
    metadata: DetectionModelMetadata,
    confidenceThreshold: number
): Detection[] {
    const data = outputTensor.data as Float32Array;
    const dims = outputTensor.dims;

    // dims: [batch, 4 + num_classes, num_candidates]
    const numRows = dims[1]!;
    const numCandidates = dims[2]!;
    const numClasses = numRows - 4;

    const detections: Detection[] = [];

    for (let i = 0; i < numCandidates; i++) {
        const cx = data[0 * numCandidates + i]!;
        const cy = data[1 * numCandidates + i]!;
        const w  = data[2 * numCandidates + i]!;
        const h  = data[3 * numCandidates + i]!;

        let maxClassConf = 0;
        let maxClassId = 0;
        for (let c = 0; c < numClasses; c++) {
            const classConf = data[(4 + c) * numCandidates + i]!;
            if (classConf > maxClassConf) {
                maxClassConf = classConf;
                maxClassId = c;
            }
        }

        if (maxClassConf < confidenceThreshold) continue;

        detections.push({
            classId: maxClassId,
            className: metadata.classNames[maxClassId] ?? `class_${maxClassId}`,
            confidence: maxClassConf,
            x: cx - w / 2,
            y: cy - h / 2,
            width: w,
            height: h,
        });
    }

    return detections;
}
