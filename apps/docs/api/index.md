# API Reference

Dokumentasi API InFera dihasilkan secara otomatis dari TypeScript source code menggunakan TypeDoc.

## Paket-Paket

Pilih paket yang ingin Anda pelajari:

### [@infera/core](/api/core)

Paket pondasi yang berisi tipe dasar, validasi, dan plugin manager.

**Ekspor Utama:**
- `PluginManager` — Singleton registry plugin
- `InferenceResult<T>` — Tipe hasil inferensi generik
- `ModelMetadata` — Metadata model ONNX
- `Tensor` — Tipe representasi tensor
- `validateModelFile()` — Validasi file model
- `sanitizeOutputText()` — Sanitasi output teks

---

### [@infera/inference-engine](/api/inference-engine)

ONNX Runtime wrapper dengan deteksi kapabilitas dan pemilihan backend otomatis.

**Ekspor Utama:**
- `OnnxRunner` — Runner inferensi utama
- `detectCapabilities()` — Deteksi kapabilitas browser (WebGPU, WASM SIMD)
- `createSession()` — Buat sesi ONNX dengan backend optimal

---

### [@infera/plugin-object-detection](/api/plugin-object-detection)

Plugin deteksi objek berfitur lengkap dengan YOLOv5/v8, UAMP, dan canvas overlay.

**Ekspor Utama:**
- `ObjectDetectionPlugin` — Plugin utama
- `drawDetections()` — Render bounding box ke canvas
- `loadPackage()` — Load UAMP package dari file ZIP
- `DetectionResult` — Tipe hasil deteksi
- `BoundingBox` — Tipe bounding box
- `InferenceMetrics` — Tipe metrik benchmark

---

### [@infera/plugin-image-classification](/api/plugin-image-classification)

Plugin klasifikasi gambar dengan Top-K sorting.

**Ekspor Utama:**
- `ImageClassificationPlugin` — Plugin utama
- `ClassificationResult` — Tipe hasil klasifikasi

---

## Menghasilkan API Docs

API reference dihasilkan dari kode sumber menggunakan TypeDoc:

```bash
# Generate API docs
pnpm docs:api

# Build docs lengkap termasuk API
pnpm docs:build
```

Output tersimpan di `apps/docs/api/generated/`.

> [!NOTE]
> Halaman API reference individual di bawah ini merupakan ringkasan manual. Untuk dokumentasi lengkap dengan semua tipe, parameter, dan contoh, jalankan `pnpm docs:api` untuk menghasilkan dokumentasi TypeDoc.
