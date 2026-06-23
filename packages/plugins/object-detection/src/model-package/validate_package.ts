import type { PackageValidationResult } from './types';

/**
 * Validates the unzipped package file structure and checks for errors or warnings.
 * - Ensures required files (model.onnx, metadata.json) are present.
 * - Restricts package to exactly one .onnx file.
 * - Validates file extensions to prevent unsupported files.
 * - Logs warning if both labels.txt and labels.json are present.
 */
export function validatePackage(unzipped: Record<string, Uint8Array>): PackageValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const fileNames = Object.keys(unzipped);

    // 1. Required files check
    if (!unzipped['model.onnx']) {
        errors.push('File wajib "model.onnx" tidak ditemukan di dalam package.');
    }
    if (!unzipped['metadata.json']) {
        errors.push('File wajib "metadata.json" tidak ditemukan di dalam package.');
    }

    // 2. Count `.onnx` files to enforce a single model file requirement
    const onnxFiles = fileNames.filter(name => name.toLowerCase().endsWith('.onnx'));
    if (onnxFiles.length > 1) {
        errors.push(`Package tidak boleh memiliki lebih dari satu file ONNX. Ditemukan: ${onnxFiles.join(', ')}`);
    }

    // 3. Supported extension checks
    const allowedExtensions = ['.onnx', '.json', '.txt', '.png', '.md'];
    for (const name of fileNames) {
        // Skip directory placeholder entries
        if (name.endsWith('/')) {
            continue;
        }

        const dotIdx = name.lastIndexOf('.');
        if (dotIdx === -1) {
            errors.push(`File "${name}" tidak memiliki ekstensi file.`);
            continue;
        }

        const ext = name.substring(dotIdx).toLowerCase();
        if (!allowedExtensions.includes(ext)) {
            errors.push(`Format file "${name}" tidak didukung. Ekstensi harus salah satu dari: ${allowedExtensions.join(', ')}`);
        }
    }

    // 4. File priority warning
    if (unzipped['labels.txt'] && unzipped['labels.json']) {
        warnings.push('Kedua file "labels.txt" dan "labels.json" ditemukan. Sistem akan memprioritaskan "labels.json".');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}
