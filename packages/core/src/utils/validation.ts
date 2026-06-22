import type { ModelFormat } from '../types/plugin';

const MAX_MODEL_SIZE_BYTES = 500 * 1024 * 1024;

const ALLOWED_MODEL_EXTENSIONS: Record<ModelFormat, string[]> = {
    onnx: ['.onnx'],
    tfjs: ['.json', '.bin'],
    tflite: ['.tflite'],
    savedmodel: ['.pb'],
};

export class ModelValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ModelValidationError';
    }
}

export function validateModelFile(file: File, format: ModelFormat): void {
    if (file.size === 0) {
        throw new ModelValidationError('File model kosong (0 byte).');
    }

    if (file.size > MAX_MODEL_SIZE_BYTES) {
        throw new ModelValidationError(
            `Ukuran model(${(file.size / 1024 / 1024).toFixed(1)} MB) melebihi batas maksimum 500 MB.`
        );
    }

    const allowedExtensions = ALLOWED_MODEL_EXTENSIONS[format];
    const hasValidExtension = allowedExtensions.some((ext) =>
        file.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExtension) {
        throw new ModelValidationError(
            `Ekstensi file "${file.name}" tidak sesuai dengan format "${format}".Ekstensi yang diharapkan: ${allowedExtensions.join(', ')}`
        );
    }
}

export function sanitizeOutputText(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
