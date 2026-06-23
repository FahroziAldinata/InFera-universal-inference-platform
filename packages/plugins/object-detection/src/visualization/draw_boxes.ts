/**
 * Fallback implementation for drawing a rounded rectangle path on CanvasRenderingContext2D.
 */
function drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
): void {
    if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, w, h, r);
        return;
    }
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

/**
 * Draws a customizable bounding box on a canvas rendering context.
 */
export function drawBoundingBox(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    options: {
        lineWidth?: number;
        lineDash?: number[];
        cornerRadius?: number;
        fillOpacity?: number;
        opacity?: number;
    } = {}
): void {
    const {
        lineWidth = 3,
        lineDash = [],
        cornerRadius = 0,
        fillOpacity = 0,
        opacity = 1
    } = options;

    ctx.save();

    // Set overall opacity
    ctx.globalAlpha = opacity;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    
    if (lineDash && lineDash.length > 0) {
        ctx.setLineDash(lineDash);
    } else {
        ctx.setLineDash([]);
    }

    // Begin drawing box path
    ctx.beginPath();
    if (cornerRadius > 0) {
        drawRoundedRect(ctx, x, y, w, h, cornerRadius);
    } else {
        ctx.rect(x, y, w, h);
    }

    // Fill background if fillOpacity is specified
    if (fillOpacity > 0) {
        ctx.save();
        ctx.globalAlpha = opacity * fillOpacity;
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
    }

    // Draw stroke outline
    ctx.stroke();

    ctx.restore();
}

/**
 * Draws a center point dot on canvas.
 */
export function drawCenterPoint(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    color: string,
    radius = 4
): void {
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    // Add white border for contrast
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
}
