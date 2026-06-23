import type { LetterboxResult } from '../types';
import { LETTERBOX_COLOR } from '../constants';

/**
 * Resizes an ImageData object maintaining aspect ratio, padding the rest with a specific color
 */
export function letterboxImage(
    imageData: ImageData,
    targetWidth: number,
    targetHeight: number
): LetterboxResult {
    const srcW = imageData.width;
    const srcH = imageData.height;

    const scale = Math.min(targetWidth / srcW, targetHeight / srcH);
    const newW = srcW * scale;
    const newH = srcH * scale;
    const padX = (targetWidth - newW) / 2;
    const padY = (targetHeight - newH) / 2;

    const srcCanvas = new OffscreenCanvas(srcW, srcH);
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

    // Fill with padding color (standard [114, 114, 114])
    const [r, g, b] = LETTERBOX_COLOR;
    destCtx.fillStyle = `rgb(${r},${g},${b})`;
    destCtx.fillRect(0, 0, targetWidth, targetHeight);

    // Draw scaled image centered
    destCtx.drawImage(srcCanvas, padX, padY, newW, newH);
    const letterboxedData = destCtx.getImageData(0, 0, targetWidth, targetHeight);

    return {
        imageData: letterboxedData,
        scale,
        padX,
        padY,
    };
}
