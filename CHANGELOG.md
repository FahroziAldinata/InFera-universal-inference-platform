# Changelog

Semua perubahan penting pada proyek InFera didokumentasikan di sini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) dan proyek mengikuti [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Ditambahkan
- Website dokumentasi resmi menggunakan VitePress
- TypeDoc API reference generation otomatis
- GitHub Actions workflow untuk docs deployment ke GitHub Pages
- GitHub Actions workflow untuk release otomatis ke npm
- Persiapan publish semua package ke npm registry

---

## [0.2.0] — 2026-06-24

### Ditambahkan — @infera/plugin-object-detection

**Phase 5 — Canvas Overlay Visualization**
- Bounding Box renderer dengan dukungan cornerRadius, lineDash, fill opacity
- Sistem warna HSL dinamis dengan assignment kelas otomatis
- Canvas rendering engine dengan dukungan Retina/DPI (DevicePixelRatio auto-scaling)
- Export canvas visualisasi ke PNG, JPEG, atau DataURL
- Label rendering dengan auto-positioning (top/bottom) dan overflow clipping

**Phase 6 — Universal Model Package (UAMP)**
- Format paket model `.zip` mandiri untuk distribusi model ML
- ZIP loader browser-native menggunakan `fflate` (~4KB)
- Proteksi Zip Slip (menolak path `../` dan traversal absolut)
- Proteksi Zip Bomb (batas dekompresi 100MB per entri file)
- Batas entri file maksimal 1.000 per archive
- Parser `metadata.json` dengan validasi skema
- Parser label `labels.txt` (plaintext) dan `labels.json` (array/map)

**Phase 7 — WebGPU Backend & Benchmarking**
- Deteksi kapabilitas WebGPU dan WASM SIMD secara otomatis
- Pemilihan backend otomatis (WebGPU → WASM SIMD → WASM) dengan graceful fallback
- Sistem benchmark real-time: latensi preprocess/inference/postprocess, FPS throughput, heap memory
- Test multi-backend mencakup WASM, WebGPU, fallback behavior, dan metrics suppression

**Phase 8 — Web Client Integration**
- Integrasi penuh ke aplikasi web React + Vite + TypeScript
- Zustand store untuk state deteksi, viewport, dan toolbar
- Canvas overlay interaktif dengan panel grid hasil deteksi dan metrics benchmark

**Phase 9 — Interactive Bounding Boxes UI**
- Stable detection ID berbasis string `det_<uuid>` (menggantikan index)
- Spatial overlap priority hit-testing untuk resolusi tumpang tindih bounding box
- DOM tooltip 60fps tanpa React re-render
- Animasi seleksi rAF pada canvas dengan smooth transition
- Transformasi koordinat dua arah (canvas ↔ image space)
- Zoom 0.1x–20x dengan pinch gesture support
- Double-click focus & center ke deteksi terpilih
- Keyboard accessibility: Tab, Enter, Escape, Arrow keys navigation
- Stress test 500 deteksi simultan

**Phase 10 — Production Readiness**
- IndexedDB model cache menggunakan Dexie dengan schema versioning dan LRU eviction (maks. 10 model)
- Sistem export extensible: JSON, CSV, COCO annotations, YOLO txt, VOC XML, Label Studio
- Web Worker post-processing dengan Transferable ArrayBuffers dan AbortController
- Zustand `persist` middleware untuk state UI ringan
- Virtualisasi grid hasil deteksi tanpa dependensi eksternal
- React ErrorBoundary global dengan reset, cleanup, dan worker restart
- Pencegahan memory leak: ONNX session disposal dan Object URL cleanup

### Diperbarui
- Semua package workspace versi bump ke `0.2.0`
- Validasi bundle dengan `npm pack` dan ESM exports compatibility

---

## [0.1.0] — 2026-05-01

### Ditambahkan — Infrastruktur & Foundation

**Phase 1 — Core Foundation**
- Setup monorepo Turborepo + pnpm workspaces
- `@infera/core`: tipe dasar `Tensor`, `ModelMetadata`, `InferenceResult<T>`, PluginManager singleton, validation helpers
- `@infera/inference-engine`: OnnxRunner (`loadModel`, `warmup`, `run`, `dispose`), capability detection
- GitHub Actions CI pipeline (build, typecheck, test)

**Phase 2 — Image Classification Plugin**
- `@infera/plugin-image-classification` v0.1.0
- Preprocessing: resize, channel normalization
- Postprocessing: softmax computation, Top-K sorting
- Demo integration web client React + Vite + TypeScript

**Phase 3–4 — Object Detection Foundation**
- `@infera/plugin-object-detection` v0.1.0
- Auto-deteksi arsitektur YOLOv5 (`[1, N, 5+C]`) dan YOLOv8 (`[1, 4+C, N]`) dari shape tensor
- Scaled letterboxing preprocessing dengan aspect ratio preservation
- Anchor-box decoder, koordinat restoration dari letterbox space
- IoU computation dan Non-Maximum Suppression (NMS)
- Suite test unit dan integrasi lengkap

---

*Dibuat oleh [Fahrozi Aldinata](https://github.com/FahroziAldinata).*
