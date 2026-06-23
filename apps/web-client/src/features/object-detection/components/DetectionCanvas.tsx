import { useEffect, useRef } from 'react';
import { drawDetections, findDetectionAtPoint, canvasToImage } from '@infera/plugin-object-detection';
import { useDetectionStore } from '../store/detectionStore';
import { useCanvasViewport } from '../hooks/useCanvasViewport';
import { useDetectionSelection } from '../hooks/useDetectionSelection';
import { DetectionTooltip } from './DetectionTooltip';

export function DetectionCanvas() {
    const {
        imagePreviewUrl,
        detections,
        showLabels,
        showBoxes,
        showConfidence,
        showCrosshair,
        showTooltip,
        zoom,
        panX,
        panY,
        hoveredDetectionId,
        selectedDetectionId,
        setZoom,
        setHoveredDetectionId,
        setSelectedDetectionId,
        focusDetection,
    } = useDetectionStore();

    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const dashOffsetRef = useRef(0);

    // Connect viewport hooks (dragging and wheel zooming)
    const {
        isDragging,
        handleMouseDown,
        handleMouseMove: handleViewportMouseMove,
        handleMouseUp,
        handleWheel,
        resetViewport,
    } = useCanvasViewport(containerRef);

    // Register global keyboard listeners
    useDetectionSelection();

    // Fits/centers canvas when a new image is loaded
    const handleImageLoad = () => {
        const img = imageRef.current;
        if (img) {
            resetViewport(img.naturalWidth, img.naturalHeight);
        }
    };

    useEffect(() => {
        if (imageRef.current?.complete) {
            handleImageLoad();
        }
    }, [imagePreviewUrl]);

    // Track mouse pointer coordinates to determine box hover and tooltip updates
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        handleViewportMouseMove(e);

        if (!canvasRef.current || !containerRef.current || detections.length === 0) {
            if (tooltipRef.current) tooltipRef.current.style.display = 'none';
            return;
        }

        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Project coordinate relative to container into unscaled image coordinates
        const imagePoint = canvasToImage(mouseX, mouseY, zoom, panX, panY);

        // Find match using spatial priorities
        const hovered = findDetectionAtPoint(imagePoint.x, imagePoint.y, detections);

        if (hovered) {
            if (hoveredDetectionId !== (hovered.id ?? null)) {
                setHoveredDetectionId(hovered.id || null);
            }

            // Direct DOM element styling to avoid React lag on fast movement
            if (showTooltip && tooltipRef.current) {
                const titleEl = tooltipRef.current.querySelector('#tooltip-class-name');
                const coordsEl = tooltipRef.current.querySelector('#tooltip-coords');
                if (titleEl) titleEl.textContent = hovered.className;
                if (coordsEl) {
                    coordsEl.textContent = `Conf: ${(hovered.confidence * 100).toFixed(1)}% | [x: ${hovered.x.toFixed(0)}, y: ${hovered.y.toFixed(0)}, w: ${hovered.width.toFixed(0)}, h: ${hovered.height.toFixed(0)}]`;
                }
                tooltipRef.current.style.transform = `translate3d(${mouseX + 15}px, ${mouseY + 15}px, 0)`;
                tooltipRef.current.style.display = 'block';
            }
        } else {
            if (hoveredDetectionId !== null) {
                setHoveredDetectionId(null);
            }
            if (tooltipRef.current) {
                tooltipRef.current.style.display = 'none';
            }
        }
    };

    // Clicking container updates selected detection element
    const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isDragging || e.button !== 0 || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const imagePoint = canvasToImage(mouseX, mouseY, zoom, panX, panY);
        const clicked = findDetectionAtPoint(imagePoint.x, imagePoint.y, detections);

        if (clicked) {
            setSelectedDetectionId(clicked.id || null);
        } else {
            setSelectedDetectionId(null);
        }
    };

    // Double-clicking focuses and centers viewport onto bounding box
    const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const imagePoint = canvasToImage(mouseX, mouseY, zoom, panX, panY);
        const clicked = findDetectionAtPoint(imagePoint.x, imagePoint.y, detections);

        if (clicked && clicked.id) {
            focusDetection(clicked.id, containerRef.current.clientWidth, containerRef.current.clientHeight);
        }
    };

    const handleMouseLeave = () => {
        handleMouseUp();
        setHoveredDetectionId(null);
        if (tooltipRef.current) {
            tooltipRef.current.style.display = 'none';
        }
    };

    // High performance rAF drawing loop
    useEffect(() => {
        const drawLoop = () => {
            const canvas = canvasRef.current;
            const img = imageRef.current;

            if (canvas && img && imagePreviewUrl) {
                // Update selection dashed animation offset
                dashOffsetRef.current = (dashOffsetRef.current - 0.25) % 24;

                drawDetections(canvas, img, detections, {
                    lineWidth: 2,
                    showLabels,
                    showBoxes,
                    showConfidence,
                    showCenterPoint: false,
                    fillOpacity: 0.08,
                    cornerRadius: 6,
                    hoveredDetectionId,
                    selectedDetectionId,
                    lineDashOffset: dashOffsetRef.current,
                    showCrosshair,
                });
            }
            animationFrameId.current = requestAnimationFrame(drawLoop);
        };

        animationFrameId.current = requestAnimationFrame(drawLoop);

        return () => {
            if (animationFrameId.current !== null) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [
        imagePreviewUrl,
        detections,
        showLabels,
        showBoxes,
        showConfidence,
        showCrosshair,
        hoveredDetectionId,
        selectedDetectionId,
    ]);

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
            onMouseLeave={handleMouseLeave}
            onDoubleClick={handleDoubleClick}
            onClick={handleCanvasClick}
            onWheel={handleWheel}
        >
            <div
                className="canvas-transform-wrapper"
                style={{
                    transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
                    cursor: isDragging ? 'grabbing' : 'grab',
                }}
            >
                {/* Hidden image element to load source dimensions */}
                <img
                    ref={imageRef}
                    src={imagePreviewUrl}
                    alt="Source"
                    className="canvas-source-img"
                    style={{ display: 'none' }}
                    onLoad={handleImageLoad}
                />

                {/* Display Canvas Overlay */}
                <canvas ref={canvasRef} className="canvas-overlay" />
            </div>

            {/* DOM Tooltip Element */}
            <DetectionTooltip ref={tooltipRef} />

            {/* Float HUD controls */}
            <div className="canvas-hud">
                <button className="hud-btn" onClick={() => setZoom(zoom * 1.25)} title="Zoom In">
                    +
                </button>
                <button className="hud-btn" onClick={() => setZoom(zoom / 1.25)} title="Zoom Out">
                    -
                </button>
                <button
                    className="hud-btn"
                    onClick={() => {
                        const img = imageRef.current;
                        if (img) resetViewport(img.naturalWidth, img.naturalHeight);
                        else resetViewport();
                    }}
                    title="Fit View"
                >
                    👁
                </button>
                <span className="hud-info">{(zoom * 100).toFixed(0)}%</span>
            </div>
        </div>
    );
}
