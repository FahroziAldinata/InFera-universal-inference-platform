# Benchmark Performa

Halaman ini mendokumentasikan hasil pengujian performa InFera pada berbagai backend dan konfigurasi hardware.

## Metodologi

Pengujian dilakukan dengan:
- **Input**: Gambar 640×640 piksel
- **Model**: YOLOv8n (nano) — 80 kelas COCO
- **Hardware**: Intel Core i7 (12th Gen) + RTX 3060 Laptop GPU
- **Pengukuran**: Rata-rata dari 100 iterasi setelah warm-up

## Tabel Latensi

| Backend | Latensi Preprocess | Latensi Inference | Latensi Postprocess | Total | FPS |
|---|:---:|:---:|:---:|:---:|:---:|
| **WebAssembly (WASM)** | ~8 ms | ~120 ms | ~4 ms | ~132 ms | ~7.5 FPS |
| **WebAssembly SIMD** | ~8 ms | ~45 ms | ~4 ms | ~57 ms | ~17.5 FPS |
| **WebGPU (RTX 3060)** | ~8 ms | ~12 ms | ~4 ms | **~24 ms** | **~41.6 FPS** |

## Perbandingan Backend

```
Backend       FPS      Speedup
──────────────────────────────
WASM          7.5 fps   1.0x (baseline)
WASM SIMD    17.5 fps   2.3x
WebGPU       41.6 fps   5.5x
```

## Jejak Memori Heap

| Backend | Memori Heap (MB) |
|---|:---:|
| WASM | ~35 MB |
| WASM SIMD | ~35 MB |
| WebGPU | ~48 MB |

> WebGPU mengonsumsi lebih banyak memori karena alokasi buffer GPU tambahan.

## Benchmark per Tahap

### Preprocessing

Preprocessing mencakup:
- Resize gambar ke ukuran input model
- Scaled letterboxing (mempertahankan aspect ratio)
- Konversi HWC → CHW
- Normalisasi piksel ke `[0, 1]`

Latensi preprocessing relatif konstan (~8ms) karena menggunakan Canvas 2D API terlepas dari backend.

### Inference

Inference adalah tahap paling menentukan performa:
- **WASM**: Berjalan di CPU, single-threaded, dibatasi oleh bandwidth memori
- **WASM SIMD**: SIMD instructions meningkatkan paralelisme ~2.3x
- **WebGPU**: Berjalan di GPU dengan ribuan core paralel, ~5.5x lebih cepat dari WASM

### Postprocessing

Postprocessing mencakup:
- Decode anchor box (YOLOv5/v8)
- Restore koordinat dari letterbox space ke image space
- IoU computation
- Non-Maximum Suppression (NMS)

Dilakukan di Web Worker terpisah untuk tidak memblokir UI thread.

## Mengaktifkan Benchmark

```typescript
const plugin = new ObjectDetectionPlugin({
  enableMetrics: true,  // Aktifkan tracking benchmark
});

const result = await plugin.predict(image);

// Akses metrics
const {
  preprocessTimeMs,
  inferenceTimeMs,
  postprocessTimeMs,
  totalTimeMs,
  fps,
  backend,
  memoryUsageMB,
} = result.metrics;
```

## Menjalankan Benchmark Sendiri

Untuk menjalankan benchmark di hardware Anda:

1. Clone repository
2. Jalankan web client: `pnpm dev`
3. Buka `http://localhost:5173`
4. Muat model YOLOv8n ONNX
5. Jalankan inferensi dan periksa panel Benchmark di toolbar

## Catatan Performa

> [!TIP]
> Gunakan `preferredBackend: 'auto'` agar InFera otomatis memilih backend tercepat yang tersedia di perangkat pengguna.

> [!NOTE]
> Latensi pertama (cold start) lebih tinggi karena ONNX Runtime perlu mengompilasi shader WebGPU. Latensi stabil setelah iterasi pertama.

> [!WARNING]
> Performa WebGPU sangat bergantung pada GPU pengguna. Pada GPU integrated (Intel/AMD), performa mungkin setara atau lebih rendah dari WASM SIMD.
