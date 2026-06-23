/**
 * Preprocess utility for resizing input image using canvas
 */
export async function resizeImage(
    input: HTMLImageElement | ImageBitmap,
    targetWidth: number,
    targetHeight: number
): Promise<ImageData> {
    const canvas = new OffscreenCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Canvas 2D context is not available');
    }
    ctx.drawImage(input, 0, 0, targetWidth, targetHeight);
    return ctx.getImageData(0, 0, targetWidth, targetHeight);
}
