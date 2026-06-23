/**
 * Exports canvas content to a Blob.
 */
export function exportCanvasToBlob(
    canvas: HTMLCanvasElement,
    type = 'image/png',
    quality?: number
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        if (typeof canvas.toBlob !== 'function') {
            reject(new Error('canvas.toBlob tidak didukung di lingkungan ini'));
            return;
        }
        try {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Gagal mengekspor canvas ke Blob'));
                    }
                },
                type,
                quality
            );
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Exports canvas content to a PNG Blob.
 */
export function exportCanvasToPNG(canvas: HTMLCanvasElement): Promise<Blob> {
    return exportCanvasToBlob(canvas, 'image/png');
}

/**
 * Exports canvas content to a JPEG Blob.
 */
export function exportCanvasToJPEG(canvas: HTMLCanvasElement, quality = 0.92): Promise<Blob> {
    return exportCanvasToBlob(canvas, 'image/jpeg', quality);
}

/**
 * Exports canvas content directly to a DataURL string.
 */
export function exportCanvasToDataURL(
    canvas: HTMLCanvasElement,
    type = 'image/png',
    quality?: number
): string {
    if (typeof canvas.toDataURL !== 'function') {
        throw new Error('canvas.toDataURL tidak didukung di lingkungan ini');
    }
    return canvas.toDataURL(type, quality);
}
