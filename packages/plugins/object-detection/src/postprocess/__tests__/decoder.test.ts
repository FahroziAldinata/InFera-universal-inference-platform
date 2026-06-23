import { describe, it, expect } from 'vitest';
import { decodeYOLOv5 } from '../yolov5_decoder';
import { decodeYOLOv8 } from '../yolov8_decoder';
import { decodeYOLO } from '../decoder';
import type { Tensor } from '@infera/core';
import type { DetectionModelMetadata } from '../../model_metadata';

const METADATA: DetectionModelMetadata = {
    inputWidth: 640,
    inputHeight: 640,
    classNames: ['person', 'car', 'bicycle'],
    outputNames: ['output0'],
    confidenceThreshold: 0.25,
    iouThreshold: 0.45,
};

describe('YOLOv5 Decoder', () => {
    it('should decode a single high-confidence detection', () => {
        // Shape: [1, 1, 8] — 1 candidate, 3 classes + 5 box fields
        const data = new Float32Array([
            320, 240, 100, 80, // cx, cy, w, h
            0.9,               // objectness
            0.95, 0.01, 0.02, // class confs
        ]);
        const tensor: Tensor = { data, dims: [1, 1, 8], type: 'float32' };
        const dets = decodeYOLOv5(tensor, METADATA, 0.25);

        expect(dets.length).toBe(1);
        expect(dets[0]!.classId).toBe(0);
        expect(dets[0]!.className).toBe('person');
        expect(dets[0]!.confidence).toBeCloseTo(0.9 * 0.95);
        // x = cx - w/2 = 320 - 50 = 270
        expect(dets[0]!.x).toBeCloseTo(270);
        expect(dets[0]!.y).toBeCloseTo(200);
    });

    it('should filter detections below confidence threshold', () => {
        const data = new Float32Array([320, 240, 100, 80, 0.1, 0.5, 0.3, 0.2]);
        const tensor: Tensor = { data, dims: [1, 1, 8], type: 'float32' };
        const dets = decodeYOLOv5(tensor, METADATA, 0.25);
        expect(dets.length).toBe(0);
    });
});

describe('YOLOv8 Decoder', () => {
    it('should decode a single high-confidence detection', () => {
        // Shape: [1, 7, 1] — 1 candidate, 3 classes + 4 box fields
        // columns are candidates, rows are [cx, cy, w, h, class0, class1, class2]
        const data = new Float32Array([
            320, // cx for candidate 0
            240, // cy
            100, // w
            80,  // h
            0.9, // class0 (person) conf
            0.1, // class1 conf
            0.0, // class2 conf
        ]);
        const tensor: Tensor = { data, dims: [1, 7, 1], type: 'float32' };
        const dets = decodeYOLOv8(tensor, METADATA, 0.25);

        expect(dets.length).toBe(1);
        expect(dets[0]!.classId).toBe(0);
        expect(dets[0]!.className).toBe('person');
        expect(dets[0]!.confidence).toBeCloseTo(0.9);
        expect(dets[0]!.x).toBeCloseTo(270);
    });

    it('should filter detections below confidence threshold', () => {
        const data = new Float32Array([320, 240, 100, 80, 0.1, 0.05, 0.05]);
        const tensor: Tensor = { data, dims: [1, 7, 1], type: 'float32' };
        const dets = decodeYOLOv8(tensor, METADATA, 0.25);
        expect(dets.length).toBe(0);
    });
});

describe('YOLO Auto-Decoder', () => {
    it('should auto-detect YOLOv5 format via shape [1, large, small]', () => {
        const numCandidates = 25;
        const stride = 8; // 5 + 3 classes
        const data = new Float32Array(numCandidates * stride).fill(0);
        // First candidate: strong detection
        data[0] = 100; data[1] = 100; data[2] = 50; data[3] = 50;
        data[4] = 0.9; data[5] = 0.9; data[6] = 0.05; data[7] = 0.05;

        const tensor: Tensor = { data, dims: [1, numCandidates, stride], type: 'float32' };
        const dets = decodeYOLO(tensor, METADATA, 0.25);
        expect(dets.length).toBeGreaterThan(0);
    });

    it('should auto-detect YOLOv8 format via shape [1, small, large]', () => {
        const numCandidates = 25;
        const numRows = 7; // 4 + 3 classes
        const data = new Float32Array(numRows * numCandidates).fill(0);
        // First candidate column
        data[0 * numCandidates] = 100; // cx
        data[1 * numCandidates] = 100; // cy
        data[2 * numCandidates] = 50;  // w
        data[3 * numCandidates] = 50;  // h
        data[4 * numCandidates] = 0.9; // class0

        const tensor: Tensor = { data, dims: [1, numRows, numCandidates], type: 'float32' };
        const metaV8 = { ...METADATA, architecture: 'yolov8' as const };
        const dets = decodeYOLO(tensor, metaV8, 0.25);
        expect(dets.length).toBeGreaterThan(0);
    });

    it('should throw on unsupported tensor rank', () => {
        const tensor: Tensor = { data: new Float32Array([1, 2]), dims: [1, 2], type: 'float32' };
        expect(() => decodeYOLO(tensor, METADATA, 0.25)).toThrow('Unsupported YOLO output shape');
    });
});
