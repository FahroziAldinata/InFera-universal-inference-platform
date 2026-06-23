import { create } from 'zustand';
import type { Detection } from '@infera/plugin-object-detection';

export type DetectionStep =
    | 'idle'
    | 'model-ready'
    | 'image-ready'
    | 'running'
    | 'done'
    | 'error';

export interface DetectionState {
    step: DetectionStep;
    modelName: string | null;
    labels: string[];
    inputShape: number[];
    imageFile: File | null;
    imagePreviewUrl: string | null;
    detections: Detection[];
    metrics: any | null; // InferenceMetrics
    errorMessage: string | null;

    // Preferences
    preferredBackend: 'auto' | 'webgpu' | 'wasm';
    enableMetrics: boolean;
    showLabels: boolean;
    showBoxes: boolean;
    showConfidence: boolean;
    zoom: number;
    panX: number;
    panY: number;
    activeDetectionIndex: number | null;

    // Actions
    setStep: (step: DetectionStep) => void;
    setModelInfo: (name: string, labels: string[], shape: number[]) => void;
    setImageFile: (file: File, previewUrl: string) => void;
    setDetections: (detections: Detection[], metrics: any) => void;
    setError: (message: string) => void;
    setPreferredBackend: (backend: 'auto' | 'webgpu' | 'wasm') => void;
    setEnableMetrics: (enable: boolean) => void;
    setShowLabels: (show: boolean) => void;
    setShowBoxes: (show: boolean) => void;
    setShowConfidence: (show: boolean) => void;
    setZoom: (zoom: number) => void;
    setPan: (x: number, y: number) => void;
    setActiveDetectionIndex: (index: number | null) => void;
    reset: () => void;
}

const initialState = {
    step: 'idle' as DetectionStep,
    modelName: null,
    labels: [],
    inputShape: [1, 3, 640, 640],
    imageFile: null,
    imagePreviewUrl: null,
    detections: [],
    metrics: null,
    errorMessage: null,
    preferredBackend: 'auto' as const,
    enableMetrics: true,
    showLabels: true,
    showBoxes: true,
    showConfidence: true,
    zoom: 1,
    panX: 0,
    panY: 0,
    activeDetectionIndex: null,
};

export const useDetectionStore = create<DetectionState>((set) => ({
    ...initialState,

    setStep: (step) => set({ step }),

    setModelInfo: (name, labels, shape) =>
        set({
            step: 'model-ready',
            modelName: name,
            labels,
            inputShape: shape,
            errorMessage: null,
            detections: [],
            metrics: null,
            imageFile: null,
            imagePreviewUrl: null,
        }),

    setImageFile: (file, previewUrl) =>
        set({
            step: 'image-ready',
            imageFile: file,
            imagePreviewUrl: previewUrl,
            detections: [],
            metrics: null,
            errorMessage: null,
            zoom: 1,
            panX: 0,
            panY: 0,
            activeDetectionIndex: null,
        }),

    setDetections: (detections, metrics) =>
        set({
            step: 'done',
            detections,
            metrics,
            errorMessage: null,
        }),

    setError: (message) =>
        set({
            step: 'error',
            errorMessage: message,
        }),

    setPreferredBackend: (backend) => set({ preferredBackend: backend }),
    setEnableMetrics: (enable) => set({ enableMetrics: enable }),
    setShowLabels: (show) => set({ showLabels: show }),
    setShowBoxes: (show) => set({ showBoxes: show }),
    setShowConfidence: (show) => set({ showConfidence: show }),
    setZoom: (zoom) => set({ zoom }),
    setPan: (x, y) => set({ panX: x, panY: y }),
    setActiveDetectionIndex: (index) => set({ activeDetectionIndex: index }),

    reset: () => set(initialState),
}));
