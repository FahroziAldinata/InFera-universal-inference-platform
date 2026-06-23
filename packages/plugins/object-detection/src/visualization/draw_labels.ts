/**
 * Draws a label text with a colored background box.
 * Handles clamping to prevent label from going off-canvas at the top.
 */
export function drawBoundingBoxLabel(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    _w: number,
    h: number,
    color: string,
    options: {
        fontSize?: number;
        labelPosition?: 'top' | 'inside' | 'bottom';
        opacity?: number;
    } = {}
): void {
    const {
        fontSize = 14,
        labelPosition = 'top',
        opacity = 1
    } = options;

    ctx.save();
    ctx.globalAlpha = opacity;

    // Configure text styling
    ctx.font = `${fontSize}px sans-serif`;
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;

    const paddingX = 6;
    const paddingY = 4;
    const labelHeight = fontSize + paddingY * 2;
    const labelWidth = textWidth + paddingX * 2;

    let rectX = x;
    let rectY = y;

    if (labelPosition === 'top') {
        rectY = y - labelHeight;
        if (rectY < 0) {
            rectY = 0; // clamp to top
        }
    } else if (labelPosition === 'inside') {
        rectY = y;
    } else if (labelPosition === 'bottom') {
        rectY = y + h;
    }

    // Draw label background
    ctx.fillStyle = color;
    ctx.fillRect(rectX, rectY, labelWidth, labelHeight);

    // Draw text inside label background
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'top';
    ctx.fillText(text, rectX + paddingX, rectY + paddingY);

    ctx.restore();
}
