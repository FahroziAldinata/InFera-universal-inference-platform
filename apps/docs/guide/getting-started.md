# Memulai dengan InFera

InFera adalah platform inferensi machine learning yang berjalan sepenuhnya di browser menggunakan model ONNX, dipercepat oleh WebGPU dengan fallback otomatis ke WebAssembly.

## Prasyarat

Sebelum memulai, pastikan lingkungan pengembangan Anda memenuhi persyaratan berikut:

| Prasyarat | Versi Minimum |
|---|---|
| Node.js | v20.0.0+ |
| pnpm | v8.0.0+ |
| Browser | Chrome 113+ / Edge 113+ |

## Instalasi

Clone repository dan instal dependensi:

```bash
# Clone repository
git clone https://github.com/FahroziAldinata/InFera-universal-inference-platform.git
cd InFera-universal-inference-platform

# Instal semua dependensi workspace
pnpm install
```

## Struktur Monorepo

```
InFera/
├── apps/
│   ├── web-client/          # Aplikasi web React + Vite + TypeScript
│   └── docs/                # Website dokumentasi VitePress ini
├── packages/
│   ├── core/                # Tipe dasar, validasi, plugin manager
│   ├── inference-engine/    # ONNX Runtime wrapper level rendah
│   └── plugins/
│       ├── object-detection/       # Plugin object detection (YOLOv5/v8)
│       └── image-classification/   # Plugin klasifikasi gambar
├── package.json             # Root workspace (pnpm + Turborepo)
├── turbo.json               # Konfigurasi build pipeline Turborepo
└── pnpm-workspace.yaml      # Definisi workspace pnpm
```

## Perintah Pengembangan

### Menjalankan Seluruh Workspace

```bash
# Build semua package sekaligus
pnpm build

# Type check semua package
pnpm typecheck

# Jalankan semua test suite
pnpm test

# Jalankan linter
pnpm lint
```

### Menjalankan Web Client (Mode Development)

```bash
# Jalankan dev server web client
pnpm --filter web-client dev
# atau
pnpm dev
```

Web client akan berjalan di `http://localhost:5173`.

### Menjalankan Dokumentasi (Lokal)

```bash
# Jalankan docs dev server
pnpm --filter @infera/docs dev

# Build docs untuk produksi
pnpm docs:build

# Preview build produksi
pnpm docs:preview
```

Dokumentasi akan berjalan di `http://localhost:5173`.

## Quick Start — Object Detection

Berikut contoh penggunaan cepat plugin object detection:

```typescript
import { ObjectDetectionPlugin } from '@infera/plugin-object-detection';

// 1. Inisialisasi plugin
const plugin = new ObjectDetectionPlugin({
  inputWidth: 640,
  inputHeight: 640,
  confidenceThreshold: 0.25,
  iouThreshold: 0.45,
  preferredBackend: 'auto',  // WebGPU jika tersedia, WASM sebagai fallback
  enableMetrics: true,
});

await plugin.init();

// 2. Load model ONNX atau UAMP package
const modelFile = document.getElementById('model-input').files[0];
await plugin.loadModel(modelFile);

// 3. Lakukan prediksi
const imgElement = document.getElementById('my-image');
const result = await plugin.predict(imgElement);

console.log(result.detections);
// [{ classId: 0, label: 'person', confidence: 0.89, x: 10, y: 20, width: 100, height: 200 }]

console.log(result.metrics);
// { inferenceTimeMs: 14.5, fps: 68.9, backend: 'webgpu', ... }

// 4. Visualisasi di canvas
import { drawDetections } from '@infera/plugin-object-detection';

const canvas = document.getElementById('canvas');
drawDetections(canvas, result.detections, {
  drawCenterPoint: true,
  cornerRadius: 8,
  fillOpacity: 0.15,
});
```

## Quick Start — Image Classification

```typescript
import { ImageClassificationPlugin } from '@infera/plugin-image-classification';

const plugin = new ImageClassificationPlugin({
  topK: 5,
  normalize: true,
});

await plugin.init();
await plugin.loadModel(modelFile);

const result = await plugin.predict(imageElement);
console.log(result.classifications);
// [{ classId: 281, label: 'tabby cat', confidence: 0.95 }]
```

## Langkah Selanjutnya

- 📖 [Arsitektur Platform](/guide/architecture) — Pahami desain sistem InFera
- 🎯 [Plugin Object Detection](/plugins/object-detection) — Panduan lengkap plugin deteksi objek
- 🖼️ [Plugin Image Classification](/plugins/image-classification) — Panduan plugin klasifikasi gambar
- 📦 [Spesifikasi UAMP](/uamp/) — Format paket model universal
- 📊 [Benchmark](/benchmark/) — Hasil pengujian performa
