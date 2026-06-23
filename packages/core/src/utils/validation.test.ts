import { describe, it, expect } from 'vitest';
import { validateModelFile, sanitizeOutputText, ModelValidationError } from './validation';

describe('validateModelFile', () => {
    it('melempar error jika file kosong (0 byte)', () => {
        const file = new File([], 'model.onnx');
        expect(() => validateModelFile(file, 'onnx')).toThrow(ModelValidationError);
        expect(() => validateModelFile(file, 'onnx')).toThrow('File model kosong (0 byte).');
    });

    it('melempar error jika ukuran file melebihi 500 MB', () => {
        // Buat file dengan size yang di-override karena kita tidak bisa alokasi 500MB nyata
        const file = new File(['a'], 'large.onnx');
        Object.defineProperty(file, 'size', {
            value: 500 * 1024 * 1024 + 1,
            writable: false,
        });
        expect(() => validateModelFile(file, 'onnx')).toThrow(ModelValidationError);
        expect(() => validateModelFile(file, 'onnx')).toThrow(/melebihi batas maksimum 500 MB/);
    });

    it('melempar error jika ekstensi tidak sesuai format', () => {
        const file = new File(['data'], 'model.txt');
        expect(() => validateModelFile(file, 'onnx')).toThrow(ModelValidationError);
        expect(() => validateModelFile(file, 'onnx')).toThrow(/tidak sesuai dengan format "onnx"/);
    });

    it('lolos validasi untuk file .onnx yang valid', () => {
        const file = new File(['data'], 'mobilenet.onnx');
        expect(() => validateModelFile(file, 'onnx')).not.toThrow();
    });

    it('lolos validasi untuk file .tflite yang valid', () => {
        const file = new File(['data'], 'model.tflite');
        expect(() => validateModelFile(file, 'tflite')).not.toThrow();
    });

    it('lolos validasi untuk file .json (tfjs) yang valid', () => {
        const file = new File(['data'], 'model.json');
        expect(() => validateModelFile(file, 'tfjs')).not.toThrow();
    });
});

describe('sanitizeOutputText', () => {
    it('meng-escape seluruh karakter HTML berbahaya', () => {
        const input = '<script>alert("XSS & test\'s")</script>';
        const expected = '&lt;script&gt;alert(&quot;XSS &amp; test&#039;s&quot;)&lt;/script&gt;';
        expect(sanitizeOutputText(input)).toBe(expected);
    });

    it('mengembalikan string kosong tanpa error', () => {
        expect(sanitizeOutputText('')).toBe('');
    });

    it('tidak mengubah teks yang sudah bersih', () => {
        expect(sanitizeOutputText('Hello World')).toBe('Hello World');
    });
});
