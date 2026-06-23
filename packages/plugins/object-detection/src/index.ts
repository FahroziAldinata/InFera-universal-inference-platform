export { ObjectDetectionPlugin, objectDetectionPlugin } from './plugin';
export type {
    BoundingBox,
    Detection,
    DetectionResult,
    PluginCapabilities,
    DetectionModelMetadata,
    ObjectDetectionConfig,
    ImageTensor,
    ResizeResult,
    LetterboxResult,
    PreprocessResult,
} from './types';
export { DEFAULT_CONFIG, DEFAULT_CAPABILITIES } from './constants';
export { getModelMetadata } from './metadata';

// Preprocess
export { resizeImage } from './preprocess/resize';
export { normalizePixels } from './preprocess/normalize';
export { letterboxImage } from './preprocess/letterbox';

// Postprocess
export { decodeYOLO } from './postprocess/decoder';
export { decodeYOLOv5 } from './postprocess/yolov5_decoder';
export { decodeYOLOv8 } from './postprocess/yolov8_decoder';
export { restoreBoxes } from './postprocess/restore_boxes';
export type { LetterboxMeta } from './postprocess/restore_boxes';
export { calculateIoU } from './postprocess/iou';
export { nonMaxSuppression } from './postprocess/nms';
export type { NMSOptions } from './postprocess/nms';

// Utils
export { drawDetections } from './utils/canvas';
export { screenToCanvas, canvasToScreen, imageToCanvas, canvasToImage } from './utils/transform';
export { pointInBox, getBoxCenter, distanceToBox, findDetectionAtPoint } from './utils/geometry';

// Visualization
export type { DrawOptions, DrawStatistics } from './visualization/types';
export { getColorForClass, DEFAULT_CLASS_COLORS as CLASS_COLORS } from './visualization/colors';
export { drawBoundingBox, drawCenterPoint } from './visualization/draw_boxes';
export { drawBoundingBoxLabel } from './visualization/draw_labels';
export {
    exportCanvasToBlob,
    exportCanvasToPNG,
    exportCanvasToJPEG,
    exportCanvasToDataURL,
} from './visualization/export_canvas';

// Model Package (UAMP Specifications)
export { loadPackage } from './model-package/package_loader';
export type {
    SupportedTask,
    PackageMetadata,
    ParsedModelPackage,
    PackageValidationResult
} from './model-package/types';
