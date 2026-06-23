import { useState, useRef } from 'react';
import type { WheelEvent, MouseEvent } from 'react';
import { useDetectionStore } from '../store/detectionStore';

export function useCanvasViewport(containerRef: React.RefObject<HTMLDivElement | null>) {
    const {
        zoom,
        panX,
        panY,
        setZoom,
        setPan,
    } = useDetectionStore();

    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: MouseEvent) => {
        if (e.button !== 0) return; // Only left click drag to pan
        if (!containerRef.current) return;
        setIsDragging(true);
        dragStart.current = { x: e.clientX - panX, y: e.clientY - panY };
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        const newPanX = e.clientX - dragStart.current.x;
        const newPanY = e.clientY - dragStart.current.y;
        setPan(newPanX, newPanY);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e: WheelEvent) => {
        if (!containerRef.current) return;
        e.preventDefault();

        const rect = containerRef.current.getBoundingClientRect();
        // Mouse coordinate relative to the container viewport
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // Map mouse point in container space to the corresponding point on the image before zoom
        const ix = (mx - panX) / zoom;
        const iy = (my - panY) / zoom;

        const zoomFactor = 1.15;
        let newZoom = zoom;
        if (e.deltaY < 0) {
            newZoom = zoom * zoomFactor;
        } else {
            newZoom = zoom / zoomFactor;
        }

        // Apply zoom boundary constraints (0.1x to 20x)
        newZoom = Math.max(0.1, Math.min(newZoom, 20));

        // Adjust pan coordinates so the image point remains under the mouse cursor after zooming
        const newPanX = mx - ix * newZoom;
        const newPanY = my - iy * newZoom;

        setZoom(newZoom);
        setPan(newPanX, newPanY);
    };

    const resetViewport = (imgWidth?: number, imgHeight?: number) => {
        if (imgWidth && imgHeight && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            // Calculate scale to fit image inside container
            const scaleX = rect.width / imgWidth;
            const scaleY = rect.height / imgHeight;
            const fitScale = Math.max(0.1, Math.min(Math.min(scaleX, scaleY) * 0.9, 20));
            
            const centeredPanX = (rect.width - imgWidth * fitScale) / 2;
            const centeredPanY = (rect.height - imgHeight * fitScale) / 2;
            
            setZoom(fitScale);
            setPan(centeredPanX, centeredPanY);
        } else {
            setZoom(1);
            setPan(0, 0);
        }
    };

    return {
        isDragging,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleWheel,
        resetViewport,
    };
}
