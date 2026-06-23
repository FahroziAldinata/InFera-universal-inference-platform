/**
 * Normalizes pixel values of ImageData from [0-255] to [0.0-1.0], discarding the Alpha channel.
 * Output is a flat Float32Array in HWC format: [R0, G0, B0, R1, G1, B1, ...]
 */
export function normalizePixels(
    imageData: ImageData
): Float32Array {
    const { data } = imageData;
    const totalPixels = imageData.width * imageData.height;
    const normalized = new Float32Array(totalPixels * 3);

    for (let i = 0; i < totalPixels; i++) {
        const r = data[i * 4]!;
        const g = data[i * 4 + 1]!;
        const b = data[i * 4 + 2]!;

        normalized[i * 3] = r / 255.0;
        normalized[i * 3 + 1] = g / 255.0;
        normalized[i * 3 + 2] = b / 255.0;
    }

    return normalized;
}
