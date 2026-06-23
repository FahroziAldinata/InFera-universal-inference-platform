import { decodeYOLO, restoreBoxes, nonMaxSuppression } from '@infera/plugin-object-detection';
import type { DetectionModelMetadata } from '@infera/plugin-object-detection';

self.onmessage = async (e: MessageEvent) => {
    const {
        outputData,
        outputDims,
        config,
        labels,
        preprocessMeta
    } = e.data;

    try {
        const tensor = {
            data: outputData,
            dims: outputDims,
            type: 'float32' as const
        };

        const metadata: DetectionModelMetadata = {
            inputWidth: config.inputWidth,
            inputHeight: config.inputHeight,
            classNames: labels,
            outputNames: ['output0'],
            confidenceThreshold: config.confidenceThreshold,
            iouThreshold: config.iouThreshold,
        };

        // 1. Decode YOLO format output
        const candidates = decodeYOLO(tensor, metadata, config.confidenceThreshold);

        // 2. Restore boxes to original canvas space
        const restored = preprocessMeta
            ? restoreBoxes(candidates, {
                scale: preprocessMeta.scale,
                padX: preprocessMeta.padX,
                padY: preprocessMeta.padY,
                originalWidth: preprocessMeta.originalWidth,
                originalHeight: preprocessMeta.originalHeight,
            })
            : candidates;

        // 3. Non-Maximum Suppression (NMS) filter
        const nmsDetections = nonMaxSuppression(restored, config.iouThreshold);

        // Map detections with stable generated IDs
        const detections = nmsDetections.map((d, index) => ({
            ...d,
            id: `det_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 9)}`,
            label: d.className,
        }));

        self.postMessage({ status: 'success', detections });
    } catch (err) {
        self.postMessage({ 
            status: 'error', 
            error: err instanceof Error ? err.message : String(err) 
        });
    }
};
