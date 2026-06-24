import { useEffect } from 'react';
import { DetectionUploader } from '../components/DetectionUploader';
import { DetectionToolbar } from '../components/DetectionToolbar';
import { DetectionCanvas } from '../components/DetectionCanvas';
import { MetricsPanel } from '../components/MetricsPanel';
import { DetectionResultTable } from '../components/DetectionResultTable';
import { ModelManagerPanel } from '../components/ModelManagerPanel';
import { DetectionVisualOptions } from '../components/DetectionVisualOptions';
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
        <div className="workspace detection-workspace">
            {/* Left sidebar for model upload and toggles */}
            <aside className="sidebar">
                <div className="section-header">MODEL & INPUT</div>
                <DetectionUploader />
                
                <ModelManagerPanel />
                
                <div className="sidebar-divider" />
                
                <div className="section-header">VISUAL OPTIONS</div>
                <DetectionVisualOptions />
            </aside>

            {/* Center Area: Full height visualization canvas */}
            <main className="canvas-view-area">
                {errorMessage && (
                    <div className="error-banner">
                        <span className="error-icon">⚠</span>
                        <p className="error-text">{errorMessage}</p>
                    </div>
                )}
                <DetectionCanvas />
            </main>

            {/* Right Panel: Controls, Results, and Performance metrics */}
            <aside className="right-panel detection-right-panel">
                {/* TOOLBAR SECTION */}
                <div className="rp-section">
                    <div className="rp-section-header">
                        <span className="rp-section-title">DETECTION CONTROLS</span>
                    </div>
                    <div className="rp-section-body" style={{ padding: '8px 16px' }}>
                        <DetectionToolbar />
                    </div>
                </div>

                <div className="rp-divider" />

                {/* RESULTS SECTION */}
                <div className="rp-section rp-section--grow" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                    <div className="rp-section-header">
                        <span className="rp-section-title">DETECTION RESULTS</span>
                    </div>
                    <div className="rp-section-body rp-section-body--scroll" style={{ flex: 1, overflowY: 'auto' }}>
                        <DetectionResultTable />
                    </div>
                </div>

                <div className="rp-divider" />

                {/* METRICS SECTION */}
                <div className="rp-section" style={{ flexShrink: 0 }}>
                    <div className="rp-section-header">
                        <span className="rp-section-title">PERFORMANCE METRICS</span>
                    </div>
                    <div className="rp-section-body" style={{ padding: '0 0 12px 0' }}>
                        <MetricsPanel />
                    </div>
                </div>
            </aside>
        </div>
    );
}
