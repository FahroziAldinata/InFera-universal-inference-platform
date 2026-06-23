import { useState } from 'react';
import { ModelUploader } from './components/ModelUploader';
import { ImageUploader } from './components/ImageUploader';
import { RunButton } from './components/RunButton';
import { useInferenceStore } from './store/inferenceStore';
import { ObjectDetectionPage } from './features/object-detection/pages/ObjectDetectionPage';
import './App.css';

function StatusBar() {
  const { step, modelInfo, executionTimeMs } = useInferenceStore();
  const stepLabel: Record<string, string> = {
    idle: 'No model loaded',
    'model-ready': `Model loaded — ${modelInfo?.modelName ?? ''}`,
    'image-ready': `Ready to run`,
    running: 'Running inference...',
    done: `Done — ${executionTimeMs?.toFixed(1) ?? '?'} ms`,
    error: 'Error',
  };
  return (
    <div className="statusbar">
      <span className="statusbar-brand">INFERA</span>
      <span className="statusbar-sep" />
      <span className={`statusbar-step statusbar-step--${step}`}>
        {stepLabel[step] ?? step}
      </span>
      {modelInfo && (
        <>
          <span className="statusbar-sep" />
          <span className="statusbar-meta">{modelInfo.inputShape.join('×')}</span>
          <span className="statusbar-sep" />
          <span className="statusbar-meta">{modelInfo.labelCount} labels</span>
        </>
      )}
    </div>
  );
}

function RightPanel() {
  const { step, modelInfo, imagePreviewUrl, result, executionTimeMs, errorMessage } = useInferenceStore();

  return (
    <div className="right-panel">

      {/* MODEL INFO */}
      <div className="rp-section">
        <div className="rp-section-header">
          <span className="rp-section-title">MODEL INFO</span>
        </div>
        <div className="rp-section-body">
          {!modelInfo ? (
            <p className="rp-empty">No model loaded.</p>
          ) : (
            <table className="info-table">
              <tbody>
                <tr>
                  <td className="info-key">File</td>
                  <td className="info-val">{modelInfo.modelName}</td>
                </tr>
                <tr>
                  <td className="info-key">Input Shape</td>
                  <td className="info-val mono">{modelInfo.inputShape.join(' × ')}</td>
                </tr>
                <tr>
                  <td className="info-key">Labels</td>
                  <td className="info-val mono">{modelInfo.labelCount} classes</td>
                </tr>
                <tr>
                  <td className="info-key">Status</td>
                  <td className="info-val">
                    <span className={`status-badge status-badge--${step}`}>
                      {step === 'running' ? 'Running' : 'Ready'}
                    </span>
                  </td>
                </tr>
                {executionTimeMs !== null && (
                  <tr>
                    <td className="info-key">Last Run</td>
                    <td className="info-val mono highlight">{executionTimeMs.toFixed(2)} ms</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="rp-divider" />

      {/* INPUT IMAGE */}
      <div className="rp-section">
        <div className="rp-section-header">
          <span className="rp-section-title">INPUT IMAGE</span>
        </div>
        <div className="rp-section-body">
          {!imagePreviewUrl ? (
            <p className="rp-empty">No image selected.</p>
          ) : (
            <img src={imagePreviewUrl} alt="Input preview" className="rp-image-preview" />
          )}
        </div>
      </div>

      <div className="rp-divider" />

      {/* OUTPUT */}
      <div className="rp-section rp-section--grow">
        <div className="rp-section-header">
          <span className="rp-section-title">OUTPUT</span>
          {executionTimeMs !== null && (
            <span className="rp-section-meta">{executionTimeMs.toFixed(2)} ms</span>
          )}
        </div>
        <div className="rp-section-body rp-section-body--scroll">
          {step === 'error' && errorMessage ? (
            <p className="error-message">{errorMessage}</p>
          ) : step !== 'done' || !result ? (
            <p className="rp-empty">Run inference to see results.</p>
          ) : (
            <ul className="result-list">
              {result.topK.map((item) => (
                <li key={item.rank} className={`result-item ${item.rank === 1 ? 'result-item--top' : ''}`}>
                  <span className="result-rank">#{item.rank}</span>
                  <div className="result-bar-wrap">
                    <div className="result-label-row">
                      <span className="result-label">{item.label}</span>
                      <span className="result-confidence">{(item.confidence * 100).toFixed(2)}%</span>
                    </div>
                    <div className="result-bar-bg">
                      <div className="result-bar-fill" style={{ width: `${(item.confidence * 100).toFixed(2)}%` }} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState<'classification' | 'detection'>('classification');

  return (
    <div className="workstation">
      <div className="titlebar">
        <span className="titlebar-title">INFERA</span>
        <span className="titlebar-divider" />
        <span className="titlebar-subtitle">Universal Inference Platform</span>
        
        <div className="tab-switcher">
          <button 
            className={`tab-btn ${activeTab === 'classification' ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab('classification')}
          >
            Classification
          </button>
          <button 
            className={`tab-btn ${activeTab === 'detection' ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab('detection')}
          >
            Object Detection (WebGPU)
          </button>
        </div>
      </div>

      {activeTab === 'classification' ? (
        <div className="workspace">
          <aside className="sidebar">
            <div className="section-header">MODEL</div>
            <ModelUploader />
            <div className="sidebar-divider" />
            <div className="section-header">INPUT</div>
            <ImageUploader />
            <RunButton />
          </aside>

          <RightPanel />
        </div>
      ) : (
        <ObjectDetectionPage />
      )}

      {activeTab === 'classification' && <StatusBar />}
    </div>
  );
}
export default App;