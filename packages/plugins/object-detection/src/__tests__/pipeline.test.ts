import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectDetectionPlugin } from '../plugin';

// ─── Mock onnxruntime-web ─────────────────────────────────────────────────────
const { MockTensor, mockRun, mockSession } = vi.hoisted(() => {
    class MockTensor {
        constructor(
            public type: string,
            public data: Float32Array | number[],
            public dims: number[]
        ) {}
    }

    const mockRun = vi.fn();
    const mockSession = {
        run: mockRun,
        outputNames: ['output0'],
        inputNames: ['images'],
        release: vi.fn(),
    };

    return { MockTensor, mockRun, mockSession };
});

vi.mock('onnxruntime-web', () => ({
    InferenceSession: {
        create: vi.fn().mockResolvedValue(mockSession),
    },
    Tensor: MockTensor,
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a YOLOv8-shaped output: [1, 4+numClasses, numCandidates]
 *
 * numCandidates MUST be > numRows for auto-detection to work:
 *   auto-detect condition: d1 < d2 && d1 > 4
 *   d1 = 4 + numClasses, d2 = numCandidates
 *
 * Injects one strong detection for class 0 at the specified candidate index.
 */
function makeYOLOv8Tensor(
    numClasses = 3,
    numCandidates = 25,
    cx = 320, cy = 320, w = 100, h = 100,
    classConf = 0.9
): InstanceType<typeof MockTensor> {
    const numRows = 4 + numClasses;
    const data = new Float32Array(numRows * numCandidates).fill(0);

    // Candidate 0
    data[0 * numCandidates + 0] = cx;
    data[1 * numCandidates + 0] = cy;
    data[2 * numCandidates + 0] = w;
    data[3 * numCandidates + 0] = h;
    data[4 * numCandidates + 0] = classConf; // class0

    return new MockTensor('float32', data, [1, numRows, numCandidates]);
}

function makePreprocessResult(scale = 1, padX = 0, padY = 0) {
    return {
        data: new Float32Array(3 * 640 * 640),
        dims: [1, 3, 640, 640],
        type: 'float32' as const,
        inputWidth: 640,
        inputHeight: 640,
        originalWidth: 640,
        originalHeight: 640,
        scale,
        padX,
        padY,
    };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ObjectDetectionPlugin — Pipeline (Tahap 4.5)', () => {
    let plugin: ObjectDetectionPlugin;

    beforeEach(() => {
        plugin = new ObjectDetectionPlugin({
            confidenceThreshold: 0.5,
            iouThreshold: 0.45,
            normalize: false,
        });
        mockRun.mockReset();
    });

    it('should produce detections from a YOLOv8-format mock output (happy path)', async () => {
        const pre = makePreprocessResult(1, 0, 0);
        vi.spyOn(plugin as any, 'preprocess').mockResolvedValue(pre);

        await plugin.loadModel(new File([new Uint8Array(4)], 'test.onnx'));
        plugin.loadLabels('person\ncar\nbicycle');

        const outTensor = makeYOLOv8Tensor(3, 25, 320, 320, 100, 100, 0.9);
        mockRun.mockResolvedValue({ output0: outTensor });

        const result = await plugin.predict({});

        expect(result.data.detections.length).toBeGreaterThan(0);
        const det = result.data.detections[0]!;
        expect(det.className).toBe('person');
        expect(det.confidence).toBeCloseTo(0.9);
        // x = cx - w/2 = 320 - 50 = 270
        expect(det.x).toBeCloseTo(270);
        expect(det.y).toBeCloseTo(270);
        expect(det.width).toBeCloseTo(100);
        expect(det.height).toBeCloseTo(100);
    });

    it('should return empty detections when all candidates are below threshold', async () => {
        const pre = makePreprocessResult();
        vi.spyOn(plugin as any, 'preprocess').mockResolvedValue(pre);
        await plugin.loadModel(new File([new Uint8Array(4)], 'test.onnx'));
        plugin.loadLabels('person\ncar');

        // All values = 0.01, well below conf threshold of 0.5
        const numRows = 6; // 4 + 2 classes
        const numCandidates = 25;
        const data = new Float32Array(numRows * numCandidates).fill(0.01);
        const tensor = new MockTensor('float32', data, [1, numRows, numCandidates]);
        mockRun.mockResolvedValue({ output0: tensor });

        const result = await plugin.predict({});
        expect(result.data.detections).toHaveLength(0);
    });

    it('should apply NMS and remove heavily overlapping duplicate boxes', async () => {
        const pre = makePreprocessResult();
        vi.spyOn(plugin as any, 'preprocess').mockResolvedValue(pre);
        await plugin.loadModel(new File([new Uint8Array(4)], 'test.onnx'));
        plugin.loadLabels('person\ncar\nbicycle');

        const numRows = 7; // 4 + 3 classes
        const numCandidates = 25;
        const data = new Float32Array(numRows * numCandidates).fill(0);

        // Candidate 0: strong detection
        data[0 * numCandidates + 0] = 320; data[1 * numCandidates + 0] = 320;
        data[2 * numCandidates + 0] = 100; data[3 * numCandidates + 0] = 100;
        data[4 * numCandidates + 0] = 0.9;

        // Candidate 1: slightly shifted, same class, should be suppressed by NMS
        data[0 * numCandidates + 1] = 322; data[1 * numCandidates + 1] = 322;
        data[2 * numCandidates + 1] = 100; data[3 * numCandidates + 1] = 100;
        data[4 * numCandidates + 1] = 0.85;

        const tensor = new MockTensor('float32', data, [1, numRows, numCandidates]);
        mockRun.mockResolvedValue({ output0: tensor });

        const result = await plugin.predict({});
        // NMS should suppress the second box (very high IoU)
        expect(result.data.detections.length).toBe(1);
        expect(result.data.detections[0]!.confidence).toBeCloseTo(0.9);
    });

    it('should restore boxes correctly after letterboxing (scale < 1)', async () => {
        // Original image 1280×640 → model input 640×640
        // scale = 0.5, padY = (640 - 640*0.5)/2 = 160
        const pre = makePreprocessResult(0.5, 0, 160);
        pre.originalWidth = 1280;
        pre.originalHeight = 640;
        vi.spyOn(plugin as any, 'preprocess').mockResolvedValue(pre);

        await plugin.loadModel(new File([new Uint8Array(4)], 'test.onnx'));
        plugin.loadLabels('person\ncar\nbicycle');

        // Detection at model coords: center (320, 320), size (100, 80)
        // → x_model = 270, y_model = 280
        // Restored: x = (270-0)/0.5 = 540, y = (280-160)/0.5 = 240, w = 200, h = 160
        const numRows = 7;
        const numCandidates = 25;
        const data = new Float32Array(numRows * numCandidates).fill(0);
        data[0 * numCandidates + 0] = 320; // cx
        data[1 * numCandidates + 0] = 320; // cy
        data[2 * numCandidates + 0] = 100; // w
        data[3 * numCandidates + 0] = 80;  // h
        data[4 * numCandidates + 0] = 0.9; // class0

        const tensor = new MockTensor('float32', data, [1, numRows, numCandidates]);
        mockRun.mockResolvedValue({ output0: tensor });

        const result = await plugin.predict({});
        const det = result.data.detections[0];
        expect(det).toBeDefined();
        expect(det!.x).toBeCloseTo(540);
        expect(det!.y).toBeCloseTo(240);
        expect(det!.width).toBeCloseTo(200);
        expect(det!.height).toBeCloseTo(160);
    });
});
