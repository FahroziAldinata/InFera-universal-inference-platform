import { describe, it, expect, vi } from 'vitest';
import {
    exportCanvasToBlob,
    exportCanvasToPNG,
    exportCanvasToJPEG,
    exportCanvasToDataURL
} from '../export_canvas';

describe('Export Helper (Tahap 5.7)', () => {
    it('should export to Blob via exportCanvasToBlob successfully', async () => {
        const mockBlob = new Blob(['dummy content'], { type: 'image/png' });
        const mockCanvas = {
            toBlob: vi.fn((callback) => callback(mockBlob))
        } as any;

        const result = await exportCanvasToBlob(mockCanvas, 'image/png');
        expect(mockCanvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png', undefined);
        expect(result).toBe(mockBlob);
    });

    it('should export to PNG Blob successfully', async () => {
        const mockBlob = new Blob(['png content'], { type: 'image/png' });
        const mockCanvas = {
            toBlob: vi.fn((callback) => callback(mockBlob))
        } as any;

        const result = await exportCanvasToPNG(mockCanvas);
        expect(mockCanvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png', undefined);
        expect(result).toBe(mockBlob);
    });

    it('should export to JPEG Blob successfully', async () => {
        const mockBlob = new Blob(['jpeg content'], { type: 'image/jpeg' });
        const mockCanvas = {
            toBlob: vi.fn((callback, type, q) => callback(mockBlob))
        } as any;

        const result = await exportCanvasToJPEG(mockCanvas, 0.85);
        expect(mockCanvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.85);
        expect(result).toBe(mockBlob);
    });

    it('should throw error when toBlob is not defined', async () => {
        const mockCanvas = {} as any; // no toBlob
        await expect(exportCanvasToBlob(mockCanvas)).rejects.toThrow('canvas.toBlob tidak didukung di lingkungan ini');
    });

    it('should reject if callback returns null/empty blob', async () => {
        const mockCanvas = {
            toBlob: vi.fn((callback) => callback(null))
        } as any;

        await expect(exportCanvasToBlob(mockCanvas)).rejects.toThrow('Gagal mengekspor canvas ke Blob');
    });

    it('should export to DataURL successfully', () => {
        const mockCanvas = {
            toDataURL: vi.fn().mockReturnValue('data:image/png;base64,1234')
        } as any;

        const result = exportCanvasToDataURL(mockCanvas, 'image/png');
        expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/png', undefined);
        expect(result).toBe('data:image/png;base64,1234');
    });

    it('should throw error when toDataURL is not defined', () => {
        const mockCanvas = {} as any;
        expect(() => exportCanvasToDataURL(mockCanvas)).toThrow('canvas.toDataURL tidak didukung di lingkungan ini');
    });
});
