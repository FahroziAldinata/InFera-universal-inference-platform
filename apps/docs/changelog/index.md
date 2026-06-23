# Changelog

Semua perubahan penting pada proyek InFera didokumentasikan di halaman ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) dan proyek mengikuti [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.2.0] — 2026-06-24

### Ditambahkan — @infera/plugin-object-detection

#### Phase 5 — Canvas Overlay Visualization
- Sistem warna HSL dinamis dengan assignment kelas otomatis
- Bounding box renderer dengan cornerRadius, lineDash, dan fill opacity
- Rendering label dengan auto-positioning dan clipping
- Canvas rendering engine dengan dukungan Retina/DPI (DevicePixelRatio)
- Export canvas hasil visualisasi (PNG, JPEG, DataURL)

#### Phase 6 — Universal Model Package (UAMP)
- Format paket model `.zip` mandiri
- ZIP loader client-side menggunakan `fflate`
- Proteksi Zip Slip (path traversal blocking)
- Proteksi Zip Bomb (batas dekompresi 100MB per entri)
- Batas entri file (maksimal 1.000 entri)
- Parser `metadata.json` dengan validasi skema
- Parser label `labels.txt` dan `labels.json`

#### Phase 7 — WebGPU Backend & Benchmarking
- Deteksi kapabilitas WebGPU dan WASM SIMD otomatis
- Pemilihan backend otomatis dengan graceful fallback
- Sistem benchmark real-time (preprocess/inference/postprocess latency, FPS, heap memory)
- Test multi-backend (WASM, WebGPU, fallback, metrics suppression)

#### Phase 8 — Web Client Integration (apps/web-client)
- Zustand store untuk state deteksi, viewport, dan toolbar
- Canvas overlay interaktif terintegrasi React
- Grid hasil deteksi dengan panel benchmark

#### Phase 9 — Interactive Bounding Boxes UI
- Stable detection ID berbasis string (menggantikan index)
- Spatial overlap priority hit-testing
- DOM tooltip 60fps tanpa React re-render
- Animasi seleksi rAF pada canvas
- Transformasi koordinat dua arah (canvas ↔ image)
- Zoom constraint 0.1x–20x dengan pinch gesture
- Double-click focus & center ke deteksi terpilih
- Keyboard accessibility (Tab, Enter, Escape, Arrow keys)
- Stress test 500 deteksi simultan

#### Phase 10 — Production Readiness
- IndexedDB model cache dengan Dexie, versioning schema, dan LRU eviction (maks. 10 model)
- Sistem export extensible: JSON, CSV, COCO annotations, YOLO txt, VOC XML, Label Studio
- Web Worker post-processing dengan Transferable ArrayBuffers dan AbortController
- Zustand `persist` middleware untuk state UI ringan
- Virtualisasi grid hasil deteksi tanpa dependensi eksternal
- React ErrorBoundary global dengan reset, cleanup, dan worker restart
- Pencegahan memory leak: ONNX session disposal dan Object URL cleanup

### Diperbarui
- Bump semua package workspace ke versi `0.2.0`
- Validasi bundle dengan `npm pack`

---

## [0.1.0] — 2026-05-01

### Ditambahkan

#### Phase 1 — Core Foundation
- Setup monorepo Turborepo + pnpm workspaces
- `@infera/core`: tipe dasar (`Tensor`, `ModelMetadata`, `InferenceResult<T>`), PluginManager, validasi
- `@infera/inference-engine`: OnnxRunner, loadModel, warmup, run, dispose
- GitHub Actions CI pipeline (build, typecheck, test)

#### Phase 2 — Image Classification Plugin
- `@infera/plugin-image-classification`
- Preprocessing: resize, normalisasi
- Postprocessing: softmax, Top-K sorting
- Integrasi web client React + Vite + TypeScript

#### Phase 3–4 — Object Detection Foundation
- `@infera/plugin-object-detection` v0.1.0
- Auto-deteksi YOLOv5 (`[1, N, 5+C]`) dan YOLOv8 (`[1, 4+C, N]`)
- Scaled letterboxing preprocessing
- Anchor-box decoder, koordinat restoration, IoU, NMS
- Suite test lengkap

---

## [Unreleased]

- Phase 11: Website dokumentasi VitePress
- TypeDoc API reference generation
- GitHub Pages deployment
- npm publish semua package

---

*Dibuat oleh [Fahrozi Aldinata](https://github.com/FahroziAldinata).*
