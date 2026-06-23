/**
 * Normalization helper converting RGBA to NCHW Float32Array format
 */
export function normalizePixels(
    rgba: Uint8ClampedArray,
    normalize: boolean
): Float32Array {
    const totalPixels = rgba.length / 4;
    const floatData = new Float32Array(3 * totalPixels);
    for (let i = 0; i < totalPixels; i++) {
        const r = rgba[i * 4]!;
        const g = rgba[i * 4 + 1]!;
        const b = rgba[i * 4 + 2]!;
        if (normalize) {
            floatData[i] = r / 255.0;
            floatData[i + totalPixels] = g / 255.0;
            floatData[i + totalPixels * 2] = b / 255.0;
        } else {
            floatData[i] = r;
            floatData[i + totalPixels] = g;
            floatData[i + totalPixels * 2] = b;
        }
    }
    return floatData;
}
