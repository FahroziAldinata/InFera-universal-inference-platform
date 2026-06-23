import type { Detection } from '../types';

/**
 * Draws bounding boxes and labels on canvas element
 */
export function drawDetections(
    canvas: HTMLCanvasElement,
    detections: Detection[]
): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    for (const det of detections) {
        const { x, y, width, height } = det;
        
        // Draw bounding box
        ctx.strokeStyle = det.color || '#ff0000';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        // Draw label background
        ctx.fillStyle = det.color || '#ff0000';
        const label = `${det.className} (${(det.confidence * 100).toFixed(1)}%)`;
        ctx.font = '14px sans-serif';
        const textWidth = ctx.measureText(label).width;
        ctx.fillRect(x, y - 20, textWidth + 10, 20);

        // Draw label text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, x + 5, y - 5);
    }
}
