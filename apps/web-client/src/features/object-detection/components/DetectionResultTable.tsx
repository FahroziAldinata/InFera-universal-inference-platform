import { useEffect, useRef } from 'react';
import { useDetectionStore } from '../store/detectionStore';

export function DetectionResultTable() {
    const {
        detections,
        hoveredDetectionId,
        selectedDetectionId,
        setHoveredDetectionId,
        setSelectedDetectionId,
        focusDetection,
    } = useDetectionStore();

    const selectedRowRef = useRef<HTMLTableRowElement>(null);

    // Automatically scroll to the selected row when selected via canvas or keyboard
    useEffect(() => {
        if (selectedDetectionId && selectedRowRef.current) {
            selectedRowRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            });
        }
    }, [selectedDetectionId]);

    function copyToClipboard(id: string) {
        const det = detections.find((d) => d.id === id);
        if (!det) return;
        const text = `Class: ${det.className}\nConfidence: ${(det.confidence * 100).toFixed(2)}%\nBox: x=${det.x.toFixed(1)}, y=${det.y.toFixed(1)}, w=${det.width.toFixed(1)}, h=${det.height.toFixed(1)}`;
        navigator.clipboard.writeText(text);
        alert(`Detection detail copied to clipboard!`);
    }

    const handleRowDoubleClick = (id: string) => {
        const container = document.querySelector('.canvas-container');
        const viewportWidth = container?.clientWidth || 640;
        const viewportHeight = container?.clientHeight || 480;
        focusDetection(id, viewportWidth, viewportHeight);
    };

    if (detections.length === 0) {
        return (
            <div className="table-placeholder">
                <p className="placeholder-text">Tidak ada objek yang terdeteksi.</p>
            </div>
        );
    }

    return (
        <div className="result-table-container">
            <div className="result-table-header">
                <span className="result-count">{detections.length} objek ditemukan</span>
            </div>
            <div className="result-table-scroll">
                <table className="result-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Label</th>
                            <th>Conf</th>
                            <th>Box (x,y,w,h)</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {detections.map((det, idx) => {
                            const isSelected = det.id === selectedDetectionId;
                            const isHovered = det.id === hoveredDetectionId;
                            const isHighlighted = isSelected || isHovered;

                            return (
                                <tr
                                    key={det.id || idx}
                                    ref={isSelected ? selectedRowRef : undefined}
                                    className={`table-row ${isHighlighted ? 'table-row--highlighted' : ''} ${isHovered ? 'table-row--hovered' : ''}`}
                                    onMouseEnter={() => setHoveredDetectionId(det.id || null)}
                                    onMouseLeave={() => setHoveredDetectionId(null)}
                                    onClick={() => setSelectedDetectionId(det.id || null)}
                                    onDoubleClick={() => det.id && handleRowDoubleClick(det.id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <td className="row-index">{idx + 1}</td>
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
                                            className="table-action-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (det.id) {
                                                    copyToClipboard(det.id);
                                                }
                                            }}
                                            title="Salin Detail"
                                        >
                                            📋
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
