export type RuntimeBackend = 'webgpu' | 'wasm';

/**
 * Detects the best available inference backend in the current runtime environment.
 * Automatically checks for WebGPU support and requests an adapter.
 * Falls back to WASM if WebGPU is unavailable or fails to retrieve a hardware adapter.
 */
export async function detectBestBackend(): Promise<RuntimeBackend> {
    if (typeof navigator !== 'undefined' && navigator.gpu) {
        try {
            const adapter = await navigator.gpu.requestAdapter();
            if (adapter) {
                return 'webgpu';
            }
        } catch (e) {
            // Graceful fallback to wasm on exceptions
        }
    }
    return 'wasm';
}
