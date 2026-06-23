import type { Detection } from '../types';
import { calculateIoU } from './iou';

/**
 * Filter overlapping boxes using Non-Maximum Suppression (NMS)
 */
export function nonMaxSuppression(
    detections: Detection[],
    iouThreshold: number
): Detection[] {
    const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);
    const selected: Detection[] = [];

    for (const det of sorted) {
        let keep = true;
        for (const sel of selected) {
            if (det.classId === sel.classId) {
                const iou = calculateIoU(det.box, sel.box);
                if (iou >= iouThreshold) {
                    keep = false;
                    break;
                }
            }
        }
        if (keep) {
            selected.push(det);
        }
    }

    return selected;
}
