import type { ParsedModelPackage } from './types';
import { unzipArchive } from './unzip';
import { validatePackage } from './validate_package';
import { parseMetadata } from './metadata_parser';
import { parseLabelsText, parseLabelsJson } from './labels_parser';

/**
 * Orchestrates the loading and parsing of a UAMP model package (.zip).
 * 
 * Flow:
 * 1. Unzip the package bytes.
 * 2. Validate structural constraints (required files, files count, extensions, paths).
 * 3. Parse and validate metadata.json.
 * 4. Parse class labels (labels.json priority, then labels.txt, then metadata labels).
 * 5. Extract optional readme and thumbnail.
 * 
 * @param zipFile File, Blob, or bytes containing the .zip archive.
 * @returns Parsed package details including model, metadata, and labels.
 */
export async function loadPackage(
    zipFile: File | Blob | Uint8Array | ArrayBuffer
): Promise<ParsedModelPackage> {
    // 1. Unzip
    const unzipped = await unzipArchive(zipFile);

    // 2. Validate package structure
    const validation = validatePackage(unzipped);
    if (!validation.isValid) {
        throw new Error(`Package tidak valid:\n${validation.errors.join('\n')}`);
    }

    // 3. Parse Metadata
    const metadata = parseMetadata(unzipped['metadata.json']!);

    // 4. Parse Labels (json -> txt -> metadata -> empty array)
    let labels: string[] = [];
    if (unzipped['labels.json']) {
        labels = parseLabelsJson(unzipped['labels.json']);
    } else if (unzipped['labels.txt']) {
        labels = parseLabelsText(unzipped['labels.txt']);
    } else if (metadata.labels && metadata.labels.length > 0) {
        labels = metadata.labels;
    }

    // 5. Extract Model File as a File object (fallback to Blob wrapper for compatibility)
    const modelData = unzipped['model.onnx']!;
    let modelFile: File;
    if (typeof File === 'function') {
        try {
            modelFile = new File([modelData as any], 'model.onnx', { type: 'application/octet-stream' });
        } catch (e) {
            // Some environments have File but don't support constructor
            modelFile = new Blob([modelData as any], { type: 'application/octet-stream' }) as any;
            Object.defineProperty(modelFile, 'name', { value: 'model.onnx', configurable: true });
        }
    } else {
        modelFile = new Blob([modelData as any], { type: 'application/octet-stream' }) as any;
        Object.defineProperty(modelFile, 'name', { value: 'model.onnx', configurable: true });
    }

    // 6. Extract optional thumbnail
    let thumbnail: Blob | undefined;
    if (unzipped['thumbnail.png']) {
        thumbnail = new Blob([unzipped['thumbnail.png'] as any], { type: 'image/png' });
    }

    // 7. Extract optional readme
    let readme: string | undefined;
    if (unzipped['README.md']) {
        readme = new TextDecoder('utf-8').decode(unzipped['README.md']);
    }

    return {
        modelFile,
        labels,
        metadata,
        thumbnail,
        readme
    };
}
