import { useCallback } from 'react';
import { useDetectionStore } from '../store/detectionStore';

/** Zoom constraints */
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 10;

/**
 * Viewport hook for the detection canvas.
 *
 * Design:
 *  - No pan/drag — the image is always centered in the container.
 *  - Zoom is center-based (scales around the image center, not cursor).
 *  - `fitToCenter()` calculates the scale + offset to fit and center
 *    the image inside the container with a small padding margin.
 */
export function useCanvasViewport(containerRef: React.RefObject<HTMLDivElement | null>) {
    const setZoom = useDetectionStore((s) => s.setZoom);
    const setPan = useDetectionStore((s) => s.setPan);
    const imageWidth = useDetectionStore((s) => s.imageWidth);
    const imageHeight = useDetectionStore((s) => s.imageHeight);
    const zoom = useDetectionStore((s) => s.zoom);

    /**
     * Computes the centered panX/panY and updates both zoom and pan in the store.
     * Under transform-origin center center, the pan coordinates align the unscaled 
     * image's center with the container's center and do not change with zoom level.
     */
    const applyCenteredZoom = useCallback((newZoom: number, customWidth?: number, customHeight?: number) => {
        const w = customWidth ?? imageWidth;
        const h = customHeight ?? imageHeight;
        if (!containerRef.current || !w || !h) return;
        const clampedZoom = Math.max(MIN_ZOOM, Math.min(newZoom, MAX_ZOOM));
        setZoom(clampedZoom);
        setPan(0, 0); // Centering is handled by CSS absolute positioning
    }, [containerRef, imageWidth, imageHeight, setZoom, setPan]);

    /**
     * Fits the image inside the container with a 90% padding margin
     * and centers it. This is the initial/reset view.
     */
    const fitToCenter = useCallback((customWidth?: number, customHeight?: number) => {
        const w = customWidth ?? imageWidth;
        const h = customHeight ?? imageHeight;
        if (w && h && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const scaleX = rect.width / w;
            const scaleY = rect.height / h;
            const fitScale = Math.max(MIN_ZOOM, Math.min(Math.min(scaleX, scaleY) * 0.9, MAX_ZOOM));
            applyCenteredZoom(fitScale, w, h);
        } else {
            setZoom(1);
            setPan(0, 0);
        }
    }, [containerRef, imageWidth, imageHeight, setZoom, setPan, applyCenteredZoom]);

    /**
     * Zoom in by a fixed step (1.25x), keeping the image centered.
     */
    const zoomIn = useCallback(() => {
        applyCenteredZoom(zoom * 1.25);
    }, [zoom, applyCenteredZoom]);

    /**
     * Zoom out by a fixed step (1/1.25x), keeping the image centered.
     */
    const zoomOut = useCallback(() => {
        applyCenteredZoom(zoom / 1.25);
    }, [zoom, applyCenteredZoom]);

    return {
        fitToCenter,
        zoomIn,
        zoomOut,
        applyCenteredZoom,
        MIN_ZOOM,
        MAX_ZOOM,
    };
}
