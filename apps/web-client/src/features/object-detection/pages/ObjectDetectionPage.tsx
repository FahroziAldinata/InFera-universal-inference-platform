import { useEffect } from 'react';
import { DetectionUploader } from '../components/DetectionUploader';
import { DetectionCanvas } from '../components/DetectionCanvas';
import { MetricsPanel } from '../components/MetricsPanel';
import { DetectionResultTable } from '../components/DetectionResultTable';
import { ModelManagerPanel } from '../components/ModelManagerPanel';
import { DetectionVisualOptions } from '../components/DetectionVisualOptions';
import { useDetectionStore } from '../store/detectionStore';
import { disposeActivePluginInstance } from '../hooks/useObjectDetection';

/* ── Inline SVG Icons ─────────────────────────────────── */
const IconHome = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
);
const IconClassify = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
    </svg>
);
const IconDetect = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
);
const IconHistory = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
    </svg>
);
const IconModels = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    </svg>
);
const IconSettings = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
);
const IconGpu = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 6V4M10 6V4M14 6V4M18 6V4M6 18v2M10 18v2M14 18v2M18 18v2M2 10h2M20 10h2M2 14h2M20 14h2"/>
    </svg>
);
const IconScan = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><rect x="7" y="7" width="10" height="10" rx="1"/>
    </svg>
);
const IconChart = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
);
const IconList = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
);

interface ObjectDetectionPageProps {
    onTabChange: (tab: 'home' | 'classification' | 'detection') => void;
}

export function ObjectDetectionPage({ onTabChange }: ObjectDetectionPageProps) {
    const { errorMessage, metrics } = useDetectionStore();

    useEffect(() => {
        return () => {
            disposeActivePluginInstance();
        };
    }, []);

    return (
        <div className="workspace detection-workspace">
            {/* ── Left Sidebar ──────────────────────────────── */}
            <aside className="sidebar">
                {/* Navigation */}
                <div className="menu-section">
                    <div className="menu-item" onClick={() => onTabChange('home')}>
                        <span className="menu-icon-svg"><IconHome /></span>
                        <span>Dashboard</span>
                    </div>
                    <div className="menu-item" onClick={() => onTabChange('classification')}>
                        <span className="menu-icon-svg"><IconClassify /></span>
                        <span>Image Classification</span>
                    </div>
                    <div className="menu-item active">
                        <span className="menu-icon-svg"><IconDetect /></span>
                        <span>Object Detection</span>
                    </div>
                    <div className="menu-item disabled" onClick={() => alert('Fitur Riwayat akan segera hadir di versi Pro!')}>
                        <span className="menu-icon-svg"><IconHistory /></span>
                        <span>Riwayat</span>
                        <span className="menu-badge-soon">Soon</span>
                    </div>
                    <div className="menu-item disabled" onClick={() => alert('Fitur Model Saya akan segera hadir di versi Pro!')}>
                        <span className="menu-icon-svg"><IconModels /></span>
                        <span>Model Saya</span>
                        <span className="menu-badge-soon">Soon</span>
                    </div>
                    <div className="menu-item disabled" onClick={() => alert('Fitur Pengaturan akan segera hadir di versi Pro!')}>
                        <span className="menu-icon-svg"><IconSettings /></span>
                        <span>Pengaturan</span>
                        <span className="menu-badge-soon">Soon</span>
                    </div>
                </div>

                <div className="sidebar-divider" />

                <div className="section-header">Model & Input</div>
                <DetectionUploader />
                <ModelManagerPanel />

                <div className="sidebar-divider" />

                <div className="section-header">Visual Options</div>
                <DetectionVisualOptions />

                {/* Backend Status Card */}
                <div className="sidebar-footer">
                    <div className="backend-status-card">
                        <div className="backend-status-header">
                            <div className="backend-status-icon"><IconGpu /></div>
                            <div>
                                <div className="backend-status-title">Inference Backend</div>
                                <div className="backend-status-sub">
                                    {metrics ? `${metrics.backend.toUpperCase()} Active` : 'Ready'}
                                </div>
                            </div>
                        </div>
                        <div className="backend-status-row">
                            <span className="backend-status-label">WebGPU</span>
                            <span className={`backend-status-badge ${metrics?.backend === 'webgpu' ? 'active' : 'fallback'}`}>
                                {metrics?.backend === 'webgpu' ? 'Active' : 'Standby'}
                            </span>
                        </div>
                        <div className="backend-status-row">
                            <span className="backend-status-label">WASM Fallback</span>
                            <span className={`backend-status-badge ${metrics?.backend === 'wasm' ? 'active' : 'fallback'}`}>
                                {metrics?.backend === 'wasm' ? 'Active' : 'Standby'}
                            </span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ── Center: Canvas Viewer ─────────────────────── */}
            <main className="workspace-center">
                {errorMessage && (
                    <div className="error-banner" style={{ marginBottom: '12px', borderRadius: '12px' }}>
                        <span className="error-icon">⚠</span>
                        <p className="error-text">{errorMessage}</p>
                    </div>
                )}
                <div className="viewer-card">
                    <div className="viewer-card-header">
                        <div className="viewer-card-title">
                            <div className="viewer-card-icon"><IconScan /></div>
                            <span className="viewer-card-name">Object Detection</span>
                            {metrics && <span className="viewer-card-sub">· {metrics.fps.toFixed(0)} FPS</span>}
                        </div>
                        <div className="viewer-card-actions">
                            {metrics && (
                                <span style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: 'var(--green)',
                                    background: 'var(--green-dim)',
                                    border: '1px solid rgba(16,185,129,0.2)',
                                    padding: '4px 10px',
                                    borderRadius: '8px',
                                    fontFamily: 'var(--mono)',
                                }}>
                                    {metrics.totalTimeMs.toFixed(1)} ms
                                </span>
                            )}
                        </div>
                    </div>
                    <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                        <DetectionCanvas />
                    </div>
                </div>
            </main>

            {/* ── Right: Analysis Panel ─────────────────────── */}
            <aside className="analysis-panel">
                {/* Performance Metrics */}
                <div className="analysis-section">
                    <div className="analysis-section-header">
                        <span className="analysis-section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <IconChart /> Performance
                        </span>
                        {metrics && <span className="analysis-section-badge">{metrics.backend.toUpperCase()}</span>}
                    </div>
                    <MetricsPanel />
                </div>

                {/* Detection Results Table */}
                <div className="analysis-section" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <div className="analysis-section-header">
                        <span className="analysis-section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <IconList /> Detection Results
                        </span>
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <DetectionResultTable />
                    </div>
                </div>
            </aside>
        </div>
    );
}
