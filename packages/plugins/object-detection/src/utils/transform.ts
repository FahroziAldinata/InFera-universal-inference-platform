export interface Point {
    x: number;
    y: number;
}

/**
 * Converts screen/viewport coordinates (e.g. clientX, clientY) to canvas-relative coordinates.
 */
export function screenToCanvas(
    clientX: number,
    clientY: number,
    canvasBoundingRect: { left: number; top: number }
): Point {
    return {
        x: clientX - canvasBoundingRect.left,
        y: clientY - canvasBoundingRect.top,
    };
}

/**
 * Converts canvas-relative coordinates back to screen/viewport coordinates.
 */
export function canvasToScreen(
    canvasX: number,
    canvasY: number,
    canvasBoundingRect: { left: number; top: number }
): Point {
    return {
        x: canvasX + canvasBoundingRect.left,
        y: canvasY + canvasBoundingRect.top,
    };
}

/**
 * Maps a coordinate on the original image to its rendered coordinate on the canvas under zoom and pan.
 */
export function imageToCanvas(
    imageX: number,
    imageY: number,
    zoom: number,
    panX: number,
    panY: number
): Point {
    return {
        x: imageX * zoom + panX,
        y: imageY * zoom + panY,
    };
}

/**
 * Maps a canvas-relative coordinate back to its original coordinate on the source image under zoom and pan.
 */
export function canvasToImage(
    canvasX: number,
    canvasY: number,
    zoom: number,
    panX: number,
    panY: number
): Point {
    return {
        x: (canvasX - panX) / zoom,
        y: (canvasY - panY) / zoom,
    };
}
