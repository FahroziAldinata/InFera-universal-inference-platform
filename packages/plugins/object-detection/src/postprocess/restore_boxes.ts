import type { Detection } from '../types';

/**
 * Spatial transform metadata produced by the preprocessing pipeline.
 * Used to map coordinates from letterboxed model-input space back to
 * the original image space.
 */
export interface LetterboxMeta {
    /** Scale factor applied uniformly to both axes */
    scale: number;
    /** Horizontal padding (pixels added to each side) */
    padX: number;
    /** Vertical padding (pixels added to each side) */
    padY: number;
    /** Original image width (before preprocessing) */
    originalWidth: number;
    /** Original image height (before preprocessing) */
    originalHeight: number;
}

/**
 * Converts a single coordinate value from model-input space to original image space.
 *
 * Formula: original_coord = (model_coord - pad) / scale
 */
function restoreCoord(value: number, pad: number, scale: number): number {
    return (value - pad) / scale;
}

/**
 * Restores bounding box coordinates from letterboxed model-input space to
 * original image pixel space, clamped to the original image dimensions.
 *
 * All coordinates in Detection are expected to be in the model's input resolution
 * (e.g. 640x640), including any letterbox padding offsets.
 */
export function restoreBoxes(
    detections: Detection[],
    meta: LetterboxMeta
): Detection[] {
    const { scale, padX, padY, originalWidth, originalHeight } = meta;

    return detections.map((det) => {
        const x = Math.max(0, restoreCoord(det.x, padX, scale));
        const y = Math.max(0, restoreCoord(det.y, padY, scale));
        const x2 = Math.min(originalWidth,  restoreCoord(det.x + det.width,  padX, scale));
        const y2 = Math.min(originalHeight, restoreCoord(det.y + det.height, padY, scale));

        return {
            ...det,
            x,
            y,
            width:  Math.max(0, x2 - x),
            height: Math.max(0, y2 - y),
        };
    });
}
