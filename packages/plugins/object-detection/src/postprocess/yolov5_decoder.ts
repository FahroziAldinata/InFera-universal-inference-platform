import type { Tensor } from '@infera/core';
import type { Detection } from '../types';
import type { DetectionModelMetadata } from '../model_metadata';

/**
 * Decodes YOLOv5 output tensor.
 *
 * YOLOv5 output shape: [1, num_candidates, 5 + num_classes]
 * e.g. [1, 25200, 85] for COCO 80-class model
 *
 * Each row: [cx, cy, w, h, obj_conf, class0_conf, class1_conf, ...]
 */
export function decodeYOLOv5(
    outputTensor: Tensor,
    metadata: DetectionModelMetadata,
    confidenceThreshold: number
): Detection[] {
    const data = outputTensor.data as Float32Array;
    const dims = outputTensor.dims;

    // dims: [batch, num_candidates, 5 + num_classes]
    const numCandidates = dims[1]!;
    const stride = dims[2]!;
    const numClasses = stride - 5;

    const detections: Detection[] = [];

    for (let i = 0; i < numCandidates; i++) {
        const offset = i * stride;
        const cx = data[offset]!;
        const cy = data[offset + 1]!;
        const w  = data[offset + 2]!;
        const h  = data[offset + 3]!;
        const objConf = data[offset + 4]!;

        if (objConf < confidenceThreshold) continue;

        let maxClassConf = 0;
        let maxClassId = 0;
        for (let c = 0; c < numClasses; c++) {
            const classConf = data[offset + 5 + c]!;
            if (classConf > maxClassConf) {
                maxClassConf = classConf;
                maxClassId = c;
            }
        }

        const confidence = objConf * maxClassConf;
        if (confidence < confidenceThreshold) continue;

        detections.push({
            classId: maxClassId,
            className: metadata.classNames[maxClassId] ?? `class_${maxClassId}`,
            confidence,
            x: cx - w / 2,
            y: cy - h / 2,
            width: w,
            height: h,
        });
    }

    return detections;
}
