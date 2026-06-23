import { create } from 'zustand';
import type { ClassificationResult } from '@infera/plugin-image-classification';

// ---------------------------------------------------------------------------
// Tipe state
// ---------------------------------------------------------------------------

export type AppStep =
    | 'idle'          // belum ada apa-apa
    | 'model-ready'   // model & label berhasil dimuat
    | 'image-ready'   // gambar sudah dipilih, siap run
    | 'running'       // inferensi sedang berjalan
    | 'done'          // hasil sudah ada
    | 'error';        // ada error

export interface ModelInfo {
    modelId: string;          // session ID dari OnnxRunner
    modelName: string;        // nama file .onnx
    inputShape: number[];     // [N, C, H, W] dibaca dari model
    labelCount: number;       // jumlah label dari .txt
}

export interface InferenceState {
    // Step tracking
    step: AppStep;

    // Model & label
    modelInfo: ModelInfo | null;
    labelRawText: string;

    // Gambar input
    imageFile: File | null;
    imagePreviewUrl: string | null;

    // Hasil
    result: ClassificationResult | null;
    executionTimeMs: number | null;

    // Error
    errorMessage: string | null;

    // Actions
    setModelReady: (info: ModelInfo, labelRawText: string) => void;
    setImageFile: (file: File, previewUrl: string) => void;
    setRunning: () => void;
    setResult: (result: ClassificationResult, executionTimeMs: number) => void;
    setError: (message: string) => void;
    reset: () => void;
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState = {
    step: 'idle' as AppStep,
    modelInfo: null,
    labelRawText: '',
    imageFile: null,
    imagePreviewUrl: null,
    result: null,
    executionTimeMs: null,
    errorMessage: null,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useInferenceStore = create<InferenceState>((set) => ({
    ...initialState,

    setModelReady: (info, labelRawText) =>
        set({
            step: 'model-ready',
            modelInfo: info,
            labelRawText,
            errorMessage: null,
            // Reset hasil sebelumnya kalau user ganti model
            result: null,
            executionTimeMs: null,
            imageFile: null,
            imagePreviewUrl: null,
        }),

    setImageFile: (file, previewUrl) =>
        set({
            step: 'image-ready',
            imageFile: file,
            imagePreviewUrl: previewUrl,
            // Reset hasil lama kalau user ganti gambar
            result: null,
            executionTimeMs: null,
            errorMessage: null,
        }),

    setRunning: () =>
        set({ step: 'running', errorMessage: null }),

    setResult: (result, executionTimeMs) =>
        set({ step: 'done', result, executionTimeMs }),

    setError: (message) =>
        set({ step: 'error', errorMessage: message }),

    reset: () => set(initialState),
}));