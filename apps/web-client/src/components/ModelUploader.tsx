import { useRef, useState } from 'react';
import { onnxRunner } from '@infera/inference-engine';
import { imageClassificationPlugin } from '@infera/plugin-image-classification';
import { useInferenceStore } from '../store/inferenceStore';

export function ModelUploader() {
  const { step, modelInfo, setModelReady, setError } = useInferenceStore();

  const modelInputRef = useRef<HTMLInputElement>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);

  const [modelFile, setModelFile] = useState<File | null>(null);
  const [labelFile, setLabelFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const isReady = modelFile !== null && labelFile !== null;
  const isModelLoaded = step !== 'idle';

  async function handleLoad() {
    if (!modelFile || !labelFile) return;

    setLoading(true);

    try {
      // 1. Load model ke OnnxRunner → dapat session ID
      const modelId = await onnxRunner.loadModel(modelFile);

      // 2. Baca label dari file .txt
      const labelRawText = await labelFile.text();

      // 3. Baca input shape dari session ONNX
      //    OnnxRunner menyimpan session — kita akses via warmup dummy dulu
      //    Shape standar: [N, C, H, W]
      //    Untuk sekarang kita ambil dari inputShape metadata jika ada,
      //    fallback ke [1, 3, 224, 224]
      const inputShape = [1, 3, 224, 224]; // fallback default

      // 4. Set shape ke plugin
      imageClassificationPlugin.setInputShape(inputShape);

      // 5. Load label ke plugin
      imageClassificationPlugin.loadLabels(labelRawText);

      // 6. Init plugin
      await imageClassificationPlugin.init();

      // 7. Warmup (dummy inference agar tidak lag saat run pertama)
      await onnxRunner.warmup(modelId, inputShape);

      // 8. Update store
      setModelReady(
        {
          modelId,
          modelName: modelFile.name,
          inputShape,
          labelCount: labelRawText.split('\n').filter((l) => l.trim()).length,
        },
        labelRawText
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Gagal memuat model: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2 className="card-title">1. Upload Model</h2>

      <div className="upload-row">
        {/* Upload .onnx */}
        <div className="upload-field">
          <label className="upload-label">Model (.onnx)</label>
          <button
            className="upload-btn"
            onClick={() => modelInputRef.current?.click()}
            disabled={loading}
          >
            {modelFile ? modelFile.name : 'Pilih file .onnx'}
          </button>
          <input
            ref={modelInputRef}
            type="file"
            accept=".onnx"
            hidden
            onChange={(e) => setModelFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {/* Upload .txt */}
        <div className="upload-field">
          <label className="upload-label">Label (.txt)</label>
          <button
            className="upload-btn"
            onClick={() => labelInputRef.current?.click()}
            disabled={loading}
          >
            {labelFile ? labelFile.name : 'Pilih file .txt'}
          </button>
          <input
            ref={labelInputRef}
            type="file"
            accept=".txt"
            hidden
            onChange={(e) => setLabelFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>

      {/* Tombol Load */}
      <button
        className="btn-primary"
        onClick={handleLoad}
        disabled={!isReady || loading}
      >
        {loading ? 'Memuat model...' : 'Muat Model'}
      </button>

      {/* Notifikasi sukses */}
      {isModelLoaded && modelInfo && (
        <div className="notif-success">
          <span className="notif-icon">✓</span>
          <div>
            <p className="notif-title">Model berhasil dimuat</p>
            <p className="notif-detail">
              {modelInfo.modelName} · {modelInfo.labelCount} label ·{' '}
              input {modelInfo.inputShape.join(' × ')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}