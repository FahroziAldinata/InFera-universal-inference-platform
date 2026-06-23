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
    showCrosshair: boolean;
    showTooltip: boolean;
    zoom: number;
    panX: number;
    panY: number;
    hoveredDetectionId: string | null;
    selectedDetectionId: string | null;
    selectedDetectionIds: string[];

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
    setShowCrosshair: (show: boolean) => void;
    setShowTooltip: (show: boolean) => void;
    setZoom: (zoom: number) => void;
    setPan: (x: number, y: number) => void;
    setHoveredDetectionId: (id: string | null) => void;
    setSelectedDetectionId: (id: string | null) => void;
    setSelectedDetectionIds: (ids: string[]) => void;
    focusDetection: (id: string, viewportWidth: number, viewportHeight: number) => void;
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
    showCrosshair: false,
    showTooltip: true,
    zoom: 1,
    panX: 0,
    panY: 0,
    hoveredDetectionId: null,
    selectedDetectionId: null,
    selectedDetectionIds: [],
};

export const useDetectionStore = create<DetectionState>((set, get) => ({
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
            hoveredDetectionId: null,
            selectedDetectionId: null,
            selectedDetectionIds: [],
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
    setShowCrosshair: (show) => set({ showCrosshair: show }),
    setShowTooltip: (show) => set({ showTooltip: show }),
    setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(zoom, 20)) }),
    setPan: (x, y) => set({ panX: x, panY: y }),
    setHoveredDetectionId: (id) => set({ hoveredDetectionId: id }),
    setSelectedDetectionId: (id) => set({ selectedDetectionId: id }),
    setSelectedDetectionIds: (ids) => set({ selectedDetectionIds: ids }),
    focusDetection: (id, viewportWidth, viewportHeight) => {
        const state = get();
        const det = state.detections.find((d) => d.id === id);
        if (!det) return;

        // Double click sets absolute zoom to 2.0x
        const targetZoom = 2; 
        const centerX = det.x + det.width / 2;
        const centerY = det.y + det.height / 2;

        // Align target center to viewport center
        const targetPanX = viewportWidth / 2 - centerX * targetZoom;
        const targetPanY = viewportHeight / 2 - centerY * targetZoom;

        set({
            selectedDetectionId: id,
            zoom: targetZoom,
            panX: targetPanX,
            panY: targetPanY,
        });
    },

    reset: () => set(initialState),
}));
