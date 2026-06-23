# Spesifikasi UAMP — Universal Model Package

**UAMP** (Universal Model Package) adalah format paket model browser-native berbasis arsip `.zip` yang dikembangkan untuk InFera. UAMP memungkinkan distribusi model ML yang mandiri — satu file `.zip` berisi semua yang dibutuhkan untuk menjalankan inferensi.

## Mengapa UAMP?

| Masalah | Solusi UAMP |
|---|---|
| Model ONNX perlu diunduh terpisah dari konfigurasi | Semua dalam satu file `.zip` |
| Label mapping harus dikodekan secara manual | `labels.txt` atau `labels.json` sudah termasuk |
| Konfigurasi threshold tersebar di kode | `metadata.json` berisi semua parameter |
| Tidak ada dokumentasi per-model | `README.md` opsional di dalam package |

## Struktur Arsip

```
model-package.zip
├── model.onnx           ← Bobot model ONNX (WAJIB)
├── metadata.json        ← Konfigurasi lengkap (WAJIB)
├── labels.txt           ← Label teks satu per baris (Opsional)
├── labels.json          ← Label sebagai array atau key-value map (Opsional)
├── README.md            ← Deskripsi dan lisensi model (Opsional)
└── thumbnail.png        ← Ikon atau gambar representatif (Opsional)
```

## Skema `metadata.json`

```json
{
  "id": "yolov8n-coco",
  "name": "YOLOv8n Object Detection",
  "version": "1.0.0",
  "task": "object-detection",
  "inputShape": [1, 3, 640, 640],
  "architecture": "yolov8",
  "confidenceThreshold": 0.25,
  "iouThreshold": 0.45,
  "normalize": true,
  "description": "Model COCO 80-class YOLOv8n dioptimalkan untuk browser"
}
```

### Properti `metadata.json`

| Field | Tipe | Wajib | Deskripsi |
|---|---|:---:|---|
| `id` | `string` | ✅ | Identifier unik model |
| `name` | `string` | ✅ | Nama tampilan model |
| `version` | `string` | ✅ | Versi semver model |
| `task` | `string` | ✅ | `"object-detection"` atau `"image-classification"` |
| `inputShape` | `number[]` | ✅ | Shape tensor input `[N, C, H, W]` |
| `architecture` | `string` | ❌ | `"yolov5"`, `"yolov8"`, dll |
| `confidenceThreshold` | `number` | ❌ | Default: `0.25` |
| `iouThreshold` | `number` | ❌ | Default: `0.45` |
| `normalize` | `boolean` | ❌ | Default: `true` |
| `description` | `string` | ❌ | Deskripsi model |

## Format `labels.txt`

Satu label per baris, diindeks dari 0:

```
person
bicycle
car
motorcycle
airplane
bus
train
truck
boat
traffic light
fire hydrant
...
```

## Format `labels.json`

Sebagai array:
```json
["person", "bicycle", "car", "motorcycle", "airplane"]
```

Atau sebagai key-value map:
```json
{
  "0": "person",
  "1": "bicycle",
  "2": "car"
}
```

## Memuat Package di InFera

```typescript
import { loadPackage } from '@infera/plugin-object-detection';

const zipInput = document.getElementById('zip') as HTMLInputElement;
const zipFile = zipInput.files![0];

// Parse UAMP package
const pkg = await loadPackage(zipFile);

// Akses komponen
console.log(pkg.metadata);     // Metadata model
console.log(pkg.labels);       // Array label string
console.log(pkg.modelFile);    // File ONNX siap dipakai
console.log(pkg.readme);       // Konten README (atau null)

// Muat ke plugin
await plugin.loadModel(pkg.modelFile);
plugin.loadLabels(pkg.labels.join('\n'));
plugin.setInputShape(pkg.metadata.inputShape);
```

## Membuat UAMP Package

Anda dapat membuat UAMP package menggunakan tool apapun yang dapat membuat arsip ZIP standar:

### Menggunakan Python

```python
import zipfile
import json

with zipfile.ZipFile('yolov8n.zip', 'w') as zf:
    # Tambahkan model ONNX
    zf.write('yolov8n.onnx', 'model.onnx')

    # Tambahkan metadata
    metadata = {
        "id": "yolov8n-coco",
        "name": "YOLOv8n COCO",
        "version": "1.0.0",
        "task": "object-detection",
        "inputShape": [1, 3, 640, 640],
        "architecture": "yolov8",
        "confidenceThreshold": 0.25,
        "iouThreshold": 0.45
    }
    zf.writestr('metadata.json', json.dumps(metadata))

    # Tambahkan labels
    zf.write('coco.labels', 'labels.txt')
```

### Menggunakan Command Line

```bash
zip yolov8n.zip model.onnx metadata.json labels.txt README.md
```

## Jaminan Keamanan

### Proteksi Zip Slip

UAMP loader menolak semua entri yang mengandung path traversal:

```
❌ Ditolak: ../../../etc/passwd
❌ Ditolak: /absolute/path/file
✅ Diterima: model.onnx
✅ Diterima: subdir/labels.txt
```

### Proteksi Zip Bomb

Ukuran dekompresi maksimal per entri dibatasi **100 MB** untuk mencegah memory exhaustion.

### Batas Entri

Total maksimal entri dalam satu archive dibatasi **1.000 file** untuk mencegah resource exhaustion.

## Kompatibilitas

UAMP menggunakan library `fflate` (~4KB) untuk dekompresi client-side sehingga berjalan di semua browser modern tanpa dependensi eksternal.

| Browser | Kompatibilitas |
|---|:---:|
| Chrome 80+ | ✅ |
| Edge 80+ | ✅ |
| Firefox 79+ | ✅ |
| Safari 15+ | ✅ |
| Mobile Chrome | ✅ |
