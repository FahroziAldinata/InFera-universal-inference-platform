import { describe, it, expect, vi, beforeAll } from 'vitest';
import { drawDetections } from '../../utils/canvas';
import type { Detection } from '../../types';

beforeAll(() => {
    // Mock global window to test devicePixelRatio scaling
    if (typeof globalThis.window === 'undefined') {
        (globalThis as any).window = {
            devicePixelRatio: 2
        };
    }
    if (typeof globalThis.ImageData === 'undefined') {
        globalThis.ImageData = class MockImageData {
            width: number;
            height: number;
            data: Uint8ClampedArray;
            constructor(data: Uint8ClampedArray, width: number, height: number) {
                this.data = data;
                this.width = width;
                this.height = height;
            }
        } as any;
    }
    (globalThis as any).window.ImageData = globalThis.ImageData;
});

function createMockCanvas(w = 100, h = 100) {
    const ctx = {
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        rect: vi.fn(),
        fillRect: vi.fn(),
        stroke: vi.fn(),
        fill: vi.fn(),
        arc: vi.fn(),
        moveTo: vi.fn(),
        arcTo: vi.fn(),
        closePath: vi.fn(),
        fillText: vi.fn(),
        measureText: vi.fn().mockReturnValue({ width: 50 }),
        setLineDash: vi.fn(),
        scale: vi.fn(),
        clearRect: vi.fn(),
        drawImage: vi.fn(),
        putImageData: vi.fn(),
        roundRect: vi.fn(),
        strokeStyle: '',
        fillStyle: '',
        lineWidth: 0,
        globalAlpha: 1,
        font: '',
        textBaseline: '',
    } as any;

    return {
        width: w,
        height: h,
        style: {},
        getContext: vi.fn().mockReturnValue(ctx)
    } as any;
}

describe('drawDetections Integration (Tahap 5.5, 5.6 & 5.8)', () => {
    const mockDetections: Detection[] = [
        {
            classId: 0,
            className: 'person',
            confidence: 0.95,
            x: 10,
            y: 20,
            width: 100,
            height: 200
        },
        {
            classId: 1,
            className: 'car',
            confidence: 0.88,
            x: 150,
            y: 50,
            width: 80,
            height: 60
        }
    ];

    it('should scale canvas size by devicePixelRatio and adjust style attributes', () => {
        const canvas = createMockCanvas(300, 300);
        const stats = drawDetections(canvas, null, mockDetections);

        // DPR is mocked to 2
        expect(canvas.width).toBe(600);
        expect(canvas.height).toBe(600);
        expect(canvas.style.width).toBe('300px');
        expect(canvas.style.height).toBe('300px');

        const ctx = canvas.getContext('2d');
        expect(ctx.scale).toHaveBeenCalledWith(2, 2);
        expect(stats.totalDetections).toBe(2);
        expect(stats.renderTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should scale canvas to match input image dimensions if provided', () => {
        const canvas = createMockCanvas(10, 10);
        const mockImage = {
            width: 640,
            height: 480
        } as any;

        drawDetections(canvas, mockImage, mockDetections);

        // Under dpr = 2:
        expect(canvas.width).toBe(1280);
        expect(canvas.height).toBe(960);
        expect(canvas.style.width).toBe('640px');
        expect(canvas.style.height).toBe('480px');
    });

    it('should draw the background image onto canvas using drawImage', () => {
        const canvas = createMockCanvas(300, 300);
        const mockImage = {
            width: 300,
            height: 300
        } as any;

        drawDetections(canvas, mockImage, []);

        const ctx = canvas.getContext('2d');
        expect(ctx.drawImage).toHaveBeenCalledWith(mockImage, 0, 0, 300, 300);
    });

    it('should draw background ImageData correctly', () => {
        const canvas = createMockCanvas(10, 10);
        
        // Mock ImageData
        const mockImageData = new globalThis.ImageData(new Uint8ClampedArray(400), 10, 10);

        // Mock document.createElement to support temporary canvas drawing
        const originalCreateElement = typeof document !== 'undefined' ? document.createElement : null;
        const mockTempCtx = {
            putImageData: vi.fn()
        } as any;
        const mockTempCanvas = {
            width: 0,
            height: 0,
            getContext: vi.fn().mockReturnValue(mockTempCtx)
        } as any;

        if (typeof document === 'undefined') {
            (globalThis as any).document = {
                createElement: vi.fn().mockReturnValue(mockTempCanvas)
            } as any;
        } else {
            vi.spyOn(document, 'createElement').mockReturnValue(mockTempCanvas);
        }

        drawDetections(canvas, mockImageData, []);

        const ctx = canvas.getContext('2d');
        // Under dpr = 2, we draw via intermediate canvas:
        expect(mockTempCanvas.width).toBe(10);
        expect(mockTempCanvas.height).toBe(10);
        expect(mockTempCtx.putImageData).toHaveBeenCalledWith(mockImageData, 0, 0);
        expect(ctx.drawImage).toHaveBeenCalledWith(mockTempCanvas, 0, 0, 10, 10);

        // Restore global document if we set it
        if (originalCreateElement === null) {
            delete (globalThis as any).document;
        } else {
            vi.restoreAllMocks();
        }
    });

    it('should draw detections with custom options like cornerRadius, lineDash, and showCenterPoint', () => {
        const canvas = createMockCanvas(300, 300);
        const ctx = canvas.getContext('2d');

        drawDetections(canvas, null, mockDetections, {
            showCenterPoint: true,
            cornerRadius: 5,
            lineDash: [4, 4],
            showConfidence: false,
            fontSize: 12
        });

        // Corner radius was verified through rounded rectangle fallback or context call
        expect(ctx.roundRect).toHaveBeenCalled();
        expect(ctx.setLineDash).toHaveBeenCalledWith([4, 4]);

        // Draw center points arc: twice for two detections
        expect(ctx.arc).toHaveBeenCalledTimes(2);

        // Verify label does not print confidence percentage
        expect(ctx.fillText).toHaveBeenCalledWith('person', 16, 4); // Person label top (Y clamps)
    });
});
