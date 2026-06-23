import { describe, it, expect, vi } from 'vitest';
import { drawBoundingBox, drawCenterPoint } from '../draw_boxes';
import { drawBoundingBoxLabel } from '../draw_labels';

function createMockContext() {
    return {
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
        roundRect: vi.fn(),
        strokeStyle: '',
        fillStyle: '',
        lineWidth: 0,
        globalAlpha: 1,
        font: '',
        textBaseline: '',
    } as any;
}

describe('Drawing Utilities (Tahap 5.3 & 5.4)', () => {
    it('should draw a simple bounding box without rounded corners', () => {
        const ctx = createMockContext();
        drawBoundingBox(ctx, 10, 20, 100, 200, '#ff0000', { lineWidth: 4 });

        expect(ctx.save).toHaveBeenCalled();
        expect(ctx.rect).toHaveBeenCalledWith(10, 20, 100, 200);
        expect(ctx.stroke).toHaveBeenCalled();
        expect(ctx.restore).toHaveBeenCalled();
        expect(ctx.strokeStyle).toBe('#ff0000');
        expect(ctx.lineWidth).toBe(4);
    });

    it('should apply fillOpacity when filling the box', () => {
        const ctx = createMockContext();
        drawBoundingBox(ctx, 10, 20, 100, 200, '#ff0000', { fillOpacity: 0.5 });

        expect(ctx.fill).toHaveBeenCalled();
        expect(ctx.fillStyle).toBe('#ff0000');
    });

    it('should support rounded corners using roundRect if available', () => {
        const ctx = createMockContext();
        drawBoundingBox(ctx, 10, 20, 100, 200, '#ff0000', { cornerRadius: 8 });

        expect(ctx.roundRect).toHaveBeenCalledWith(10, 20, 100, 200, 8);
    });

    it('should fallback if roundRect is not a function', () => {
        const ctx = createMockContext();
        ctx.roundRect = undefined; // simulate old browser
        drawBoundingBox(ctx, 10, 20, 100, 200, '#ff0000', { cornerRadius: 8 });

        expect(ctx.arcTo).toHaveBeenCalled();
        expect(ctx.closePath).toHaveBeenCalled();
    });

    it('should set line dash if lineDash options are supplied', () => {
        const ctx = createMockContext();
        drawBoundingBox(ctx, 10, 20, 100, 200, '#ff0000', { lineDash: [5, 5] });

        expect(ctx.setLineDash).toHaveBeenCalledWith([5, 5]);
    });

    it('should draw center point circles', () => {
        const ctx = createMockContext();
        drawCenterPoint(ctx, 50, 50, '#00ff00', 5);

        expect(ctx.beginPath).toHaveBeenCalled();
        expect(ctx.arc).toHaveBeenCalledWith(50, 50, 5, 0, 2 * Math.PI);
        expect(ctx.fill).toHaveBeenCalled();
        expect(ctx.stroke).toHaveBeenCalled();
    });

    it('should draw a text label top position', () => {
        const ctx = createMockContext();
        drawBoundingBoxLabel(ctx, 'Person', 10, 50, 100, 100, '#ff0000', {
            fontSize: 12,
            labelPosition: 'top'
        });

        expect(ctx.font).toBe('12px sans-serif');
        // label height is 12 + 2 * 4 = 20.
        // rectY = y - labelHeight = 50 - 20 = 30.
        expect(ctx.fillRect).toHaveBeenCalledWith(10, 30, 62, 20); // 50 text width + 12 padding
        expect(ctx.fillText).toHaveBeenCalledWith('Person', 16, 34); // x + 6, rectY + 4
    });

    it('should clamp label position to top of canvas', () => {
        const ctx = createMockContext();
        drawBoundingBoxLabel(ctx, 'Person', 10, 5, 100, 100, '#ff0000', {
            fontSize: 12,
            labelPosition: 'top'
        });

        // rectY = 5 - 20 = -15 -> clamps to 0
        expect(ctx.fillRect).toHaveBeenCalledWith(10, 0, 62, 20);
    });

    it('should support bottom and inside positions', () => {
        const ctx = createMockContext();
        drawBoundingBoxLabel(ctx, 'Person', 10, 50, 100, 100, '#ff0000', {
            fontSize: 12,
            labelPosition: 'bottom'
        });
        // rectY = 50 + 100 = 150
        expect(ctx.fillRect).toHaveBeenCalledWith(10, 150, 62, 20);

        const ctx2 = createMockContext();
        drawBoundingBoxLabel(ctx2, 'Person', 10, 50, 100, 100, '#ff0000', {
            fontSize: 12,
            labelPosition: 'inside'
        });
        // rectY = 50
        expect(ctx2.fillRect).toHaveBeenCalledWith(10, 50, 62, 20);
    });
});
