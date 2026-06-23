import * as ort from 'onnxruntime-web';
import { detectBestBackend, type RuntimeBackend } from './capability';

export interface SessionInfo {
    inputNames: string[];
    outputNames: string[];
    executionProvider: string;
}

/**
 * Loads a File object and reads it into a Uint8Array.
 */
export async function loadModel(modelFile: File): Promise<Uint8Array> {
    const arrayBuffer = await modelFile.arrayBuffer();
    return new Uint8Array(arrayBuffer);
}

/**
 * Creates an ONNX InferenceSession using the specified execution providers.
 */
export async function createSession(
    modelData: Uint8Array,
    executionProviders: string[] = ['wasm']
): Promise<ort.InferenceSession> {
    const session = await ort.InferenceSession.create(modelData, {
        executionProviders,
    });
    return session;
}

/**
 * Creates an ONNX InferenceSession with automatic capability detection and graceful fallback.
 * 
 * Flow:
 * - If customProviders are specified, use them directly.
 * - If preferredBackend is 'auto', detectBestBackend() dictates the execution provider.
 * - If preferredBackend is 'webgpu', try creating a WebGPU session first.
 * - On any WebGPU initialization failure, gracefully fall back to WASM provider.
 */
export async function createSessionWithFallback(
    modelData: Uint8Array,
    preferredBackend: 'auto' | 'webgpu' | 'wasm' = 'auto',
    customProviders?: string[]
): Promise<{ session: ort.InferenceSession; backend: RuntimeBackend }> {
    // 1. Custom execution providers take priority
    if (customProviders && customProviders.length > 0) {
        const session = await createSession(modelData, customProviders);
        const backend = customProviders.includes('webgpu') ? 'webgpu' : 'wasm';
        return { session, backend };
    }

    // 2. Resolve preferred backend
    let targetBackend: RuntimeBackend = 'wasm';
    if (preferredBackend === 'webgpu') {
        targetBackend = 'webgpu';
    } else if (preferredBackend === 'auto') {
        targetBackend = await detectBestBackend();
    }

    // 3. Attempt WebGPU creation
    if (targetBackend === 'webgpu') {
        try {
            console.log('[object-detection] Inisialisasi session ONNX menggunakan WebGPU...');
            const session = await createSession(modelData, ['webgpu']);
            console.log('[object-detection] Session WebGPU sukses dibuat.');
            return { session, backend: 'webgpu' };
        } catch (err) {
            console.warn(
                '[object-detection] Gagal menginisialisasi WebGPU, fallback ke WASM:', 
                err
            );
        }
    }

    // 4. Default/Fallback path: WASM
    const session = await createSession(modelData, ['wasm']);
    return { session, backend: 'wasm' };
}

/**
 * Disposes an ONNX InferenceSession to release memory.
 */
export async function disposeSession(session: ort.InferenceSession): Promise<void> {
    await session.release();
}

/**
 * Retrieves basic information about an active InferenceSession.
 */
export function getSessionInfo(session: ort.InferenceSession, backend: string = 'wasm'): SessionInfo {
    return {
        inputNames: [...session.inputNames],
        outputNames: [...session.outputNames],
        executionProvider: backend,
    };
}
