import type { Detection, BoundingBox } from '../types';
import { calculateIoU } from './iou';

function detectionToBox(d: Detection): BoundingBox {
    return { x: d.x, y: d.y, width: d.width, height: d.height, centerX: d.x + d.width / 2, centerY: d.y + d.height / 2 };
}

export interface NMSOptions {
    /** If true, suppress boxes across all classes (not per-class). Default: false */
    classAgnostic?: boolean;
    /** Maximum number of detections to return. Default: unlimited */
    maxDetections?: number;
}

/**
 * Filter overlapping boxes using Non-Maximum Suppression (NMS).
 *
 * Detections are sorted by confidence (descending) before filtering.
 * Supports class-aware (default) and class-agnostic modes.
 */
export function nonMaxSuppression(
    detections: Detection[],
    iouThreshold: number,
    options: NMSOptions = {}
): Detection[] {
    const { classAgnostic = false, maxDetections } = options;

    const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);
    const selected: Detection[] = [];

    for (const det of sorted) {
        if (maxDetections !== undefined && selected.length >= maxDetections) break;

        let keep = true;
        for (const sel of selected) {
            const sameClass = classAgnostic ? true : det.classId === sel.classId;
            if (sameClass) {
                const iou = calculateIoU(detectionToBox(det), detectionToBox(sel));
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
