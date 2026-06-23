# Plugin Image Classification

`@infera/plugin-image-classification` adalah plugin klasifikasi gambar untuk platform InFera. Memungkinkan prediksi Top-K kategori dari gambar menggunakan model ONNX apapun yang kompatibel.

## Fitur Utama

| Fitur | Deskripsi |
|---|---|
| **Format ONNX** | Kompatibel dengan model ImageNet standard |
| **Top-K Sorting** | Kembalikan N prediksi teratas dengan confidence |
| **Normalisasi Otomatis** | Normalize piksel ke `[0, 1]` secara otomatis |
| **Dynamic Shape** | Mendukung model dengan input shape dinamis |

## Instalasi

```bash
pnpm add @infera/plugin-image-classification
```

## Konfigurasi

### Antarmuka `ImageClassificationConfig`

```typescript
interface ImageClassificationConfig {
  inputWidth: number;   // Lebar input model (default: 224)
  inputHeight: number;  // Tinggi input model (default: 224)
  topK: number;         // Jumlah prediksi teratas (default: 5)
  normalize: boolean;   // Normalisasi piksel (default: true)
}
```

### Contoh Inisialisasi

```typescript
import { ImageClassificationPlugin } from '@infera/plugin-image-classification';

const plugin = new ImageClassificationPlugin({
  inputWidth: 224,
  inputHeight: 224,
  topK: 5,
  normalize: true,
});

await plugin.init();
```

## Memuat Model

```typescript
// Dari file input HTML
const fileInput = document.getElementById('model') as HTMLInputElement;
await plugin.loadModel(fileInput.files![0]);
```

## Melakukan Prediksi

```typescript
const imgElement = document.getElementById('image') as HTMLImageElement;
const result = await plugin.predict(imgElement);

console.log(result.classifications);
/*
[
  { classId: 281, label: 'tabby cat', confidence: 0.943 },
  { classId: 282, label: 'tiger cat', confidence: 0.031 },
  { classId: 285, label: 'Egyptian cat', confidence: 0.018 },
  { classId: 287, label: 'lynx', confidence: 0.004 },
  { classId: 291, label: 'lion', confidence: 0.002 },
]
*/
```

## Load Labels

```typescript
// Format: teks plain satu label per baris (ImageNet format)
const labelsText = `tench
goldfish
great white shark
...`;

plugin.loadLabels(labelsText);
```

## Input yang Didukung

| Tipe Input | Contoh |
|---|---|
| `HTMLImageElement` | `document.getElementById('img')` |
| `HTMLCanvasElement` | `canvas` |
| `File` | `fileInput.files[0]` |

## Kompatibilitas Browser

| Browser | WASM | Versi Minimum |
|---|:---:|---|
| Chrome | ✅ | Chrome 80+ |
| Edge | ✅ | Edge 80+ |
| Firefox | ✅ | Firefox 79+ |
| Safari | ✅ | Safari 15+ |

## Menjalankan Tests

```bash
pnpm --filter @infera/plugin-image-classification test
```

## Referensi API

Lihat [API Reference — @infera/plugin-image-classification](/api/plugin-image-classification) untuk dokumentasi lengkap.
