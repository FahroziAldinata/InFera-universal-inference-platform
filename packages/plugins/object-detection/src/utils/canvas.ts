import type { Detection } from '../types';
import type { DrawOptions, DrawStatistics } from '../visualization/types';
import { drawBoundingBox, drawCenterPoint } from '../visualization/draw_boxes';
import { drawBoundingBoxLabel } from '../visualization/draw_labels';
import { getColorForClass } from '../visualization/colors';

function checkIsImageData(image: any): image is ImageData {
    return typeof ImageData !== 'undefined' && image instanceof ImageData;
}

/**
 * Draws bounding boxes, labels, and center points on a canvas element.
 * Scales the canvas automatically to support high-DPI (Retina) displays.
 * 
 * @param canvas The target HTMLCanvasElement to draw on.
 * @param image Optional source image/data to draw on the canvas background before overlays.
 * @param detections Array of objects containing detected bounding boxes and metadata.
 * @param options Styling configurations for the bounding boxes and text.
 * @returns Statistics regarding the rendering operation.
 */
export function drawDetections(
    canvas: HTMLCanvasElement,
    image: CanvasImageSource | ImageData | null,
    detections: Detection[],
    options: DrawOptions = {}
): DrawStatistics {
    const startTime = performance.now();

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    
    // 1. Determine target dimensions
    let targetWidth = canvas.width;
    let targetHeight = canvas.height;

    if (image) {
        if (checkIsImageData(image)) {
            targetWidth = image.width;
            targetHeight = image.height;
        } else {
            const img = image as any;
            targetWidth = img.naturalWidth || img.videoWidth || img.width || canvas.width;
            targetHeight = img.naturalHeight || img.videoHeight || img.height || canvas.height;
        }
    }

    // 2. Adjust canvas dimensions for Retina display
    canvas.width = targetWidth * dpr;
    canvas.height = targetHeight * dpr;

    if (typeof canvas.style === 'object' && canvas.style !== null) {
        canvas.style.width = `${targetWidth}px`;
        canvas.style.height = `${targetHeight}px`;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        return {
            totalDetections: detections.length,
            renderTimeMs: performance.now() - startTime
        };
    }

    // Clear and scale
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

    // 3. Draw background image/data if provided
    if (image) {
        if (checkIsImageData(image)) {
            if (dpr === 1) {
                ctx.putImageData(image, 0, 0);
            } else {
                // putImageData ignores scaling context, so draw onto a temp canvas first
                const tempCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
                if (tempCanvas) {
                    tempCanvas.width = image.width;
                    tempCanvas.height = image.height;
                    const tempCtx = tempCanvas.getContext('2d');
                    if (tempCtx) {
                        tempCtx.putImageData(image, 0, 0);
                        ctx.drawImage(tempCanvas, 0, 0, targetWidth, targetHeight);
                    }
                } else {
                    ctx.putImageData(image, 0, 0);
                }
            }
        } else {
            ctx.drawImage(image as CanvasImageSource, 0, 0, targetWidth, targetHeight);
        }
    }

    // 4. Extract rendering options
    const {
        lineWidth = 3,
        fontSize = 14,
        showLabels = true,
        showConfidence = true,
        showCenterPoint = false,
        classColors,
        opacity = 1,
        cornerRadius = 0,
        fillOpacity = 0,
        lineDash = [],
        labelPosition = 'top'
    } = options;

    // 5. Draw overlays for each detection
    for (const det of detections) {
        const { x, y, width, height } = det;
        const boxColor = det.color || getColorForClass(det.classId, classColors);

        // Draw bounding box outline (and fill)
        drawBoundingBox(ctx, x, y, width, height, boxColor, {
            lineWidth,
            lineDash,
            cornerRadius,
            fillOpacity,
            opacity
        });

        // Draw center point dot if requested
        if (showCenterPoint) {
            const centerX = x + width / 2;
            const centerY = y + height / 2;
            drawCenterPoint(ctx, centerX, centerY, boxColor, Math.max(3, lineWidth));
        }

        // Draw label box and text if requested
        if (showLabels) {
            let labelText = det.className;
            if (showConfidence) {
                labelText += ` (${(det.confidence * 100).toFixed(1)}%)`;
            }
            drawBoundingBoxLabel(ctx, labelText, x, y, width, height, boxColor, {
                fontSize,
                labelPosition,
                opacity
            });
        }
    }

    return {
        totalDetections: detections.length,
        renderTimeMs: performance.now() - startTime
    };
}
