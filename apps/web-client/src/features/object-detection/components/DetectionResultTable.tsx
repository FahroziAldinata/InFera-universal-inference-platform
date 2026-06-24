import { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
import type { Detection } from '@infera/plugin-object-detection';
import { useDetectionStore } from '../store/detectionStore';

const ROW_HEIGHT = 30; // height of each row in px
const BUFFER = 10; // extra rows to render above/below viewport

interface RowProps {
    det: Detection;
    index: number;
    isSelected: boolean;
    isHovered: boolean;
    onMouseEnter: (id: string) => void;
    onMouseLeave: () => void;
    onClick: (id: string) => void;
    onDoubleClick: (id: string) => void;
    onCopy: (id: string) => void;
}

const TableRow = memo(function TableRow({
    det,
    index,
    isSelected,
    isHovered,
    onMouseEnter,
    onMouseLeave,
    onClick,
    onDoubleClick,
    onCopy
}: RowProps) {
    const isHighlighted = isSelected || isHovered;
    const detId = det.id || '';

    return (
        <tr
            className={`table-row ${isHighlighted ? 'table-row--highlighted' : ''} ${isHovered ? 'table-row--hovered' : ''}`}
            onMouseEnter={() => onMouseEnter(detId)}
            onMouseLeave={onMouseLeave}
            onClick={() => onClick(detId)}
            onDoubleClick={() => onDoubleClick(detId)}
            style={{ cursor: 'pointer', height: `${ROW_HEIGHT}px` }}
        >
            <td className="row-index">{index + 1}</td>
            <td>
                <span
                    className="row-color-badge"
                    style={{ backgroundColor: det.color || '#3b82f6' }}
                />
                <span className="row-label">{det.className}</span>
            </td>
            <td className="row-conf">{(det.confidence * 100).toFixed(1)}%</td>
            <td className="row-box mono">
                {`[${det.x.toFixed(0)}, ${det.y.toFixed(0)}, ${det.width.toFixed(0)}, ${det.height.toFixed(0)}]`}
            </td>
            <td className="row-actions">
                <button
                    className="table-action-btn copy-btn-text"
                    onClick={(e) => {
                        e.stopPropagation();
                        onCopy(detId);
                    }}
                    title="Copy details"
                >
                    Copy
                </button>
            </td>
        </tr>
    );
});

export function DetectionResultTable() {
    const {
        detections,
        hoveredDetectionId,
        selectedDetectionId,
        setHoveredDetectionId,
        setSelectedDetectionId,
    } = useDetectionStore();

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(300);

    // Auto-scroll to selected row, accounting for virtualization
    useEffect(() => {
        if (!selectedDetectionId || !scrollContainerRef.current) return;
        const selectedIdx = detections.findIndex(d => d.id === selectedDetectionId);
        if (selectedIdx === -1) return;

        const targetScrollTop = selectedIdx * ROW_HEIGHT;
        const container = scrollContainerRef.current;
        const isVisible = targetScrollTop >= container.scrollTop && 
                          targetScrollTop <= (container.scrollTop + container.clientHeight - ROW_HEIGHT);

        if (!isVisible) {
            container.scrollTo({
                top: Math.max(0, targetScrollTop - container.clientHeight / 2 + ROW_HEIGHT / 2),
                behavior: 'smooth'
            });
        }
    }, [selectedDetectionId, detections]);

    // Handle container scroll and resize
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            setScrollTop(container.scrollTop);
        };

        const handleResize = () => {
            setContainerHeight(container.clientHeight);
        };

        container.addEventListener('scroll', handleScroll);
        handleResize(); // initial set

        let resizeObserver: ResizeObserver | null = null;
        if (typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(handleResize);
            resizeObserver.observe(container);
        }

        return () => {
            container.removeEventListener('scroll', handleScroll);
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
        };
    }, []);

    // Memoize handlers to keep row elements stable
    const handleMouseEnter = useCallback((id: string) => {
        setHoveredDetectionId(id);
    }, [setHoveredDetectionId]);

    const handleMouseLeave = useCallback(() => {
        setHoveredDetectionId(null);
    }, [setHoveredDetectionId]);

    const handleClick = useCallback((id: string) => {
        setSelectedDetectionId(id);
    }, [setSelectedDetectionId]);

    const handleDoubleClick = useCallback((id: string) => {
        setSelectedDetectionId(id);
    }, [setSelectedDetectionId]);

    const handleCopy = useCallback((id: string) => {
        const det = detections.find((d) => d.id === id);
        if (!det) return;
        const text = `Class: ${det.className}\nConfidence: ${(det.confidence * 100).toFixed(2)}%\nBox: x=${det.x.toFixed(1)}, y=${det.y.toFixed(1)}, w=${det.width.toFixed(1)}, h=${det.height.toFixed(1)}`;
        navigator.clipboard.writeText(text);
        alert(`Detail deteksi disalin ke clipboard!`);
    }, [detections]);

    // Virtualization boundary calculations
    const { startIndex, topSpacerHeight, bottomSpacerHeight, visibleDetections } = useMemo(() => {
        const total = detections.length;
        const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER);
        const end = Math.min(total - 1, Math.floor((scrollTop + containerHeight) / ROW_HEIGHT) + BUFFER);
        
        const topHeight = start * ROW_HEIGHT;
        const bottomHeight = Math.max(0, (total - 1 - end) * ROW_HEIGHT);

        const visible = detections.slice(start, end + 1);

        return {
            startIndex: start,
            endIndex: end,
            topSpacerHeight: topHeight,
            bottomSpacerHeight: bottomHeight,
            visibleDetections: visible
        };
    }, [detections, scrollTop, containerHeight]);

    if (detections.length === 0) {
        return (
            <div className="table-placeholder premium-placeholder">
                <div className="placeholder-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                        <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                </div>
                <div className="placeholder-title">No Detections Found</div>
                <div className="placeholder-sub">Upload an image and run inference to detect objects.</div>
            </div>
        );
    }

    return (
        <div className="result-table-container">
            <div className="result-table-header">
                <span className="result-count">{detections.length} objek ditemukan</span>
            </div>
            <div className="result-table-scroll" ref={scrollContainerRef}>
                <table className="result-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Label</th>
                            <th>Confidence</th>
                            <th>Bounding Box</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {topSpacerHeight > 0 && (
                            <tr style={{ height: `${topSpacerHeight}px` }}>
                                <td colSpan={5} style={{ padding: 0, height: `${topSpacerHeight}px`, border: 'none' }} />
                            </tr>
                        )}
                        {visibleDetections.map((det, index) => {
                            const globalIndex = startIndex + index;
                            const detId = det.id || '';
                            return (
                                <TableRow
                                    key={detId || globalIndex}
                                    det={det}
                                    index={globalIndex}
                                    isSelected={detId === selectedDetectionId}
                                    isHovered={detId === hoveredDetectionId}
                                    onMouseEnter={handleMouseEnter}
                                    onMouseLeave={handleMouseLeave}
                                    onClick={handleClick}
                                    onDoubleClick={handleDoubleClick}
                                    onCopy={handleCopy}
                                />
                            );
                        })}
                        {bottomSpacerHeight > 0 && (
                            <tr style={{ height: `${bottomSpacerHeight}px` }}>
                                <td colSpan={5} style={{ padding: 0, height: `${bottomSpacerHeight}px`, border: 'none' }} />
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
