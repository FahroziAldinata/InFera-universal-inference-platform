import { useState, useEffect } from 'react';
import { ModelUploader } from './components/ModelUploader';
import { ImageUploader } from './components/ImageUploader';
import { RunButton } from './components/RunButton';
import { useInferenceStore } from './store/inferenceStore';
import { ObjectDetectionPage } from './features/object-detection/pages/ObjectDetectionPage';
import { ResultExplanationPanel } from './components/ResultExplanationPanel';
import './App.css';

/* ── Sidebar SVG Icons ─────────────────────────────────── */
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
const IconImage = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
  </svg>
);
const IconZoomIn = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
  </svg>
);
const IconZoomOut = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/>
  </svg>
);
const IconFit = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>
  </svg>
);

/* ── Shared Sidebar ─────────────────────────────────────── */
interface WorkspaceSidebarProps {
  activeTab: 'classification' | 'detection';
  onTabChange: (tab: 'home' | 'classification' | 'detection') => void;
  children?: React.ReactNode;
}

function WorkspaceSidebar({ activeTab, onTabChange, children }: WorkspaceSidebarProps) {
  return (
    <aside className="sidebar">
      <div className="menu-section">
        <div className="menu-item" onClick={() => onTabChange('home')}>
          <span className="menu-icon-svg"><IconHome /></span>
          <span>Dashboard</span>
        </div>
        <div className={`menu-item ${activeTab === 'classification' ? 'active' : ''}`} onClick={() => onTabChange('classification')}>
          <span className="menu-icon-svg"><IconClassify /></span>
          <span>Image Classification</span>
        </div>
        <div className={`menu-item ${activeTab === 'detection' ? 'active' : ''}`} onClick={() => onTabChange('detection')}>
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
      {children}

      <div className="sidebar-footer">
        <div className="backend-status-card">
          <div className="backend-status-header">
            <div className="backend-status-icon"><IconGpu /></div>
            <div>
              <div className="backend-status-title">Inference Backend</div>
              <div className="backend-status-sub">Real-time status</div>
            </div>
          </div>
          <div className="backend-status-row">
            <span className="backend-status-label">WebGPU</span>
            <span className="backend-status-badge active">Active</span>
          </div>
          <div className="backend-status-row">
            <span className="backend-status-label">WASM Fallback</span>
            <span className="backend-status-badge fallback">Standby</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ── Status Bar ─────────────────────────────────────────── */
function StatusBar() {
  const { step, modelInfo, executionTimeMs } = useInferenceStore();
  const stepLabel: Record<string, string> = {
    idle: 'No model loaded',
    'model-ready': `Model ready — ${modelInfo?.modelName ?? ''}`,
    'image-ready': 'Ready to run',
    running: 'Running inference...',
    done: `Inference complete — ${executionTimeMs?.toFixed(1) ?? '?'} ms`,
    error: 'Error occurred',
  };
  return (
    <div className="statusbar">
      <span className="statusbar-brand">INFERA</span>
      <span className="statusbar-sep" />
      <span className={`statusbar-step statusbar-step--${step}`}>{stepLabel[step] ?? step}</span>
      {modelInfo && (
        <>
          <span className="statusbar-sep" />
          <span className="statusbar-meta">{modelInfo.inputShape.join('×')}</span>
          <span className="statusbar-sep" />
          <span className="statusbar-meta">{modelInfo.labelCount} classes</span>
        </>
      )}
    </div>
  );
}

/* ── Classification Right Analysis Panel ────────────────── */
interface ClassificationAnalysisPanelProps {
  showProbabilities: boolean;
  topKCount: number;
}

function ClassificationAnalysisPanel({ showProbabilities, topKCount }: ClassificationAnalysisPanelProps) {
  const { step, modelInfo, result, executionTimeMs, errorMessage } = useInferenceStore();
  const topPrediction = result && result.topK.length > 0 ? result.topK[0] : null;

  const getConfidenceBadge = (conf: number) => {
    if (conf >= 0.90) return { cls: 'very-high', label: 'Very High' };
    if (conf >= 0.70) return { cls: 'high', label: 'High' };
    if (conf >= 0.40) return { cls: 'medium', label: 'Medium' };
    return { cls: 'low', label: 'Low' };
  };

  return (
    <aside className="analysis-panel">
      {/* Model Info */}
      <div className="analysis-section">
        <div className="analysis-section-header">
          <span className="analysis-section-title">Model Info</span>
          {step === 'done' && executionTimeMs && (
            <span className="analysis-section-badge">{executionTimeMs.toFixed(1)} ms</span>
          )}
        </div>
        {!modelInfo ? (
          <div className="model-info-placeholder">No model loaded</div>
        ) : (
          <div className="model-info-card">
            <div className="model-info-row">
              <span className="model-info-key">File</span>
              <span className="model-info-val" style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{modelInfo.modelName}</span>
            </div>
            <div className="model-info-row">
              <span className="model-info-key">Input</span>
              <span className="model-info-val">{modelInfo.inputShape.join(' × ')}</span>
            </div>
            <div className="model-info-row">
              <span className="model-info-key">Classes</span>
              <span className="model-info-val">{modelInfo.labelCount}</span>
            </div>
            <div className="model-info-row">
              <span className="model-info-key">Status</span>
              <span className="model-info-val status-dot-green">
                {step === 'running' ? '⚡ Running' : '● Ready'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Top Predictions */}
      <div className="analysis-section">
        <div className="analysis-section-header">
          <span className="analysis-section-title">Top Predictions</span>
        </div>
        {step === 'error' && errorMessage ? (
          <div style={{ fontSize: '12px', color: 'var(--red)', fontFamily: 'var(--mono)', lineHeight: 1.5 }}>{errorMessage}</div>
        ) : step !== 'done' || !result ? (
          <div className="prediction-empty">Run inference to see predictions.</div>
        ) : (
          <div className="prediction-list">
            {result.topK.slice(0, topKCount).map((item) => {
              const badge = getConfidenceBadge(item.confidence);
              const isTop = item.rank === 1;
              return (
                <div key={item.rank} className={`prediction-card ${isTop ? 'top-prediction' : ''}`}>
                  <div className="prediction-card-header">
                    <span className="prediction-rank">#{item.rank}{isTop ? ' · Best Match' : ''}</span>
                    <span className="prediction-confidence-pct">{(item.confidence * 100).toFixed(2)}%</span>
                  </div>
                  <div className="prediction-label" title={item.label}>{item.label}</div>
                  {showProbabilities && (
                    <div className="prediction-bar-bg">
                      <div className="prediction-bar-fill" style={{ width: `${(item.confidence * 100).toFixed(2)}%` }} />
                    </div>
                  )}
                  {isTop && (
                    <div style={{ marginTop: '8px' }}>
                      <span className={`confidence-badge ${badge.cls}`}>{badge.label} Confidence</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Explanation */}
      {step === 'done' && topPrediction && (
        <ResultExplanationPanel label={topPrediction.label} confidence={topPrediction.confidence} />
      )}

      {/* Display Options */}
      <div className="analysis-section">
        <div className="analysis-section-header">
          <span className="analysis-section-title">Display</span>
        </div>
        <div className="visual-options-panel">
          <label className="sidebar-checkbox-label">
            <input type="checkbox" checked={showProbabilities} onChange={() => {}} readOnly />
            <span>Show Probability Bars</span>
          </label>
        </div>
      </div>
    </aside>
  );
}

/* ── Main App ────────────────────────────────────────────── */
function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'classification' | 'detection'>('home');
  const [activeNav, setActiveNav] = useState<'home' | 'features' | 'workflow' | 'docs' | 'about'>('home');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('infera-theme') as 'dark' | 'light') || 'dark';
  });
  const [showProbabilities, setShowProbabilities] = useState(true);
  const [topKCount, setTopKCount] = useState(3);
  const [classZoom, setClassZoom] = useState(1);

  const { imagePreviewUrl } = useInferenceStore();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('infera-theme', theme);
  }, [theme]);

  const handleNavClick = (sectionId: string, navId: 'home' | 'features' | 'workflow' | 'docs' | 'about') => {
    setActiveTab('home');
    setActiveNav(navId);
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="workstation">
      {/* ── Global Header ──────────────────────────────────── */}
      <header className="titlebar glass-header">
        <div className="header-left" onClick={() => { setActiveTab('home'); setActiveNav('home'); }} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg className="logo-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 24, height: 24 }}>
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="url(#logo-grad)" strokeWidth="2"/>
            <path d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" stroke="url(#logo-grad)" strokeWidth="1.5" strokeDasharray="3 3"/>
            <path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" fill="url(#logo-grad)"/>
            <defs>
              <linearGradient id="logo-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#7C3AED"/><stop offset="1" stopColor="#3B82F6"/>
              </linearGradient>
            </defs>
          </svg>
          <span className="titlebar-title-custom">InFera</span>
        </div>

        <nav className="header-nav">
          <button className={`nav-link ${activeTab === 'home' && activeNav === 'home' ? 'active' : ''}`} onClick={() => { setActiveTab('home'); setActiveNav('home'); }}>Beranda</button>
          <button className={`nav-link ${activeTab === 'home' && activeNav === 'features' ? 'active' : ''}`} onClick={() => handleNavClick('features', 'features')}>Fitur</button>
          <button className={`nav-link ${activeTab === 'home' && activeNav === 'workflow' ? 'active' : ''}`} onClick={() => handleNavClick('workflow', 'workflow')}>Workflow</button>
          <button className={`nav-link ${activeTab === 'home' && activeNav === 'docs' ? 'active' : ''}`} onClick={() => handleNavClick('about', 'docs')}>Dokumentasi</button>
          <button className={`nav-link ${activeTab === 'home' && activeNav === 'about' ? 'active' : ''}`} onClick={() => handleNavClick('about', 'about')}>Tentang</button>
        </nav>

        <div className="header-right">
          <button className="btn-primary start-btn" onClick={() => { setActiveTab('classification'); setActiveNav('home'); }} style={{ height: '36px' }}>
            Mulai Sekarang
          </button>
          <button className="theme-toggle-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* ── Pages ──────────────────────────────────────────── */}
      {activeTab === 'home' ? (
        <div className="landing-page">
          {/* Hero */}
          <section className="hero-section">
            <div className="hero-content">
              <span className="badge-pill"><span className="badge-dot"></span>Open Source</span>
              <h1 className="hero-title">Uji Model AI Anda <br />Langsung <span className="text-gradient">di Browser</span></h1>
              <p className="hero-subtitle">InFera adalah platform universal untuk menguji, memvalidasi, dan membandingkan model AI Anda secara lokal, cepat, dan aman.</p>
              <div className="hero-cta-group">
                <button className="btn-primary hero-btn" onClick={() => setActiveTab('classification')}>Mulai Workflow</button>
                <a href="#features" className="btn-secondary hero-btn">Lihat Dokumentasi</a>
              </div>
            </div>
            <div className="hero-illustration">
              <div className="illustration-glow-violet"></div>
              <div className="illustration-glow-blue"></div>
              <div className="sphere sphere-1"></div>
              <div className="sphere sphere-2"></div>
              <div className="sphere sphere-3"></div>
              <div className="mockup-container">
                <div className="mockup-desktop">
                  <div className="mockup-header">
                    <span className="dot dot-red"></span><span className="dot dot-yellow"></span><span className="dot dot-green"></span>
                    <span className="mockup-url">infera.dev/workspace</span>
                  </div>
                  <div className="mockup-desktop-body">
                    <div className="mockup-grid">
                      <div className="mockup-chart-card card-doughnut">
                        <div className="chart-ring"><div className="chart-ring-inner"></div></div>
                        <div className="mockup-lines"><div className="mockup-line line-sm"></div><div className="mockup-line line-md"></div></div>
                      </div>
                      <div className="mockup-chart-card card-bars">
                        <div className="bar-chart-bars">
                          <div className="bar-chart-bar" style={{ height: '40%' }}></div>
                          <div className="bar-chart-bar" style={{ height: '70%' }}></div>
                          <div className="bar-chart-bar" style={{ height: '55%' }}></div>
                          <div className="bar-chart-bar" style={{ height: '85%' }}></div>
                        </div>
                      </div>
                      <div className="mockup-chart-card card-lines">
                        <div className="line-chart-waves">
                          <svg viewBox="0 0 100 40" className="wave-svg">
                            <path d="M0,30 Q25,5 50,25 T100,10 L100,40 L0,40 Z" fill="rgba(124, 58, 237, 0.1)" stroke="var(--accent)" strokeWidth="1.5" />
                          </svg>
                        </div>
                      </div>
                      <div className="mockup-settings-card"></div>
                    </div>
                  </div>
                </div>
                <div className="mockup-mobile">
                  <div className="mockup-mobile-header"><div className="camera-dot"></div><div className="speaker-grill"></div></div>
                  <div className="mockup-mobile-body">
                    <div className="mobile-chart-ring"><div className="mobile-chart-ring-inner"></div></div>
                    <div className="mobile-list">
                      <div className="mobile-item"><div className="mobile-item-bullet"></div><div className="mobile-item-line"></div></div>
                      <div className="mobile-item"><div className="mobile-item-bullet"></div><div className="mobile-item-line"></div></div>
                      <div className="mobile-item"><div className="mobile-item-bullet"></div><div className="mobile-item-line"></div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features */}
          <section id="features" className="features-section">
            <div className="features-grid">
              {[
                { icon: <><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></>, title: '100% di Browser', desc: 'Tidak perlu server atau GPU. Jalankan model AI langsung di perangkat Anda.' },
                { icon: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />, title: 'Performa Tinggi', desc: 'Memanfaatkan WebGPU untuk kecepatan inferensi maksimal.' },
                { icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />, title: 'Aman & Privat', desc: 'Semua data dan model berada di perangkat Anda. Tidak ada upload.' },
                { icon: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></>, title: 'Dukungan Model Luas', desc: 'ONNX, UAMP, YOLO, dan banyak format model AI lainnya.' },
              ].map((f, i) => (
                <div key={i} className="feature-card">
                  <div className="feature-icon-wrapper">
                    <svg className="feature-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>{f.icon}</svg>
                  </div>
                  <h3 className="feature-title">{f.title}</h3>
                  <p className="feature-desc">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Workflow */}
          <section id="workflow" className="workflow-section">
            <h2 className="workflow-section-title">Workflow Sederhana</h2>
            <p className="workflow-section-subtitle">Tiga langkah untuk menguji model Anda</p>
            <div className="workflow-grid">
              {[
                { title: '1. Upload Model & Data', desc: 'Unggah model (.onnx/.uamp) dan gambar yang ingin diuji.' },
                null,
                { title: '2. Jalankan Inferensi', desc: 'Pilih backend (WebGPU/WASM) dan jalankan inferensi.' },
                null,
                { title: '3. Analisis Hasil', desc: 'Lihat hasil prediksi, metrik performa, dan ekspor data.' },
              ].map((item, i) => item === null ? (
                <div key={i} className="workflow-arrow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 18, height: 18, opacity: 0.3 }}>
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              ) : (
                <div key={i} className="workflow-card">
                  <div className="workflow-num">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  </div>
                  <div className="workflow-card-content">
                    <h3 className="workflow-title">{item.title}</h3>
                    <p className="workflow-desc">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Stats */}
          <section className="stats-section">
            <div className="stats-grid-row">
              <div className="stat-card"><span className="stat-number">100%</span><span className="stat-label">Client-side</span></div>
              <div className="stat-divider"></div>
              <div className="stat-card"><span className="stat-number">WebGPU</span><span className="stat-label">Akselerasi</span></div>
              <div className="stat-divider"></div>
              <div className="stat-card"><span className="stat-number">Privat</span><span className="stat-label">Data Aman</span></div>
              <div className="stat-divider"></div>
              <div className="stat-card"><span className="stat-number">Open Source</span><span className="stat-label">MIT License</span></div>
            </div>
          </section>

          {/* Footer */}
          <footer id="about" className="landing-footer">
            <div className="footer-content">
              <p className="footer-text">Created by Fahrozi Aldinata and support AI</p>
              <a href="https://github.com/FahroziAldinata/InFera-universal-inference-platform" target="_blank" rel="noopener noreferrer" className="github-btn">
                <span className="github-icon">⭐</span> Star on GitHub <span className="github-badge">12.3k</span>
              </a>
            </div>
          </footer>
        </div>

      ) : activeTab === 'classification' ? (
        /* ── Image Classification Workspace ──────────────── */
        <div className="workspace classification-workspace">
          <WorkspaceSidebar activeTab="classification" onTabChange={setActiveTab}>
            <div className="sidebar-divider" />
            <div className="section-header">Model</div>
            <ModelUploader />
            <div className="sidebar-divider" />
            <div className="section-header">Input Image</div>
            <ImageUploader />
            <RunButton />
            <div className="sidebar-divider" />
            <div className="section-header">Visual Options</div>
            <div className="visual-options-panel">
              <label className="sidebar-checkbox-label">
                <input type="checkbox" checked={showProbabilities} onChange={(e) => setShowProbabilities(e.target.checked)} />
                <span>Probability Bars</span>
              </label>
              <label className="sidebar-select-label">
                <span className="select-label-text">Top-K Results</span>
                <select className="select-input" value={topKCount} onChange={(e) => setTopKCount(Number(e.target.value))}>
                  <option value="1">Top 1</option>
                  <option value="3">Top 3</option>
                  <option value="5">Top 5</option>
                </select>
              </label>
              <label className="sidebar-checkbox-label">
                <input type="checkbox" checked={theme === 'dark'} onChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
                <span>Dark Mode</span>
              </label>
            </div>
          </WorkspaceSidebar>

          {/* Center: Image Viewer Card */}
          <main className="workspace-center">
            <div className="viewer-card">
              <div className="viewer-card-header">
                <div className="viewer-card-title">
                  <div className="viewer-card-icon"><IconImage /></div>
                  <span className="viewer-card-name">Image Classification</span>
                  {imagePreviewUrl && <span className="viewer-card-sub">· Preview</span>}
                </div>
                <div className="viewer-card-actions">
                  {imagePreviewUrl && (
                    <>
                      <button className="viewer-action-btn" onClick={() => setClassZoom(p => Math.min(p * 1.25, 5))} title="Zoom In">
                        <IconZoomIn /> +
                      </button>
                      <button className="viewer-action-btn" onClick={() => setClassZoom(p => Math.max(p / 1.25, 0.25))} title="Zoom Out">
                        <IconZoomOut /> −
                      </button>
                      <button className="viewer-action-btn" onClick={() => setClassZoom(1)} title="Fit">
                        <IconFit /> Fit
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="viewer-body">
                {imagePreviewUrl ? (
                  <img
                    src={imagePreviewUrl}
                    alt="Preview"
                    className="classification-main-img"
                    style={{ transform: `scale(${classZoom})`, transformOrigin: 'center center', transition: 'transform 0.15s ease' }}
                  />
                ) : (
                  <div className="viewer-empty-state">
                    <div className="viewer-empty-icon"><IconImage /></div>
                    <div className="viewer-empty-title">No Image Selected</div>
                    <div className="viewer-empty-sub">Upload a model and select an image from the sidebar to begin classification.</div>
                  </div>
                )}
              </div>

              {imagePreviewUrl && (
                <div className="viewer-toolbar">
                  <span className="viewer-toolbar-zoom-text">{(classZoom * 100).toFixed(0)}%</span>
                  <div className="viewer-toolbar-sep" />
                  <button className="viewer-toolbar-btn" onClick={() => setClassZoom(p => Math.min(p * 1.25, 5))}>
                    <IconZoomIn /> Zoom In
                  </button>
                  <button className="viewer-toolbar-btn" onClick={() => setClassZoom(p => Math.max(p / 1.25, 0.25))}>
                    <IconZoomOut /> Zoom Out
                  </button>
                  <button className="viewer-toolbar-btn" onClick={() => setClassZoom(1)}>
                    <IconFit /> Fit
                  </button>
                </div>
              )}
            </div>
          </main>

          {/* Right: Analysis Panel */}
          <ClassificationAnalysisPanel showProbabilities={showProbabilities} topKCount={topKCount} />
        </div>

      ) : (
        /* ── Object Detection Workspace ──────────────────── */
        <ObjectDetectionPage onTabChange={setActiveTab} />
      )}

      {activeTab === 'classification' && <StatusBar />}
    </div>
  );
}

export default App;