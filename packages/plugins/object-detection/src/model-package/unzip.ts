import { unzip } from 'fflate';

/**
 * Converts File, Blob, Uint8Array, or ArrayBuffer to a Uint8Array.
 */
async function toUint8Array(data: File | Blob | Uint8Array | ArrayBuffer): Promise<Uint8Array> {
    if (data instanceof Uint8Array) {
        return data;
    }
    if (data instanceof ArrayBuffer) {
        return new Uint8Array(data);
    }
    // File or Blob
    if (typeof data.arrayBuffer === 'function') {
        const buffer = await data.arrayBuffer();
        return new Uint8Array(buffer);
    }
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (reader.result instanceof ArrayBuffer) {
                resolve(new Uint8Array(reader.result));
            } else {
                reject(new Error('Gagal membaca data ke ArrayBuffer'));
            }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(data as Blob);
    });
}

/**
 * Decompresses a ZIP file archive into a file map of paths to Uint8Array contents.
 * Includes security checks for:
 * - Zip Slip path traversal
 * - Zip Bomb size protection (max 100 MB)
 * - Maximum file entry limit (max 1000 files)
 */
export function unzipArchive(
    data: File | Blob | Uint8Array | ArrayBuffer
): Promise<Record<string, Uint8Array>> {
    return new Promise(async (resolve, reject) => {
        try {
            const bytes = await toUint8Array(data);
            
            unzip(bytes, (err, unzipped) => {
                if (err) {
                    reject(new Error(`Gagal mendekompresi archive ZIP: ${err.message}`));
                    return;
                }

                const fileNames = Object.keys(unzipped);

                // 1. Max Entries check (Tahap 6.7 Security)
                if (fileNames.length > 1000) {
                    reject(new Error('Archive ZIP melebihi batas entri maksimum (1000 file)'));
                    return;
                }

                let totalExtractedSize = 0;

                for (const name of fileNames) {
                    // 2. Zip Slip check (Tahap 6.7 Security)
                    if (name.includes('..') || name.startsWith('/') || name.startsWith('\\')) {
                        reject(new Error(`Deteksi potensi kerentanan Zip Slip pada jalur file: ${name}`));
                        return;
                    }

                    const content = unzipped[name];
                    if (content) {
                        totalExtractedSize += content.length;
                    }
                }

                // 3. Zip Bomb check (Tahap 6.7 Security)
                if (totalExtractedSize > 100 * 1024 * 1024) { // 100 MB
                    reject(new Error('Batas ukuran dekompresi maksimum terlampaui (100 MB)'));
                    return;
                }

                resolve(unzipped);
            });
        } catch (err: any) {
            reject(new Error(`Gagal membaca archive: ${err.message}`));
        }
    });
}
