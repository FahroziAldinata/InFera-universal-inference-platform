import { describe, it, expect } from 'vitest';
import { zipSync } from 'fflate';
import { loadPackage } from '../package_loader';

describe('Universal Model Package Loader (Phase 6)', () => {
    // Helper to generate a valid zip file buffer
    function createMockZip(files: Record<string, string | Uint8Array>) {
        const zipSpec: Record<string, Uint8Array> = {};
        for (const name of Object.keys(files)) {
            const data = files[name]!;
            if (typeof data === 'string') {
                zipSpec[name] = new TextEncoder().encode(data);
            } else {
                zipSpec[name] = data;
            }
        }
        return zipSync(zipSpec);
    }

    it('should successfully load a valid UAMP package with labels.txt', async () => {
        const metadata = {
            task: 'object-detection',
            architecture: 'yolov8',
            framework: 'ultralytics',
            inputSize: 320,
            confidenceThreshold: 0.3,
            iouThreshold: 0.5
        };

        const zipBuffer = createMockZip({
            'model.onnx': new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
            'metadata.json': JSON.stringify(metadata),
            'labels.txt': 'person\ncar\ndog\n',
            'README.md': '# YOLOv8 Model\nDetailed docs.',
            'thumbnail.png': new Uint8Array([1, 2, 3, 4])
        });

        const pkg = await loadPackage(zipBuffer);

        expect(pkg.modelFile).toBeDefined();
        expect(pkg.modelFile.name).toBe('model.onnx');
        
        expect(pkg.metadata.task).toBe('object-detection');
        expect(pkg.metadata.architecture).toBe('yolov8');
        expect(pkg.metadata.inputSize).toBe(320);
        expect(pkg.metadata.confidenceThreshold).toBe(0.3);
        expect(pkg.metadata.iouThreshold).toBe(0.5);

        expect(pkg.labels).toEqual(['person', 'car', 'dog']);
        expect(pkg.readme).toBe('# YOLOv8 Model\nDetailed docs.');
        expect(pkg.thumbnail).toBeDefined();
        expect(pkg.thumbnail?.type).toBe('image/png');
    });

    it('should load successfully with labels.json array', async () => {
        const metadata = {
            task: 'object-detection',
            architecture: 'yolov5'
        };

        const zipBuffer = createMockZip({
            'model.onnx': new Uint8Array([0]),
            'metadata.json': JSON.stringify(metadata),
            'labels.json': JSON.stringify(['cat', 'mouse'])
        });

        const pkg = await loadPackage(zipBuffer);
        expect(pkg.labels).toEqual(['cat', 'mouse']);
        expect(pkg.metadata.architecture).toBe('yolov5');
    });

    it('should load successfully with labels.json numeric key map', async () => {
        const metadata = {
            task: 'object-detection',
            architecture: 'yolov8'
        };

        const zipBuffer = createMockZip({
            'model.onnx': new Uint8Array([0]),
            'metadata.json': JSON.stringify(metadata),
            'labels.json': JSON.stringify({
                '1': 'car',
                '0': 'person',
                '2': 'truck'
            })
        });

        const pkg = await loadPackage(zipBuffer);
        // Numeric indices sorted: 0 -> person, 1 -> car, 2 -> truck
        expect(pkg.labels).toEqual(['person', 'car', 'truck']);
    });

    it('should fallback to metadata.labels if labels.json and labels.txt are absent', async () => {
        const metadata = {
            task: 'object-detection',
            architecture: 'yolov8',
            labels: ['apple', 'banana']
        };

        const zipBuffer = createMockZip({
            'model.onnx': new Uint8Array([0]),
            'metadata.json': JSON.stringify(metadata)
        });

        const pkg = await loadPackage(zipBuffer);
        expect(pkg.labels).toEqual(['apple', 'banana']);
    });

    it('should return empty labels if no labels files or fallback are present', async () => {
        const metadata = {
            task: 'object-detection',
            architecture: 'yolov8'
        };

        const zipBuffer = createMockZip({
            'model.onnx': new Uint8Array([0]),
            'metadata.json': JSON.stringify(metadata)
        });

        const pkg = await loadPackage(zipBuffer);
        expect(pkg.labels).toEqual([]);
    });

    it('should throw an error if model.onnx is missing', async () => {
        const zipBuffer = createMockZip({
            'metadata.json': JSON.stringify({ task: 'object-detection' })
        });

        await expect(loadPackage(zipBuffer)).rejects.toThrow('File wajib "model.onnx" tidak ditemukan');
    });

    it('should throw an error if metadata.json is missing', async () => {
        const zipBuffer = createMockZip({
            'model.onnx': new Uint8Array([0])
        });

        await expect(loadPackage(zipBuffer)).rejects.toThrow('File wajib "metadata.json" tidak ditemukan');
    });

    it('should throw an error if multiple ONNX files are present', async () => {
        const zipBuffer = createMockZip({
            'model.onnx': new Uint8Array([0]),
            'another.onnx': new Uint8Array([0]),
            'metadata.json': JSON.stringify({ task: 'object-detection' })
        });

        await expect(loadPackage(zipBuffer)).rejects.toThrow('Package tidak boleh memiliki lebih dari satu file ONNX');
    });

    it('should throw an error if unsupported file extensions exist in package', async () => {
        const zipBuffer = createMockZip({
            'model.onnx': new Uint8Array([0]),
            'metadata.json': JSON.stringify({ task: 'object-detection' }),
            'script.exe': new Uint8Array([0]) // executable files blocked
        });

        await expect(loadPackage(zipBuffer)).rejects.toThrow('Format file "script.exe" tidak didukung');
    });

    it('should throw an error if task is invalid', async () => {
        const zipBuffer = createMockZip({
            'model.onnx': new Uint8Array([0]),
            'metadata.json': JSON.stringify({ task: 'invalid-task' })
        });

        await expect(loadPackage(zipBuffer)).rejects.toThrow('tidak didukung oleh spesifikasi UAMP');
    });

    it('should throw an error on zip slip path traversal vulnerability attempt', async () => {
        const zipBuffer = createMockZip({
            'model.onnx': new Uint8Array([0]),
            'metadata.json': JSON.stringify({ task: 'object-detection' }),
            '../../etc/passwd': 'malicious'
        });

        await expect(loadPackage(zipBuffer)).rejects.toThrow('Deteksi potensi kerentanan Zip Slip');
    });

    it('should throw an error if metadata.json is not valid UTF8', async () => {
        // Create an invalid UTF-8 byte array (0xff is invalid UTF-8 sequence)
        const invalidUtf8Bytes = new Uint8Array([0xff, 0xfe, 0xfd]);

        const zipBuffer = createMockZip({
            'model.onnx': new Uint8Array([0]),
            'metadata.json': invalidUtf8Bytes
        });

        await expect(loadPackage(zipBuffer)).rejects.toThrow('tidak menggunakan encoding UTF-8 yang valid');
    });

    it('should throw an error if zip archive is corrupted', async () => {
        const corruptedBytes = new Uint8Array([1, 2, 3, 4, 5]); // raw invalid zip bytes
        await expect(loadPackage(corruptedBytes)).rejects.toThrow('Gagal mendekompresi archive ZIP');
    });

    it('should enforce entries limit of 1000 files', async () => {
        // Create a record with 1001 files
        const files: Record<string, Uint8Array> = {
            'model.onnx': new Uint8Array([0]),
            'metadata.json': new TextEncoder().encode(JSON.stringify({ task: 'object-detection' }))
        };

        for (let i = 0; i < 1000; i++) {
            files[`file_${i}.txt`] = new Uint8Array([1]);
        }

        const hugeZipBuffer = zipSync(files);
        await expect(loadPackage(hugeZipBuffer)).rejects.toThrow('melebihi batas entri maksimum (1000 file)');
    });
});
