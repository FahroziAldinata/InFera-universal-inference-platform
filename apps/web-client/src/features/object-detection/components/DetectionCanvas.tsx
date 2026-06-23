import { useEffect, useRef, useState } from 'react';
import type { MouseEvent, WheelEvent } from 'react';
import { drawDetections } from '@infera/plugin-object-detection';
import { useDetectionStore } from '../store/detectionStore';

export function DetectionCanvas() {
    const {
        imagePreviewUrl,
        detections,
        showLabels,
        showBoxes,
        showConfidence,
        zoom,
        panX,
        panY,
        setZoom,
        setPan,
        activeDetectionIndex
    } = useDetectionStore();

    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Redraw detections overlay when image, detections, or view settings change
    useEffect(() => {
        const canvas = canvasRef.current;
        const img = imageRef.current;

        if (!canvas || !img || !imagePreviewUrl) return;

        const handleRedraw = () => {
            // Determine active/highlighted detections
            const highlightedDetections = detections.map((det, idx) => {
                if (activeDetectionIndex !== null) {
                    // Dim non-active detections
                    return {
                        ...det,
                        color: idx === activeDetectionIndex ? det.color : 'rgba(150, 150, 150, 0.3)'
                    };
                }
                return det;
            });

            drawDetections(canvas, img, highlightedDetections, {
                lineWidth: 3,
                showLabels,
                showBoxes,
                showConfidence,
                showCenterPoint: false,
                fillOpacity: 0.1,
                cornerRadius: 4,
            });
        };

        if (img.complete) {
            handleRedraw();
        } else {
            img.onload = handleRedraw;
        }
    }, [imagePreviewUrl, detections, showLabels, showBoxes, showConfidence, activeDetectionIndex]);

    // Handle Pan - Mouse Down
    const handleMouseDown = (e: MouseEvent) => {
        if (e.button !== 0) return; // Only left click drag
        setIsDragging(true);
        setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
        e.preventDefault();
    };

    // Handle Pan - Mouse Move
    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        setPan(newX, newY);
    };

    // Handle Pan - Mouse Up
    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Handle Zoom - Wheel
    const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        const zoomFactor = 1.1;
        let newZoom = zoom;
        if (e.deltaY < 0) {
            newZoom = Math.min(zoom * zoomFactor, 10); // Limit zoom in to 10x
        } else {
            newZoom = Math.max(zoom / zoomFactor, 0.5); // Limit zoom out to 0.5x
        }
        setZoom(newZoom);
    };

    if (!imagePreviewUrl) {
        return (
            <div className="canvas-placeholder">
                <p className="placeholder-text">Pilih atau unggah gambar untuk memulai deteksi.</p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="canvas-container"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
        >
            <div
                className="canvas-transform-wrapper"
                style={{
                    transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
                    transformOrigin: 'center center',
                    cursor: isDragging ? 'grabbing' : 'grab'
                }}
            >
                {/* Hidden image element to load source dims */}
                <img
                    ref={imageRef}
                    src={imagePreviewUrl}
                    alt="Source"
                    className="canvas-source-img"
                    style={{ display: 'none' }}
                />

                {/* Display Canvas */}
                <canvas ref={canvasRef} className="canvas-overlay" />
            </div>

            {/* Float HUD controls */}
            <div className="canvas-hud">
                <button className="hud-btn" onClick={() => setZoom(Math.min(zoom * 1.2, 10))} title="Zoom In">+</button>
                <button className="hud-btn" onClick={() => setZoom(Math.max(zoom / 1.2, 0.5))} title="Zoom Out">-</button>
                <button className="hud-btn" onClick={() => { setZoom(1); setPan(0, 0); }} title="Fit View">👁</button>
                <span className="hud-info">{(zoom * 100).toFixed(0)}%</span>
            </div>
        </div>
    );
}
