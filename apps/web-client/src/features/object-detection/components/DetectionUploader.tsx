import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useDetectionStore } from '../store/detectionStore';
import { useObjectDetection } from '../hooks/useObjectDetection';

export function DetectionUploader() {
    const {
        step,
        modelName,
        preferredBackend,
        enableMetrics,
        imageFile,
        setPreferredBackend,
        setEnableMetrics,
        setImageFile,
        reset
    } = useDetectionStore();

    const { loading, loadModelFiles, loadUampFile, runInference } = useObjectDetection();

    const [uploadMode, setUploadMode] = useState<'zip' | 'manual'>('zip');
    
    // File inputs references
    const zipInputRef = useRef<HTMLInputElement>(null);
    const onnxInputRef = useRef<HTMLInputElement>(null);
    const labelInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    // Staged manual files
    const [onnxFile, setOnnxFile] = useState<File | null>(null);
    const [labelFile, setLabelFile] = useState<File | null>(null);

    const isModelLoaded = step !== 'idle' && modelName !== null;

    async function handleZipChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        await loadUampFile(file);
    }

    async function handleManualLoad() {
        if (!onnxFile) return;
        await loadModelFiles(onnxFile, labelFile);
    }

    function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const previewUrl = URL.createObjectURL(file);
        setImageFile(file, previewUrl);
    }

    const showRunButton = step === 'image-ready' || step === 'done' || step === 'running';

    return (
        <div className="uploader-section">
            {/* Section 1: Model Setup */}
            <div className="card">
                <h3 className="card-title">1. Muat Model Deteksi</h3>
                
                {/* Preferred Backend */}
                <div className="setting-field">
                    <label className="setting-label">Backend Terpilih</label>
                    <select
                        className="select-input"
                        value={preferredBackend}
                        onChange={(e: any) => setPreferredBackend(e.target.value)}
                        disabled={loading}
                    >
                        <option value="auto">Auto (WebGPU / WASM)</option>
                        <option value="webgpu">WebGPU Only</option>
                        <option value="wasm">WebAssembly (WASM)</option>
                    </select>
                </div>

                {/* Enable Metrics Checkbox */}
                <div className="checkbox-field">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={enableMetrics}
                            onChange={(e) => setEnableMetrics(e.target.checked)}
                            disabled={loading}
                        />
                        Aktifkan Metrik Performa
                    </label>
                </div>

                <div className="upload-mode-selector">
                    <button
                        className={`mode-tab-btn ${uploadMode === 'zip' ? 'active' : ''}`}
                        onClick={() => setUploadMode('zip')}
                        disabled={loading}
                    >
                        UAMP Package (.zip)
                    </button>
                    <button
                        className={`mode-tab-btn ${uploadMode === 'manual' ? 'active' : ''}`}
                        onClick={() => setUploadMode('manual')}
                        disabled={loading}
                    >
                        ONNX + Label Manual
                    </button>
                </div>

                {uploadMode === 'zip' ? (
                    /* Mode UAMP ZIP */
                    <div className="upload-field-container">
                        <button
                            className="upload-btn"
                            onClick={() => zipInputRef.current?.click()}
                            disabled={loading}
                        >
                            {loading ? 'Memproses ZIP...' : 'Pilih UAMP Package (.zip)'}
                        </button>
                        <input
                            ref={zipInputRef}
                            type="file"
                            accept=".zip"
                            hidden
                            onChange={handleZipChange}
                        />
                    </div>
                ) : (
                    /* Mode Manual ONNX + label */
                    <div className="manual-uploader-grid">
                        <div className="upload-field">
                            <label className="field-label">File Model (.onnx)</label>
                            <button
                                className="upload-btn upload-btn--small"
                                onClick={() => onnxInputRef.current?.click()}
                                disabled={loading}
                            >
                                {onnxFile ? onnxFile.name : 'Model (.onnx)'}
                            </button>
                            <input
                                ref={onnxInputRef}
                                type="file"
                                accept=".onnx"
                                hidden
                                onChange={(e) => setOnnxFile(e.target.files?.[0] ?? null)}
                            />
                        </div>
                        <div className="upload-field">
                            <label className="field-label">File Label (.txt) - Opsional</label>
                            <button
                                className="upload-btn upload-btn--small"
                                onClick={() => labelInputRef.current?.click()}
                                disabled={loading}
                            >
                                {labelFile ? labelFile.name : 'Labels (.txt)'}
                            </button>
                            <input
                                ref={labelInputRef}
                                type="file"
                                accept=".txt"
                                hidden
                                onChange={(e) => setLabelFile(e.target.files?.[0] ?? null)}
                            />
                        </div>
                        <button
                            className="btn-primary"
                            onClick={handleManualLoad}
                            disabled={!onnxFile || loading}
                        >
                            {loading ? 'Memuat model...' : 'Muat Model Manual'}
                        </button>
                    </div>
                )}

                {/* Model Loaded status indicator */}
                {isModelLoaded && (
                    <div className="status-indicator success">
                        <span className="indicator-icon">✓</span>
                        <div className="indicator-details">
                            <span className="indicator-title">Model Aktif</span>
                            <span className="indicator-text">{modelName}</span>
                        </div>
                        <button className="reset-btn" onClick={reset}>Reset</button>
                    </div>
                )}
            </div>

            {/* Section 2: Image Selection */}
            {isModelLoaded && (
                <div className="card">
                    <h3 className="card-title">2. Pilih Gambar Input</h3>
                    <button
                        className="upload-btn image-picker-btn"
                        onClick={() => imageInputRef.current?.click()}
                    >
                        {imageFile ? imageFile.name : 'Pilih Gambar (JPG, PNG, WEBP)'}
                    </button>
                    <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/bmp"
                        hidden
                        onChange={handleImageChange}
                    />

                    {showRunButton && (
                        <button
                            className="btn-primary btn-run"
                            style={{ marginTop: '12px' }}
                            onClick={runInference}
                            disabled={step === 'running'}
                        >
                            {step === 'running' ? 'Menjalankan...' : '▶ Jalankan Deteksi'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
