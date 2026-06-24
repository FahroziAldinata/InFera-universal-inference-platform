import { useDetectionStore } from '../store/detectionStore';
import { downloadCanvasResult } from '../utils/exportDetection';
import { EXPORT_FORMATTERS, downloadStringAsFile } from '../utils/exportFormatter';

export function DetectionToolbar() {
    const {
        step,
        zoom,
        imageWidth,
        imageHeight,
        setZoom,
        setPan,
        detections,
        imageFile,
        showBoxes,
        setShowBoxes,
    } = useDetectionStore();

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
        const formatter = EXPORT_FORMATTERS.find(f => f.id === 'json');
        if (!formatter) return;

        const imageName = imageFile?.name || 'image.jpg';
        const content = formatter.format(detections, {
            imageName,
            imageWidth: imageWidth || 640,
            imageHeight: imageHeight || 640
        });

        const dotIdx = imageName.lastIndexOf('.');
        const baseName = dotIdx !== -1 ? imageName.substring(0, dotIdx) : imageName;
        const exportFilename = `${baseName}_detections.json`;
        
        downloadStringAsFile(content, exportFilename, formatter.mimeType);
    };

    const handleZoomIn = () => {
        if (!imageWidth || !imageHeight) return;
        const newZoom = Math.min(zoom * 1.25, 10);
        setZoom(newZoom);
    };

    const handleZoomOut = () => {
        if (!imageWidth || !imageHeight) return;
        const newZoom = Math.max(zoom / 1.25, 0.25);
        setZoom(newZoom);
    };

    const handleFitView = () => {
        if (!imageWidth || !imageHeight) return;
        const container = document.querySelector('.canvas-container');
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const scaleX = rect.width / imageWidth;
        const scaleY = rect.height / imageHeight;
        const fitScale = Math.max(0.25, Math.min(Math.min(scaleX, scaleY) * 0.9, 10));

        setZoom(fitScale);
        setPan(0, 0);
    };

    if (!imageFile) return null;

    return (
        <div className="detection-toolbar-hud">
            {/* Export Group */}
            <div className="hud-group">
                <button 
                    className="hud-action-btn" 
                    disabled={!isDone} 
                    onClick={() => handleExport('png')}
                    title="Export PNG"
                >
                    PNG
                </button>
                <button 
                    className="hud-action-btn" 
                    disabled={!isDone} 
                    onClick={() => handleExport('jpeg')}
                    title="Export JPEG"
                >
                    JPEG
                </button>
                <button 
                    className="hud-action-btn" 
                    disabled={!isDone} 
                    onClick={handleMetadataExport}
                    title="Export JSON Metadata"
                >
                    JSON
                </button>
            </div>
            
            <div className="hud-separator" />
            
            {/* Zoom & Fit Group */}
            <div className="hud-group">
                <span className="hud-zoom-text">{(zoom * 100).toFixed(0)}%</span>
                <button className="hud-zoom-btn" onClick={handleZoomIn} title="Zoom In">+</button>
                <button className="hud-zoom-btn" onClick={handleZoomOut} title="Zoom Out">-</button>
                <button className="hud-action-btn" onClick={handleFitView} title="Fit to Viewport">Fit</button>
                <button 
                    className={`hud-zoom-btn eye-btn ${showBoxes ? 'active' : ''}`} 
                    onClick={() => setShowBoxes(!showBoxes)}
                    title="Toggle Bounding Boxes Overlay"
                >
                    👁️
                </button>
            </div>
        </div>
    );
}
