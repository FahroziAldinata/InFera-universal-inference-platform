import { useDetectionStore } from '../store/detectionStore';
import { downloadCanvasResult } from '../utils/exportDetection';

export function DetectionToolbar() {
    const {
        step,
        showLabels,
        showBoxes,
        showConfidence,
        setShowLabels,
        setShowBoxes,
        setShowConfidence,
        setZoom,
        setPan
    } = useDetectionStore();

    const isDone = step === 'done';

    async function handleExport(format: 'png' | 'jpeg') {
        const canvas = document.querySelector('canvas');
        if (!canvas) {
            alert('Kanvas hasil tidak ditemukan.');
            return;
        }

        try {
            await downloadCanvasResult(canvas, format, `infera-detection-result.${format}`);
        } catch (e) {
            alert(`Gagal mengekspor gambar: ${e instanceof Error ? e.message : String(e)}`);
        }
    }

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
            </div>

            <div className="toolbar-divider" />

            {/* View Reset Controls */}
            <div className="view-controls-row">
                <button 
                    className="btn-secondary" 
                    onClick={() => { setZoom(1); setPan(0, 0); }}
                >
                    Reset Zoom & Pan
                </button>
            </div>

            {/* Export buttons */}
            {isDone && (
                <>
                    <div className="toolbar-divider" />
                    <div className="export-controls-row">
                        <span className="export-label">Ekspor Hasil</span>
                        <div className="export-btn-group">
                            <button className="btn-secondary btn-export" onClick={() => handleExport('png')}>
                                PNG
                            </button>
                            <button className="btn-secondary btn-export" onClick={() => handleExport('jpeg')}>
                                JPEG
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
