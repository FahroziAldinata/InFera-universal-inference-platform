import { useInferenceStore } from '../store/inferenceStore';
import { onnxRunner } from '@infera/inference-engine';
import { imageClassificationPlugin } from '@infera/plugin-image-classification';

export function RunButton() {
  const {
    step,
    modelInfo,
    imageFile,
    setRunning,
    setResult,
    setError,
  } = useInferenceStore();

  const canRun = step === 'image-ready' || step === 'done' || step === 'running';

  async function handleRun() {
    if (!modelInfo || !imageFile) return;

    setRunning();

    try {
      // 1. Buat ImageBitmap dari File
      const bitmap = await createImageBitmap(imageFile);

      // 2. Preprocess → Tensor [1, 3, H, W]
      const inputTensor = await imageClassificationPlugin.preprocess(bitmap);

      // 3. Jalankan inferensi via OnnxRunner
      const outputTensor = await onnxRunner.run(modelInfo.modelId, inputTensor);

      // 4. Postprocess → ClassificationResult
      const inferenceResult = await imageClassificationPlugin.postprocess(outputTensor);

      // 5. Simpan hasil ke store
      setResult(inferenceResult.data, inferenceResult.executionTimeMs);

      // Cleanup bitmap dari memori
      bitmap.close();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Inferensi gagal: ${message}`);
    }
  }

  if (!canRun) return null;

  return (
    <button
      className="btn-primary btn-run"
      onClick={handleRun}
      disabled={step === 'running'}
    >
      {step === 'running' ? 'Menjalankan...' : '▶ Jalankan Inferensi'}
    </button>
  );
}