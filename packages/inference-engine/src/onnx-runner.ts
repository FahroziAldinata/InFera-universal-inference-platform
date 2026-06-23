import * as ort from 'onnxruntime-web';
import type { Tensor } from '@infera/core';

/**
 * Merepresentasikan satu sesi model ONNX yang sedang aktif di memori.
 */
interface OnnxSession {
    id: string;
    session: ort.InferenceSession;
    inputName: string;
    outputName: string;
}

/**
 * Wrapper di sekitar onnxruntime-web, sesuai dengan kontrak
 * Engine API pada TDD bagian 11.
 *
 * Bertanggung jawab untuk:
 * - Memuat file model .onnx menjadi sebuah inference session
 * - Menjalankan dummy inference (warmup) untuk mencegah lag awal
 * - Menjalankan inferensi sesungguhnya
 * - Membersihkan sesi dari memori (mencegah memory leak WASM/WebGL)
 */
export class OnnxRunner {
    private sessions = new Map<string, OnnxSession>();

    /**
     * Memuat file model .onnx dan mengembalikan ID sesi unik
     * yang akan dipakai untuk operasi run/warmup/dispose selanjutnya.
     */
    async loadModel(modelFile: File): Promise<string> {
        const arrayBuffer = await modelFile.arrayBuffer();

        const session = await ort.InferenceSession.create(
            new Uint8Array(arrayBuffer),
            {
                executionProviders: ['wasm'], // default aman, bisa ditambah 'webgl' nanti
            }
        );

        const sessionId = crypto.randomUUID();

        const inputName = session.inputNames[0];
        const outputName = session.outputNames[0];

        if (!inputName || !outputName) {
            throw new Error(
                'Model ONNX tidak memiliki input atau output yang valid.'
            );
        }

        this.sessions.set(sessionId, {
            id: sessionId,
            session,
            inputName,
            outputName,
        });

        return sessionId;
    }

    /**
     * Menjalankan dummy inference dengan tensor nol, untuk memicu
     * kompilasi shader/WASM lebih awal sehingga inferensi pertama
     * yang sesungguhnya tidak terasa lag oleh pengguna.
     */
    async warmup(modelId: string, inputShape: number[]): Promise<void> {
        const dummySize = inputShape.reduce((a, b) => a * b, 1);
        const dummyData = new Float32Array(dummySize).fill(0);

        const dummyTensor: Tensor = {
            data: dummyData,
            dims: inputShape,
            type: 'float32',
        };

        await this.run(modelId, dummyTensor);
    }

    /**
     * Menjalankan inferensi sesungguhnya pada model yang sudah di-load.
     */
    async run(modelId: string, inputTensor: Tensor): Promise<Tensor> {
        const sessionEntry = this.sessions.get(modelId);

        if (!sessionEntry) {
            throw new Error(`Model dengan id "${modelId}" tidak ditemukan. Pastikan loadModel() sudah dipanggil.`);
        }

        const ortTensor = new ort.Tensor(
            this.mapTensorType(inputTensor.type),
            inputTensor.data,
            inputTensor.dims
        );

        const feeds = { [sessionEntry.inputName]: ortTensor };
        const results = await sessionEntry.session.run(feeds);
        const outputTensor = results[sessionEntry.outputName];

        if (!outputTensor) {
            throw new Error('Output dari model tidak ditemukan setelah inferensi.');
        }

        return {
            data: outputTensor.data as Float32Array | Uint8Array | Int32Array,
            dims: [...outputTensor.dims],
            type: this.mapOrtTypeToTensorType(outputTensor.type),
        };
    }

    /**
     * Membersihkan sesi model dari memori (WASM/WebGL),
     * untuk mencegah memory leak (lihat TDD bagian 16.1 - Senior Engineer notes).
     */
    async dispose(modelId: string): Promise<void> {
        const sessionEntry = this.sessions.get(modelId);
        if (!sessionEntry) return;

        await sessionEntry.session.release();
        this.sessions.delete(modelId);
    }

    /**
     * Helper: konversi tipe Tensor internal ke tipe yang dikenali onnxruntime-web.
     */
    private mapTensorType(type: Tensor['type']): ort.Tensor.Type {
        switch (type) {
            case 'float32':
                return 'float32';
            case 'uint8':
                return 'uint8';
            case 'int32':
                return 'int32';
            case 'int64':
                return 'int64';
            case 'string':
                return 'string';
            default:
                throw new Error(`Tipe tensor "${type}" tidak didukung.`);
        }
    }

    /**
     * Helper: konversi tipe output onnxruntime-web kembali ke tipe Tensor internal.
     */
    private mapOrtTypeToTensorType(ortType: string): Tensor['type'] {
        if (ortType === 'float32') return 'float32';
        if (ortType === 'uint8') return 'uint8';
        if (ortType === 'int32') return 'int32';
        if (ortType === 'int64') return 'int64';
        if (ortType === 'string') return 'string';
        return 'float32'; // fallback aman
    }
}

/**
 * Singleton instance, dipakai bersama di seluruh aplikasi.
 */
export const onnxRunner = new OnnxRunner();