export type SupportedTask =
    | 'image-classification'
    | 'object-detection'
    | 'ocr'
    | 'segmentation'
    | 'pose-estimation'
    | 'audio-classification'
    | 'tabular'
    | 'custom';

export interface PackageMetadata {
    formatVersion?: string;
    task: SupportedTask;
    architecture: string;
    framework?: string;
    inputSize?: number;
    normalize?: boolean;
    confidenceThreshold?: number;
    iouThreshold?: number;
    labels?: string[];
    author?: string;
    description?: string;
    license?: string;
    createdAt?: string;
    version?: string;
}

export interface ParsedModelPackage {
    modelFile: File;
    labels: string[];
    metadata: PackageMetadata;
    thumbnail?: Blob;
    readme?: string;
}

export interface PackageValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
