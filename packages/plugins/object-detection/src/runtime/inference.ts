import * as ort from 'onnxruntime-web';
import type { Tensor } from '@infera/core';

export interface RawDetectionOutput {
    outputs: Record<string, Tensor>;
}

/**
 * Runs inference on an active InferenceSession using a single input Tensor.
 * Maps output tensors to framework-agnostic Tensor formats.
 */
export async function runInference(
    session: ort.InferenceSession,
    inputTensor: Tensor
): Promise<RawDetectionOutput> {
    const inputName = session.inputNames[0];
    if (!inputName) {
        throw new Error('Model ONNX tidak memiliki input yang valid.');
    }

    const ortTensor = new ort.Tensor(
        mapTensorType(inputTensor.type),
        inputTensor.data,
        inputTensor.dims
    );

    const feeds = { [inputName]: ortTensor };
    const results = await session.run(feeds);

    const outputs: Record<string, Tensor> = {};
    for (const [name, ortOutputTensor] of Object.entries(results)) {
        outputs[name] = {
            data: ortOutputTensor.data as Float32Array | Uint8Array | Int32Array,
            dims: [...ortOutputTensor.dims],
            type: mapOrtTypeToTensorType(ortOutputTensor.type),
        };
    }

    return { outputs };
}

function mapTensorType(type: Tensor['type']): ort.Tensor.Type {
    switch (type) {
        case 'float32':
            return 'float32';
        case 'uint8':
            return 'uint8';
        case 'int32':
            return 'int32';
        case 'int64':
            return 'int64';
        case 'string':
            return 'string';
        default:
            throw new Error(`Tipe tensor "${type}" tidak didukung.`);
    }
}

function mapOrtTypeToTensorType(ortType: string): Tensor['type'] {
    if (ortType === 'float32') return 'float32';
    if (ortType === 'uint8') return 'uint8';
    if (ortType === 'int32') return 'int32';
    if (ortType === 'int64') return 'int64';
    if (ortType === 'string') return 'string';
    return 'float32';
}
