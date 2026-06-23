import { describe, it, expect, vi } from 'vitest';
import * as ort from 'onnxruntime-web';
import { runInference } from '../inference';
import type { Tensor } from '@infera/core';

describe('Inference Engine', () => {
    it('should successfully run inference and convert output tensors', async () => {
        const mockRun = vi.fn().mockResolvedValue({
            output0: {
                data: new Float32Array([0.1, 0.2, 0.3]),
                dims: [1, 3],
                type: 'float32',
            },
        });

        const mockSession = {
            inputNames: ['images'],
            outputNames: ['output0'],
            run: mockRun,
        } as unknown as ort.InferenceSession;

        const inputTensor: Tensor = {
            data: new Float32Array([1, 2, 3]),
            dims: [1, 3],
            type: 'float32',
        };

        const result = await runInference(mockSession, inputTensor);
        
        expect(mockRun).toHaveBeenCalled();
        expect(result.outputs['output0']).toBeDefined();
        expect(result.outputs['output0']!.dims).toEqual([1, 3]);
        expect(result.outputs['output0']!.data).toEqual(new Float32Array([0.1, 0.2, 0.3]));
    });

    it('should throw an error if model has no inputs', async () => {
        const mockSession = {
            inputNames: [],
            outputNames: ['output0'],
        } as unknown as ort.InferenceSession;

        const inputTensor: Tensor = {
            data: new Float32Array([]),
            dims: [1, 0],
            type: 'float32',
        };

        await expect(runInference(mockSession, inputTensor)).rejects.toThrow('Model ONNX tidak memiliki input yang valid.');
    });
});
