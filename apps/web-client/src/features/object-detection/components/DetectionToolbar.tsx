import { useState } from 'react';
import { useDetectionStore } from '../store/detectionStore';
import { downloadCanvasResult } from '../utils/exportDetection';
import { EXPORT_FORMATTERS, downloadStringAsFile } from '../utils/exportFormatter';

export function DetectionToolbar() {
    const {
        step,
        showLabels,
        showBoxes,
        showConfidence,
        showCrosshair,
        showTooltip,
        selectedDetectionId,
        detections,
        imageFile,
        setShowLabels,
        setShowBoxes,
        setShowConfidence,
        setShowCrosshair,
        setShowTooltip,
        setZoom,
        setPan,
        focusDetection,
    } = useDetectionStore();

    const [selectedFormatId, setSelectedFormatId] = useState('json');

    const isDone = step === 'done';

    async function handleExport(format: 'png' | 'jpeg') {
        const canvas = document.querySelector('canvas');
        if (!canvas) {
            alert('Canvas result element not found.');
            return;
        }

        try {
            await downloadCanvasResult(canvas, format, `infera-detection-result.${format}`);
        } catch (e) {
            alert(`Failed to export image: ${e instanceof Error ? e.message : String(e)}`);
        }
    }

    const handleMetadataExport = () => {
        const formatter = EXPORT_FORMATTERS.find(f => f.id === selectedFormatId);
        if (!formatter) return;

        const img = document.querySelector('.canvas-source-img') as HTMLImageElement | null;
        const imageWidth = img?.naturalWidth || 640;
        const imageHeight = img?.naturalHeight || 640;
        const imageName = imageFile?.name || 'image.jpg';

        const content = formatter.format(detections, {
            imageName,
            imageWidth,
            imageHeight
        });

        const dotIdx = imageName.lastIndexOf('.');
        const baseName = dotIdx !== -1 ? imageName.substring(0, dotIdx) : imageName;
        const exportFilename = `${baseName}_detections.${formatter.extension}`;
        
        downloadStringAsFile(content, exportFilename, formatter.mimeType);
    };

    const handleActualSize = () => {
        setZoom(1.0);
        setPan(0, 0);
    };

    const handleFitView = () => {
        const img = document.querySelector('.canvas-source-img') as HTMLImageElement | null;
        const container = document.querySelector('.canvas-container');
        if (img && container && img.naturalWidth && img.naturalHeight) {
            const rect = container.getBoundingClientRect();
            const scaleX = rect.width / img.naturalWidth;
            const scaleY = rect.height / img.naturalHeight;
            // Fits image with a small border pad (0.95 scale factor)
            const fitScale = Math.max(0.1, Math.min(Math.min(scaleX, scaleY) * 0.95, 20));

            const centeredPanX = (rect.width - img.naturalWidth * fitScale) / 2;
            const centeredPanY = (rect.height - img.naturalHeight * fitScale) / 2;

            setZoom(fitScale);
            setPan(centeredPanX, centeredPanY);
        } else {
            setZoom(1.0);
            setPan(0, 0);
        }
    };

    const handleCenterSelection = () => {
        if (!selectedDetectionId) return;
        const container = document.querySelector('.canvas-container');
        const viewportWidth = container?.clientWidth || 640;
        const viewportHeight = container?.clientHeight || 480;
        focusDetection(selectedDetectionId, viewportWidth, viewportHeight);
    };

    return (
        <div className="toolbar-section card">
            <h3 className="card-title">Opsi Visualisasi</h3>
            
            {/* Visual Toggles */}
            <div className="toggles-grid">
                <label className="toolbar-checkbox-label">
                    <input
                        type="checkbox"
                        checked={showBoxes}
                        onChange={(e) => setShowBoxes(e.target.checked)}
                    />
                    Bounding Boxes
                </label>
                <label className="toolbar-checkbox-label">
                    <input
                        type="checkbox"
                        checked={showLabels}
                        onChange={(e) => setShowLabels(e.target.checked)}
                    />
                    Labels
                </label>
                <label className="toolbar-checkbox-label" style={{ opacity: showLabels ? 1 : 0.5 }}>
                    <input
                        type="checkbox"
                        checked={showConfidence}
                        disabled={!showLabels}
                        onChange={(e) => setShowConfidence(e.target.checked)}
                    />
                    Confidence
                </label>
                <label className="toolbar-checkbox-label">
                    <input
                        type="checkbox"
                        checked={showTooltip}
                        onChange={(e) => setShowTooltip(e.target.checked)}
                    />
                    Tooltips (60 FPS)
                </label>
                <label className="toolbar-checkbox-label">
                    <input
                        type="checkbox"
                        checked={showCrosshair}
                        onChange={(e) => setShowCrosshair(e.target.checked)}
                    />
                    HUD Crosshair
                </label>
            </div>

            <div className="toolbar-divider" />

            {/* View Reset Controls */}
            <div className="view-controls-row" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-secondary" style={{ flex: 1 }} onClick={handleActualSize}>
                        100% Size
                    </button>
                    <button className="btn-secondary" style={{ flex: 1 }} onClick={handleFitView}>
                        Fit View
                    </button>
                </div>
                {selectedDetectionId && (
                    <button className="btn-primary" onClick={handleCenterSelection}>
                        Center Selection 🎯
                    </button>
                )}
            </div>

            {/* Export buttons */}
            {isDone && (
                <>
                    <div className="toolbar-divider" />
                    <div className="export-controls-row">
                        <span className="export-label">Ekspor Gambar</span>
                        <div className="export-btn-group">
                            <button className="btn-secondary btn-export" onClick={() => handleExport('png')}>
                                PNG
                            </button>
                            <button className="btn-secondary btn-export" onClick={() => handleExport('jpeg')}>
                                JPEG
                            </button>
                        </div>
                    </div>
                    <div className="toolbar-divider" />
                    <div className="export-controls-row">
                        <span className="export-label">Ekspor Anotasi</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <select
                                className="select-input"
                                value={selectedFormatId}
                                onChange={(e) => setSelectedFormatId(e.target.value)}
                                style={{ flex: 1, minWidth: 0 }}
                            >
                                {EXPORT_FORMATTERS.map(f => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                            <button className="btn-primary" onClick={handleMetadataExport} style={{ padding: '5px 10px', fontSize: '11px', whiteSpace: 'nowrap' }}>
                                Ekspor
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
