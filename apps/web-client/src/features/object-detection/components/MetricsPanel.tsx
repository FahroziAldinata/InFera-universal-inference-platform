import { useDetectionStore } from '../store/detectionStore';
import { useBenchmark } from '../hooks/useBenchmark';

export function MetricsPanel() {
    const { metrics } = useDetectionStore();
    const { history, clearHistory } = useBenchmark();

    if (!metrics) {
        return (
            <div className="metrics-placeholder premium-placeholder">
                <div className="placeholder-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                </div>
                <div className="placeholder-title">No Performance Metrics</div>
                <div className="placeholder-sub">Run inference to benchmark backend latency and throughput.</div>
            </div>
        );
    }

    const preW = metrics.totalTimeMs > 0 ? (metrics.preprocessTimeMs / metrics.totalTimeMs) * 100 : 0;
    const infW = metrics.totalTimeMs > 0 ? (metrics.inferenceTimeMs / metrics.totalTimeMs) * 100 : 0;
    const postW = metrics.totalTimeMs > 0 ? (metrics.postprocessTimeMs / metrics.totalTimeMs) * 100 : 0;

    return (
        <div>
            {/* Metric Cards 2x2 Grid */}
            <div className="metrics-cards-grid">
                <div className="metric-card-new">
                    <span className="metric-card-label">Backend</span>
                    <span className={`metric-card-value ${metrics.backend === 'webgpu' ? 'green' : 'yellow'}`} style={{ fontSize: '14px' }}>
                        {metrics.backend.toUpperCase()}
                    </span>
                </div>
                <div className="metric-card-new">
                    <span className="metric-card-label">Latency</span>
                    <span className="metric-card-value accent">{metrics.totalTimeMs.toFixed(1)}</span>
                    <span className="metric-card-unit">ms</span>
                </div>
                <div className="metric-card-new">
                    <span className="metric-card-label">FPS</span>
                    <span className="metric-card-value green">{metrics.fps.toFixed(1)}</span>
                </div>
                <div className="metric-card-new">
                    <span className="metric-card-label">Memory</span>
                    <span className="metric-card-value" style={{ fontSize: '14px' }}>
                        {metrics.memoryUsageMB ? `${metrics.memoryUsageMB.toFixed(0)}` : 'N/A'}
                    </span>
                    {metrics.memoryUsageMB && <span className="metric-card-unit">MB</span>}
                </div>
            </div>

            {/* Latency Breakdown */}
            <div className="latency-breakdown-section">
                <span className="latency-breakdown-label">Latency Breakdown</span>
                <div className="latency-bar-track">
                    <div className="latency-bar-pre" style={{ width: `${preW}%` }} title={`Pre: ${metrics.preprocessTimeMs.toFixed(1)}ms`} />
                    <div className="latency-bar-inf" style={{ width: `${infW}%` }} title={`Inf: ${metrics.inferenceTimeMs.toFixed(1)}ms`} />
                    <div className="latency-bar-post" style={{ width: `${postW}%` }} title={`Post: ${metrics.postprocessTimeMs.toFixed(1)}ms`} />
                </div>
                <div className="latency-legend-row">
                    <span className="latency-legend-item">
                        <span className="latency-legend-dot pre" />
                        Pre: {metrics.preprocessTimeMs.toFixed(1)}ms
                    </span>
                    <span className="latency-legend-item">
                        <span className="latency-legend-dot inf" />
                        Inf: {metrics.inferenceTimeMs.toFixed(1)}ms
                    </span>
                    <span className="latency-legend-item">
                        <span className="latency-legend-dot post" />
                        Post: {metrics.postprocessTimeMs.toFixed(1)}ms
                    </span>
                </div>
            </div>

            {/* History comparison */}
            {history.length > 1 && (
                <div className="history-compare-section">
                    <div className="history-compare-header">
                        <span className="history-compare-title">Run History</span>
                        <button className="history-clear-btn" onClick={clearHistory}>Clear</button>
                    </div>
                    <div className="history-list-wrap">
                        {history.map((record, index) => (
                            <div key={index} className="history-row">
                                <span className="history-row-time">{new Date(record.timestamp).toLocaleTimeString()}</span>
                                <span className={`history-row-backend backend-${record.backend}`}>{record.backend.toUpperCase()}</span>
                                <span className="history-row-ms">{record.totalTimeMs.toFixed(1)} ms</span>
                                <span className="history-row-fps">{record.fps.toFixed(1)} FPS</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
