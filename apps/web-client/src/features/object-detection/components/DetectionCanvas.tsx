import { useEffect, useRef, useCallback } from 'react';
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
        imageWidth,
        imageHeight,
        hoveredDetectionId,
        selectedDetectionId,
        setHoveredDetectionId,
        setSelectedDetectionId,
        setImageDims,
    } = useDetectionStore();

    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const dashOffsetRef = useRef(0);

    // Connect viewport hook (center-based zoom only, no pan/drag)
    const {
        fitToCenter,
    } = useCanvasViewport(containerRef);

    // Register global keyboard listeners
    useDetectionSelection();

    // Helper to get current image dimensions
    const getImageDims = useCallback(() => {
        const img = imageRef.current;
        return img ? { w: img.naturalWidth, h: img.naturalHeight } : null;
    }, []);

    const handleImageLoad = useCallback(() => {
        const dims = getImageDims();
        if (dims) {
            setImageDims(dims.w, dims.h);
            fitToCenter(dims.w, dims.h);
        }
    }, [fitToCenter, getImageDims, setImageDims]);

    useEffect(() => {
        if (imageRef.current?.complete) {
            handleImageLoad();
        }
    }, [imagePreviewUrl, handleImageLoad]);

    // Track mouse pointer coordinates to determine box hover and tooltip updates
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!canvasRef.current || !containerRef.current || detections.length === 0) {
            if (tooltipRef.current) tooltipRef.current.style.display = 'none';
            return;
        }

        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Project coordinate relative to container into unscaled image coordinates
        const imgWidth = imageWidth || 0;
        const imgHeight = imageHeight || 0;
        const virtualPanX = rect.width / 2 + panX - (imgWidth * zoom) / 2;
        const virtualPanY = rect.height / 2 + panY - (imgHeight * zoom) / 2;

        const imagePoint = canvasToImage(mouseX, mouseY, zoom, virtualPanX, virtualPanY);

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
        if (e.button !== 0 || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const imgWidth = imageWidth || 0;
        const imgHeight = imageHeight || 0;
        const virtualPanX = rect.width / 2 + panX - (imgWidth * zoom) / 2;
        const virtualPanY = rect.height / 2 + panY - (imgHeight * zoom) / 2;

        const imagePoint = canvasToImage(mouseX, mouseY, zoom, virtualPanX, virtualPanY);
        const clicked = findDetectionAtPoint(imagePoint.x, imagePoint.y, detections);

        if (clicked) {
            setSelectedDetectionId(clicked.id || null);
        } else {
            setSelectedDetectionId(null);
        }
    };

    const handleMouseLeave = () => {
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
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleCanvasClick}
        >
            <div
                className="canvas-transform-wrapper"
                style={{
                    transform: `translate(-50%, -50%) translate(${panX}px, ${panY}px) scale(${zoom})`,
                    transformOrigin: 'center center',
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
        </div>
    );
}
