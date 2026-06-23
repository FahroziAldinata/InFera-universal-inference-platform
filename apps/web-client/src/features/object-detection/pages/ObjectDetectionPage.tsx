import { useEffect } from 'react';
import { DetectionUploader } from '../components/DetectionUploader';
import { DetectionToolbar } from '../components/DetectionToolbar';
import { DetectionCanvas } from '../components/DetectionCanvas';
import { MetricsPanel } from '../components/MetricsPanel';
import { DetectionResultTable } from '../components/DetectionResultTable';
import { ModelManagerPanel } from '../components/ModelManagerPanel';
import { useDetectionStore } from '../store/detectionStore';
import { disposeActivePluginInstance } from '../hooks/useObjectDetection';

export function ObjectDetectionPage() {
    const { errorMessage } = useDetectionStore();

    useEffect(() => {
        return () => {
            console.log('[ObjectDetectionPage] Page unmounted, cleaning up runtime resources...');
            disposeActivePluginInstance();
        };
    }, []);

    return (
        <div className="workspace">
            {/* Left sidebar for model upload and controls */}
            <aside className="sidebar">
                <div className="section-header">MODEL & INPUT</div>
                <DetectionUploader />
                
                <ModelManagerPanel />
                
                <div className="sidebar-divider" />
                
                <DetectionToolbar />
            </aside>

            {/* Center area for canvas overlay visualization */}
            <main className="canvas-view-area">
                {errorMessage && (
                    <div className="error-banner">
                        <span className="error-icon">⚠</span>
                        <p className="error-text">{errorMessage}</p>
                    </div>
                )}
                <div className="visualizer-card card">
                    <h3 className="card-title visualizer-title">Visualisasi Deteksi</h3>
                    <DetectionCanvas />
                </div>
            </main>

            {/* Right sidebar for performance benchmarks and detections lists */}
            <aside className="right-panel">
                <div className="rp-section">
                    <MetricsPanel />
                </div>
                <div className="rp-divider" />
                <div className="rp-section rp-section--grow">
                    <DetectionResultTable />
                </div>
            </aside>
        </div>
    );
}
