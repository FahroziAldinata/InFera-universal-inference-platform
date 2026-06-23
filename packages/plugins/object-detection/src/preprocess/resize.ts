import type { ResizeResult } from '../types';

/**
 * Resizes an ImageData object to target width and height using OffscreenCanvas
 */
export function resizeImage(
    imageData: ImageData,
    targetWidth: number,
    targetHeight: number
): ResizeResult {
    const srcWidth = imageData.width;
    const srcHeight = imageData.height;

    const srcCanvas = new OffscreenCanvas(srcWidth, srcHeight);
    const srcCtx = srcCanvas.getContext('2d');
    if (!srcCtx) {
        throw new Error('Could not get source OffscreenCanvas 2D context');
    }
    srcCtx.putImageData(imageData, 0, 0);

    const destCanvas = new OffscreenCanvas(targetWidth, targetHeight);
    const destCtx = destCanvas.getContext('2d');
    if (!destCtx) {
        throw new Error('Could not get destination OffscreenCanvas 2D context');
    }

    destCtx.drawImage(srcCanvas, 0, 0, targetWidth, targetHeight);
    const resizedData = destCtx.getImageData(0, 0, targetWidth, targetHeight);

    return {
        imageData: resizedData,
        width: targetWidth,
        height: targetHeight,
    };
}
