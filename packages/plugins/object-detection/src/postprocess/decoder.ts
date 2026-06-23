import type { Tensor } from '@infera/core';
import type { Detection, DetectionModelMetadata } from '../types';

/**
 * Decodes the output tensor of detection models based on architecture
 */
export function decodeOutput(
    outputTensor: Tensor,
    modelMetadata: DetectionModelMetadata,
    confidenceThreshold: number
): Detection[] {
    // Skeleton implementation for Phase 1
    console.log('[decoder] Decoding output tensor with dims:', outputTensor.dims, 'architecture:', modelMetadata.architecture);
    return [];
}
