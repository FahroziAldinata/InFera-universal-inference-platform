import * as ort from 'onnxruntime-web';

export interface SessionInfo {
    inputNames: string[];
    outputNames: string[];
    executionProvider: string;
}

/**
 * Loads a File object and reads it into a Uint8Array
 */
export async function loadModel(modelFile: File): Promise<Uint8Array> {
    const arrayBuffer = await modelFile.arrayBuffer();
    return new Uint8Array(arrayBuffer);
}

/**
 * Creates an ONNX InferenceSession using the specified execution providers
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
 * Disposes an ONNX InferenceSession to release memory
 */
export async function disposeSession(session: ort.InferenceSession): Promise<void> {
    await session.release();
}

/**
 * Retrieves basic information about an active InferenceSession
 */
export function getSessionInfo(session: ort.InferenceSession): SessionInfo {
    return {
        inputNames: [...session.inputNames],
        outputNames: [...session.outputNames],
        executionProvider: 'wasm', // default execution provider, standard fallback
    };
}
