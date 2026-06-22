// Tipe hasil spesifik untuk plugin image classification

export interface ClassificationLabel {
    label: string;
    confidence: number; // 0.0 - 1.0
    rank: number;       // 1 = top prediction
}

export interface ClassificationResult {
    topK: ClassificationLabel[];
}

// Config preprocessing yang bisa dikustomisasi user
export interface ImageClassificationConfig {
    inputWidth: number;   // default: 224
    inputHeight: number;  // default: 224
    topK: number;         // default: 5, berapa label teratas yang ditampilkan
    normalize: boolean;   // default: true, apakah normalisasi 0-1
}

export const DEFAULT_CONFIG: ImageClassificationConfig = {
    inputWidth: 224,
    inputHeight: 224,
    topK: 5,
    normalize: true,
};