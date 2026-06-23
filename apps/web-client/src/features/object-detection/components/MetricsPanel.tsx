import { useDetectionStore } from '../store/detectionStore';
import { useBenchmark } from '../hooks/useBenchmark';

export function MetricsPanel() {
    const { metrics } = useDetectionStore();
    const { history, clearHistory } = useBenchmark();

    if (!metrics) {
        return (
            <div className="metrics-placeholder">
                <p className="placeholder-text">Jalankan inferensi untuk melihat metrik performa.</p>
            </div>
        );
    }

    return (
        <div className="metrics-panel">
            <h3 className="metrics-header">Metrik Performa (Real-time)</h3>
            
            {/* Primary Metrics Grid */}
            <div className="metrics-grid">
                <div className="metric-card">
                    <span className="metric-label">Backend</span>
                    <span className={`metric-value backend-${metrics.backend}`}>
                        {metrics.backend.toUpperCase()}
                    </span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Total Latency</span>
                    <span className="metric-value highlight">{metrics.totalTimeMs.toFixed(1)} ms</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">FPS</span>
                    <span className="metric-value highlight">{metrics.fps.toFixed(1)}</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Memory</span>
                    <span className="metric-value">
                        {metrics.memoryUsageMB ? `${metrics.memoryUsageMB.toFixed(1)} MB` : 'N/A'}
                    </span>
                </div>
            </div>

            {/* Latency Breakdown Bar */}
            <div className="latency-breakdown-section">
                <span className="section-label">Latency Breakdown</span>
                <div className="latency-breakdown-bar">
                    <div 
                        className="breakdown-segment breakdown-preprocess" 
                        style={{ width: `${(metrics.preprocessTimeMs / metrics.totalTimeMs) * 100}%` }}
                        title={`Preprocess: ${metrics.preprocessTimeMs.toFixed(1)}ms`}
                    />
                    <div 
                        className="breakdown-segment breakdown-inference" 
                        style={{ width: `${(metrics.inferenceTimeMs / metrics.totalTimeMs) * 100}%` }}
                        title={`Inference: ${metrics.inferenceTimeMs.toFixed(1)}ms`}
                    />
                    <div 
                        className="breakdown-segment breakdown-postprocess" 
                        style={{ width: `${(metrics.postprocessTimeMs / metrics.totalTimeMs) * 100}%` }}
                        title={`Postprocess: ${metrics.postprocessTimeMs.toFixed(1)}ms`}
                    />
                </div>
                
                {/* Breakdown Legend */}
                <div className="latency-legend">
                    <span className="legend-item"><span className="legend-dot prep-dot" /> Pre: {metrics.preprocessTimeMs.toFixed(1)}ms</span>
                    <span className="legend-item"><span className="legend-dot inf-dot" /> Inf: {metrics.inferenceTimeMs.toFixed(1)}ms</span>
                    <span className="legend-item"><span className="legend-dot post-dot" /> Post: {metrics.postprocessTimeMs.toFixed(1)}ms</span>
                </div>
            </div>

            {/* History Comparison List */}
            {history.length > 1 && (
                <div className="metrics-history-section">
                    <div className="history-header">
                        <span className="section-label">Riwayat Inferensi (Perbandingan)</span>
                        <button className="clear-btn" onClick={clearHistory}>Bersihkan</button>
                    </div>
                    <div className="history-list-container">
                        <ul className="history-list">
                            {history.map((record, index) => (
                                <li key={index} className="history-item">
                                    <span className="history-time">{new Date(record.timestamp).toLocaleTimeString()}</span>
                                    <span className={`history-backend backend-${record.backend}`}>
                                        {record.backend.toUpperCase()}
                                    </span>
                                    <span className="history-total">{record.totalTimeMs.toFixed(1)} ms</span>
                                    <span className="history-fps">{record.fps.toFixed(1)} FPS</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
