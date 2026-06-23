import type { PackageMetadata, SupportedTask } from './types';

const SUPPORTED_TASKS: SupportedTask[] = [
    'image-classification',
    'object-detection',
    'ocr',
    'segmentation',
    'pose-estimation',
    'audio-classification',
    'tabular',
    'custom'
];

/**
 * Parses and strictly validates metadata.json bytes.
 * Provides default values for optional configurations and throws descriptive errors
 * if format rules are violated.
 */
export function parseMetadata(jsonBytes: Uint8Array): PackageMetadata {
    // 1. Decode UTF-8 bytes to string
    let jsonString: string;
    try {
        jsonString = new TextDecoder('utf-8', { fatal: true }).decode(jsonBytes);
    } catch (err) {
        throw new Error('File metadata.json tidak menggunakan encoding UTF-8 yang valid.');
    }

    // 2. Parse JSON string
    let parsed: any;
    try {
        parsed = JSON.parse(jsonString);
    } catch (err: any) {
        throw new Error(`JSON metadata.json tidak valid: ${err.message}`);
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Isi metadata.json harus berupa objek JSON.');
    }

    // 3. Validate task field
    if (!parsed.task) {
        throw new Error('Properti "task" wajib diisi di metadata.json.');
    }
    if (!SUPPORTED_TASKS.includes(parsed.task)) {
        throw new Error(`Task "${parsed.task}" tidak didukung oleh spesifikasi UAMP.`);
    }

    // 4. Default fallbacks (backward compatibility)
    const confidenceThreshold = typeof parsed.confidenceThreshold === 'number'
        ? parsed.confidenceThreshold
        : 0.25;

    const iouThreshold = typeof parsed.iouThreshold === 'number'
        ? parsed.iouThreshold
        : 0.45;

    const inputSize = typeof parsed.inputSize === 'number'
        ? parsed.inputSize
        : 640;

    const normalize = typeof parsed.normalize === 'boolean'
        ? parsed.normalize
        : true;

    const architecture = typeof parsed.architecture === 'string'
        ? parsed.architecture
        : 'yolov8';

    const labels = Array.isArray(parsed.labels)
        ? parsed.labels.map((l: any) => String(l).trim())
        : undefined;

    return {
        formatVersion: typeof parsed.formatVersion === 'string' ? parsed.formatVersion : '1.0',
        task: parsed.task as SupportedTask,
        architecture,
        framework: typeof parsed.framework === 'string' ? parsed.framework : undefined,
        inputSize,
        normalize,
        confidenceThreshold,
        iouThreshold,
        labels,
        author: typeof parsed.author === 'string' ? parsed.author : '',
        description: typeof parsed.description === 'string' ? parsed.description : '',
        license: typeof parsed.license === 'string' ? parsed.license : '',
        createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : '',
        version: typeof parsed.version === 'string' ? parsed.version : '1.0.0'
    };
}
