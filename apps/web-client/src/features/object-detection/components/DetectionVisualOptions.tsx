import { useDetectionStore } from '../store/detectionStore';

export function DetectionVisualOptions() {
    const {
        showLabels,
        showBoxes,
        showConfidence,
        showCrosshair,
        showTooltip,
        setShowLabels,
        setShowBoxes,
        setShowConfidence,
        setShowCrosshair,
        setShowTooltip,
    } = useDetectionStore();

    return (
        <div className="visual-options-panel">
            <label className="sidebar-checkbox-label">
                <input
                    type="checkbox"
                    checked={showBoxes}
                    onChange={(e) => setShowBoxes(e.target.checked)}
                />
                Bounding Boxes
            </label>
            <label className="sidebar-checkbox-label">
                <input
                    type="checkbox"
                    checked={showLabels}
                    onChange={(e) => setShowLabels(e.target.checked)}
                />
                Labels
            </label>
            <label className="sidebar-checkbox-label" style={{ opacity: showLabels ? 1 : 0.5 }}>
                <input
                    type="checkbox"
                    checked={showConfidence}
                    disabled={!showLabels}
                    onChange={(e) => setShowConfidence(e.target.checked)}
                />
                Confidence
            </label>
            <label className="sidebar-checkbox-label">
                <input
                    type="checkbox"
                    checked={showTooltip}
                    onChange={(e) => setShowTooltip(e.target.checked)}
                />
                Tooltips (60 FPS)
            </label>
            <label className="sidebar-checkbox-label">
                <input
                    type="checkbox"
                    checked={showCrosshair}
                    onChange={(e) => setShowCrosshair(e.target.checked)}
                />
                HUD Crosshair
            </label>
        </div>
    );
}
