import type { InferencePlugin, Tensor, InferenceResult } from '@infera/core';
import type {
    ClassificationResult,
    ImageClassificationConfig,
} from './types';
import { DEFAULT_CONFIG } from './types';

export class ImageClassificationPlugin
    implements InferencePlugin<ClassificationResult> {
    readonly id = 'image-classification';
    readonly name = 'Image Classification';
    readonly version = '0.1.0';
    readonly supportedInputTypes = ['image'] as const;
    readonly supportedModelFormats = ['onnx'] as const;

    private config: ImageClassificationConfig;
    private labels: string[] = [];

    // Shape dibaca dari metadata model setelah loadModel(), bukan hardcode
    // Format: [N, C, H, W] → misal [1, 3, 224, 224]
    private inputShape: number[] = [1, 3, DEFAULT_CONFIG.inputHeight, DEFAULT_CONFIG.inputWidth];

    constructor(config: Partial<ImageClassificationConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    // ---------------------------------------------------------------------------
    // Lifecycle
    // ---------------------------------------------------------------------------

    async init(): Promise<void> {
        console.log(`[${this.id}] init — config:`, this.config);
    }

    async dispose(): Promise<void> {
        this.labels = [];
    }

    // ---------------------------------------------------------------------------
    // Label & shape management
    // ---------------------------------------------------------------------------

    /**
     * Load daftar label dari string mentah file .txt
     * (satu label per baris, seperti ImageNet labels)
     */
    loadLabels(rawText: string): void {
        this.labels = rawText
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean);
        console.log(`[${this.id}] Loaded ${this.labels.length} labels`);
    }

    /**
     * Dipanggil setelah OnnxRunner.loadModel() berhasil.
     * Menyimpan input shape asli dari model agar preprocess()
     * tidak hardcode ukuran resize.
     *
     * @param shape - Format NCHW: [1, 3, H, W]
     */
    setInputShape(shape: number[]): void {
        if (shape.length !== 4) {
            throw new Error(
                `Input shape tidak valid: ${JSON.stringify(shape)}. ` +
                `Harus berformat NCHW [N, C, H, W] dengan 4 dimensi.`
            );
        }
        this.inputShape = shape;
        console.log(`[${this.id}] Input shape diset ke: ${JSON.stringify(shape)}`);
    }

    // ---------------------------------------------------------------------------
    // Core pipeline
    // ---------------------------------------------------------------------------

    /**
     * Preprocess gambar menjadi tensor Float32 siap inferensi.
     *
     * Langkah:
     * 1. Terima HTMLImageElement atau ImageBitmap sebagai input
     * 2. Baca target H x W dari this.inputShape (bukan hardcode 224)
     * 3. Draw ke OffscreenCanvas ukuran H x W
     * 4. Ambil pixel data (RGBA, Uint8ClampedArray)
     * 5. Konversi RGBA → RGB, normalisasi ke 0.0–1.0
     * 6. Susun ke format NCHW: [1, C, H, W]
     * 7. Return sebagai Tensor
     */
    async preprocess(input: unknown): Promise<Tensor> {
        // --- 1. Validasi input ---
        const isValidInput =
            input instanceof HTMLImageElement ||
            input instanceof ImageBitmap;

        if (!isValidInput) {
            throw new Error(
                `[${this.id}] preprocess() menerima HTMLImageElement atau ImageBitmap. ` +
                `Diterima: ${typeof input}`
            );
        }

        const source = input as HTMLImageElement | ImageBitmap;

        // --- 2. Baca target size dari inputShape [N, C, H, W] ---
        const targetH = this.inputShape[2]!;
        const targetW = this.inputShape[3]!;

        // --- 3. Draw ke OffscreenCanvas ukuran target ---
        const canvas = new OffscreenCanvas(targetW, targetH);
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error(`[${this.id}] Gagal mendapatkan 2D context dari OffscreenCanvas.`);
        }

        ctx.drawImage(source, 0, 0, targetW, targetH);

        // --- 4. Ambil pixel data (RGBA flat array) ---
        const imageData = ctx.getImageData(0, 0, targetW, targetH);
        const rgba = imageData.data; // Uint8ClampedArray, panjang: H*W*4

        // --- 5. Konversi RGBA → RGB + normalisasi ---
        // Format output: NCHW → [1, 3, H, W]
        // Artinya: semua nilai R dulu, lalu semua G, lalu semua B
        const totalPixels = targetH * targetW;
        const floatData = new Float32Array(3 * totalPixels);

        for (let i = 0; i < totalPixels; i++) {
            const r = rgba[i * 4]!;
            const g = rgba[i * 4 + 1]!;
            const b = rgba[i * 4 + 2]!;
            // Alpha (rgba[i*4+3]) diabaikan

            if (this.config.normalize) {
                // Normalisasi ke rentang [0, 1]
                floatData[i] = r / 255.0; // channel R
                floatData[i + totalPixels] = g / 255.0; // channel G
                floatData[i + totalPixels * 2] = b / 255.0; // channel B
            } else {
                floatData[i] = r;
                floatData[i + totalPixels] = g;
                floatData[i + totalPixels * 2] = b;
            }
        }

        // --- 6. Return Tensor ---
        return {
            data: floatData,
            dims: [1, 3, targetH, targetW],
            type: 'float32',
        };
    }

    /**
     * Postprocess output tensor menjadi daftar label + confidence score.
     *
     * Langkah:
     * 1. Ambil raw scores dari output tensor (shape: [1, N_CLASSES])
     * 2. Terapkan softmax → ubah raw scores jadi probabilitas (jumlah = 1.0)
     * 3. Buat array index, sort descending berdasarkan confidence
     * 4. Ambil topK teratas
     * 5. Map index ke nama label dari this.labels
     * 6. Return InferenceResult<ClassificationResult>
     */
    async postprocess(
        output: Tensor
    ): Promise<InferenceResult<ClassificationResult>> {
        const startTime = performance.now();

        // --- 1. Ambil raw scores ---
        // Output ONNX klasifikasi biasanya shape [1, N_CLASSES]
        // data-nya adalah Float32Array flat
        if (!(output.data instanceof Float32Array)) {
            throw new Error(
                `[${this.id}] Output tensor harus bertipe Float32Array. ` +
                `Diterima: ${output.data.constructor.name}`
            );
        }

        const rawScores = output.data as Float32Array;
        const numClasses = rawScores.length;

        if (numClasses === 0) {
            throw new Error(`[${this.id}] Output tensor kosong.`);
        }

        // --- 2. Softmax ---
        // Mencegah overflow numerik dengan trik max-subtraction
        // sebelum exp(), hasil akhir tetap sama secara matematis
        const maxScore = Math.max(...rawScores);
        const exps = rawScores.map((s) => Math.exp(s - maxScore));
        const sumExps = exps.reduce((a, b) => a + b, 0);
        const probabilities = exps.map((e) => e / sumExps);

        // --- 3. Sort index descending berdasarkan confidence ---
        const sortedIndices = Array.from({ length: numClasses }, (_, i) => i)
            .sort((a, b) => probabilities[b]! - probabilities[a]!);

        // --- 4. Ambil topK ---
        const topK = Math.min(this.config.topK, numClasses);
        const topIndices = sortedIndices.slice(0, topK);

        // --- 5. Map ke label ---
        const hasLabels = this.labels.length > 0;

        const topKResults = topIndices.map((classIndex, rank) => ({
            label: hasLabels
                ? (this.labels[classIndex] ?? `Class ${classIndex}`)
                : `Class ${classIndex}`,
            confidence: probabilities[classIndex]!,
            rank: rank + 1, // rank 1 = prediksi terbaik
        }));

        // --- 6. Return ---
        const executionTimeMs = performance.now() - startTime;

        return {
            pluginId: this.id,
            modelId: '',   // diisi oleh caller (web-client) yang tahu modelId aktif
            executionTimeMs,
            data: {
                topK: topKResults,
            },
            rawOutputShape: output.dims,
        };
    }
}

export const imageClassificationPlugin = new ImageClassificationPlugin();