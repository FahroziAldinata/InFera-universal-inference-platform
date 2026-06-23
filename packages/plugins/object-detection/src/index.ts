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
export { calculateIoU } from './postprocess/iou';
export { nonMaxSuppression } from './postprocess/nms';
export { decodeOutput } from './postprocess/decoder';

// Utils
export { drawDetections } from './utils/canvas';
export { getColorForClass, CLASS_COLORS } from './utils/colors';
