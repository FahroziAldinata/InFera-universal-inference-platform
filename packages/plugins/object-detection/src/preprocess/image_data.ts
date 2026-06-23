/**
 * Decodes a File, HTMLImageElement, or ImageBitmap into ImageData using OffscreenCanvas
 */
export async function fileToImageData(
    input: File | HTMLImageElement | ImageBitmap | ImageData
): Promise<ImageData> {
    if (
        (typeof ImageData !== 'undefined' && input instanceof ImageData) ||
        (typeof input === 'object' && input !== null && 'width' in input && 'height' in input && 'data' in input && !('close' in input))
    ) {
        return input as ImageData;
    }
    let bitmap: ImageBitmap;
    if (input instanceof File || input instanceof Blob) {
        bitmap = await createImageBitmap(input);
    } else if (input instanceof HTMLImageElement) {
        if (!input.complete) {
            await new Promise<void>((resolve, reject) => {
                input.onload = () => resolve();
                input.onerror = () => reject(new Error('Failed to load image element'));
            });
        }
        bitmap = await createImageBitmap(input);
    } else if (
        input instanceof ImageBitmap ||
        (typeof input === 'object' && input !== null && 'width' in input && 'height' in input && 'close' in input)
    ) {
        bitmap = input as ImageBitmap;
    } else {
        throw new Error('Unsupported input type for fileToImageData');
    }

    const { width, height } = bitmap;
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Could not get OffscreenCanvas 2D context');
    }
    ctx.drawImage(bitmap, 0, 0);
    const imgData = ctx.getImageData(0, 0, width, height);

    // Close the temporary ImageBitmap to avoid memory leaks
    if (input !== bitmap) {
        bitmap.close();
    }
    return imgData;
}
