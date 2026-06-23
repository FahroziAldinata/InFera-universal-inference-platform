# Plugin Object Detection

`@infera/plugin-object-detection` adalah plugin deteksi objek berperforma tinggi untuk platform InFera. Mendukung model YOLOv5 dan YOLOv8 yang berjalan langsung di browser dengan akselerasi WebGPU dan fallback WASM otomatis.

## Fitur Utama

| Fitur | Deskripsi |
|---|---|
| **Multi-Arsitektur YOLO** | Auto-deteksi YOLOv5 (`[1, N, 5+C]`) dan YOLOv8 (`[1, 4+C, N]`) |
| **WebGPU + WASM** | Akselerasi GPU native, fallback WASM otomatis |
| **UAMP Package Loader** | Load model dari `.zip` mandiri |
| **Canvas Overlay** | Bounding box Retina-ready, label, pusat |
| **Benchmark Real-time** | Latensi preprocess/inference/postprocess, FPS, memori |
| **Interactive UI** | Hit-testing, zoom/pan, selection animasi rAF |
| **Export Results** | JSON, CSV, COCO, YOLO, VOC, Label Studio |

## Instalasi

```bash
pnpm add @infera/plugin-object-detection
```

Atau dalam monorepo InFera:
```bash
pnpm install
```

## Konfigurasi

### Antarmuka `ObjectDetectionConfig`

```typescript
interface ObjectDetectionConfig {
  inputWidth: number;           // Lebar input model (default: 640)
  inputHeight: number;          // Tinggi input model (default: 640)
  confidenceThreshold: number;  // Threshold confidence (default: 0.25)
  iouThreshold: number;         // Threshold IoU untuk NMS (default: 0.45)
  normalize: boolean;           // Normalisasi piksel ke [0,1] (default: true)
  preferredBackend: 'auto' | 'webgpu' | 'wasm'; // Backend inferensi
  enableMetrics: boolean;       // Aktifkan tracking benchmark (default: true)
}
```

### Contoh Inisialisasi

```typescript
import { ObjectDetectionPlugin } from '@infera/plugin-object-detection';

const plugin = new ObjectDetectionPlugin({
  inputWidth: 640,
  inputHeight: 640,
  confidenceThreshold: 0.25,
  iouThreshold: 0.45,
  normalize: true,
  preferredBackend: 'auto',
  enableMetrics: true,
});

await plugin.init();
```

## Memuat Model

### Metode 1: ONNX Langsung

```typescript
// Dari file input HTML
const fileInput = document.getElementById('model') as HTMLInputElement;
const modelFile = fileInput.files![0];
await plugin.loadModel(modelFile);

// Dari URL (fetch terlebih dahulu)
const response = await fetch('/models/yolov8n.onnx');
const buffer = await response.arrayBuffer();
const modelFile = new File([buffer], 'yolov8n.onnx');
await plugin.loadModel(modelFile);
```

### Metode 2: UAMP Package (`.zip`)

```typescript
import { loadPackage } from '@infera/plugin-object-detection';

const zipFile = document.getElementById('package').files![0];
const pkg = await loadPackage(zipFile);

// Muat model, label, dan konfigurasi sekaligus
await plugin.loadModel(pkg.modelFile);
plugin.loadLabels(pkg.labels.join('\n'));
plugin.setInputShape(pkg.metadata.inputShape);
```

## Melakukan Prediksi

```typescript
// Input yang didukung
const imgElement = document.getElementById('image') as HTMLImageElement;
const result = await plugin.predict(imgElement);

console.log(result.detections);
/*
[
  {
    id: 'det_abc123',
    classId: 0,
    label: 'person',
    confidence: 0.894,
    x: 125,
    y: 48,
    width: 210,
    height: 380
  },
  ...
]
*/
```

### Input yang Didukung

| Tipe Input | Contoh |
|---|---|
| `HTMLImageElement` | `document.getElementById('img')` |
| `HTMLCanvasElement` | `canvas` |
| `File` | `fileInput.files[0]` |
| `Blob` | `new Blob([buffer])` |
| `ImageBitmap` | `await createImageBitmap(img)` |
| `ImageData` | `ctx.getImageData(...)` |

## Metrik Benchmark

```typescript
console.log(result.metrics);
/*
{
  preprocessTimeMs: 1.2,
  inferenceTimeMs: 14.5,
  postprocessTimeMs: 0.8,
  totalTimeMs: 16.5,
  fps: 60.6,
  backend: 'webgpu',
  memoryUsageMB: 48.2
}
*/
```

## Visualisasi Canvas

### `drawDetections()`

```typescript
import { drawDetections } from '@infera/plugin-object-detection';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;

const stats = drawDetections(canvas, result.detections, {
  // Tampilan bounding box
  lineWidth: 2,
  cornerRadius: 8,
  fillOpacity: 0.15,
  lineDash: [],            // [] = solid, [4,4] = dashed

  // Tampilan label
  labelPosition: 'top',   // 'top' | 'bottom'
  fontSize: 14,
  fontFamily: 'Inter, sans-serif',

  // Elemen tambahan
  drawCenterPoint: true,
});

console.log(`Render selesai dalam ${stats.renderTimeMs}ms`);
```

## Load Labels

```typescript
// Format: teks plain satu label per baris
const labelsText = `person
bicycle
car
motorcycle
airplane`;

plugin.loadLabels(labelsText);

// Atau dari file labels.txt
const file = new File([labelsText], 'labels.txt');
plugin.loadLabelsFromFile(file);
```

## Deteksi Interaktif (React)

Saat menggunakan InFera di aplikasi React, komponen `DetectionCanvas` tersedia di `apps/web-client`:

```typescript
// Fitur yang tersedia di web-client:
// - Hit-testing bounding box dengan overlap resolution
// - Zoom/pan (0.1x hingga 20x) dengan pinch gesture
// - Animasi seleksi rAF 60fps
// - Tooltip DOM tanpa re-render React
// - Keyboard navigation (Tab, Enter, Escape, Arrow)
// - Double-click focus & center
```

## Keamanan UAMP

Package UAMP memiliki proteksi built-in:

| Proteksi | Detail |
|---|---|
| **Zip Slip** | Menolak path `../` dan traversal absolut |
| **Zip Bomb** | Batas dekompresi 100MB per entri |
| **Entry Limit** | Maksimal 1.000 entri per archive |

## Kompatibilitas Browser

| Browser | WASM | WebGPU | Versi Minimum |
|---|:---:|:---:|---|
| Chrome | ✅ | ✅ | Chrome 113+ |
| Edge | ✅ | ✅ | Edge 113+ |
| Opera | ✅ | ✅ | Opera 99+ |
| Firefox | ✅ | ⚠️ Flag | Firefox 115+ |
| Safari | ✅ | ⚠️ Eksperimental | Safari 17+ |

## Menjalankan Tests

```bash
# Di root monorepo
pnpm test

# Hanya plugin ini
pnpm --filter @infera/plugin-object-detection test
```

## Referensi Tipe Lengkap

Lihat [API Reference — @infera/plugin-object-detection](/api/plugin-object-detection) untuk dokumentasi tipe yang dihasilkan secara otomatis.
