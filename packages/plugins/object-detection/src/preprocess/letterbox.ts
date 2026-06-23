export interface LetterboxInfo {
    scale: number;
    padX: number;
    padY: number;
}

/**
 * Resize image keeping aspect ratio (letterboxing with black bars)
 */
export async function letterboxImage(
    input: HTMLImageElement | ImageBitmap,
    targetWidth: number,
    targetHeight: number
): Promise<{ imageData: ImageData; info: LetterboxInfo }> {
    const canvas = new OffscreenCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Canvas 2D context is not available');
    }
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    
    const srcW = input.width;
    const srcH = input.height;
    const scale = Math.min(targetWidth / srcW, targetHeight / srcH);
    const newW = srcW * scale;
    const newH = srcH * scale;
    const padX = (targetWidth - newW) / 2;
    const padY = (targetHeight - newH) / 2;

    ctx.drawImage(input, padX, padY, newW, newH);
    const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    return { imageData, info: { scale, padX, padY } };
}
