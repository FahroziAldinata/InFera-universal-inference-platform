/**
 * Rearranges flat Float32Array pixel data from HWC (Height, Width, Channels)
 * to CHW (Channels, Height, Width) format.
 * Target format is standard for ONNX models [1, 3, H, W]
 */
export function toCHWTensor(
    hwcData: Float32Array,
    width: number,
    height: number
): Float32Array {
    const totalPixels = width * height;
    const chwData = new Float32Array(3 * totalPixels);

    for (let i = 0; i < totalPixels; i++) {
        const r = hwcData[i * 3]!;
        const g = hwcData[i * 3 + 1]!;
        const b = hwcData[i * 3 + 2]!;

        chwData[i] = r;                  // R channel
        chwData[i + totalPixels] = g;      // G channel
        chwData[i + 2 * totalPixels] = b;  // B channel
    }

    return chwData;
}
