# Progress Pengerjaan — Universal Inference Platform (Infera)

> Dokumen ini merangkum progress implementasi berdasarkan TDD `universal_inference_platform_tdd.md`, mengikuti roadmap di bagian 12 (Tahap 1: Core Foundation & MVP).

Terakhir diperbarui: **23 Juni 2026**

---

## Status Ringkas

| Tahap (sesuai Roadmap TDD)              | Status         |
|------------------------------------------|----------------|
| Tahap 1: Core Foundation & MVP           | ✅ Selesai     |
| Tahap 2: Object Detection & Segmentation | ⬜ Belum mulai |
| Tahap 3: Tabular & OCR                   | ⬜ Belum mulai |
| Tahap 4: Plugin SDK Terbuka              | ⬜ Belum mulai |
| Tahap 5: Produksi & WebGPU               | ⬜ Belum mulai |

---

## 1. Infrastruktur Project ✅

- [x] Repo GitHub: `FahroziAldinata/InFera-universal-inference-platform`
- [x] Node.js v24.17.0 + npm 11.13.0
- [x] pnpm v11.8.0 sebagai package manager
- [x] Monorepo Turborepo (`turbo.json`)
- [x] `pnpm-workspace.yaml` (`apps/*`, `packages/*`, `packages/plugins/*`)
- [x] `.gitignore` dikonfigurasi
- [x] Branch utama `main`

**Struktur folder:**
```
Infera/
├── apps/
│   └── web-client/          ✅ React + Vite + TypeScript (MVP selesai)
├── packages/
│   ├── core/                ✅ Selesai
│   ├── inference-engine/    ✅ Selesai
│   └── plugins/
│       └── image-classification/   ✅ Selesai
├── package.json
├── turbo.json
├── pnpm-workspace.yaml
└── .gitignore
```

---

## 2. `packages/core` ✅

- `src/types/plugin.ts` — `Tensor`, `ModelFormat`, `InputType`, `InferenceResult<T>`, `ModelMetadata`, `InferencePlugin<T>`, `PluginRegistration`
- `src/utils/validation.ts` — `validateModelFile()`, `sanitizeOutputText()`
- `src/plugin-manager.ts` — `PluginManager` singleton
- Build: `pnpm exec tsc -b` ✅

---

## 3. `packages/inference-engine` ✅

- `OnnxRunner` — `loadModel()`, `warmup()`, `run()`, `dispose()`
- Singleton `onnxRunner`
- Backend: WASM (WebGL/WebGPU di Tahap 5)
- Build: `pnpm exec tsc --noEmit` ✅

**Catatan teknis (tech debt):**
- Import `Tensor` masih via path relatif, bukan `@infera/core` alias — perlu dirapikan di Tahap 2.

---

## 4. `packages/plugins/image-classification` ✅

Commit: `abd423c`

- `src/types.ts` — `ClassificationLabel`, `ClassificationResult`, `ImageClassificationConfig`, `DEFAULT_CONFIG`
- `src/plugin.ts` — `ImageClassificationPlugin`:
  - `setInputShape()` — baca shape dari model, tidak hardcode 224×224
  - `loadLabels()` — parse file `.txt` label
  - `preprocess()` — resize via `OffscreenCanvas`, RGBA → NCHW Float32Array, normalisasi
  - `postprocess()` — softmax dengan max-subtraction, sort topK, map ke label, fallback `Class N`
  - `init()`, `dispose()`
  - Singleton `imageClassificationPlugin`
- Verified: **56/56 OK** via PowerShell script

---

## 5. `apps/web-client` ✅ MVP Selesai

Commit: `344572f`

**Komponen:**
- `src/store/inferenceStore.ts` — Zustand store: `AppStep`, `ModelInfo`, seluruh pipeline state
- `src/components/ModelUploader.tsx` — upload `.onnx` + `.txt`, muat model, notifikasi sukses dengan metadata (nama, jumlah label, input shape)
- `src/components/ImageUploader.tsx` — upload gambar dengan preview, aktif setelah model dimuat
- `src/components/RunButton.tsx` — pipeline `preprocess → run → postprocess`, aktif setelah gambar dipilih
- `src/components/ResultPanel.tsx` — topK label + confidence bar + execution time + error state

**Verified end-to-end:**
- Model: `mobilenetv2-10.onnx` (1000 label ImageNet)
- Hasil: top prediction `banded gecko 99.82%`, execution time `0.7ms` ✅

---

## 6. Tooling ✅

- ESLint flat config + `@typescript-eslint`
- Prettier
- Vitest terinstall (belum ada test case)
- Script terpusat di root `package.json`

---

## 7. `packages/plugins/object-detection` (Phase 1 — Infrastructure) ✅

- [x] `package.json` — Konfigurasi package `@infera/plugin-object-detection`
- [x] `tsconfig.json` — Konfigurasi compiler tsconfig
- [x] `src/types.ts` — Interface `BoundingBox`, `Detection`, `DetectionResult`, `PluginCapabilities`, `DetectionModelMetadata`, dan `ObjectDetectionConfig`
- [x] `src/constants.ts` — `DEFAULT_CONFIG` dan `DEFAULT_CAPABILITIES`
- [x] `src/metadata.ts` — Helper `getModelMetadata()` untuk dinamisasi model adapter
- [x] `src/preprocess/` — Helper skeleton: `resize.ts`, `normalize.ts`, `letterbox.ts`
- [x] `src/postprocess/` — Helper skeleton: `nms.ts`, `iou.ts`, `decoder.ts`
- [x] `src/utils/` — Helper skeleton: `canvas.ts`, `colors.ts`
- [x] `src/plugin.ts` — Skeleton `ObjectDetectionPlugin` implements `InferencePlugin<DetectionResult>`
- [x] `src/index.ts` — Entrypoint re-exports
- [x] Build & Typecheck: `pnpm build` & `pnpm typecheck` sukses ✅

---

## 8. Next Steps — Object Detection Plugin & Platform Stabilization

Urutan logis berikutnya:

1. **Object Detection Plugin (Phase 2 & 3)**:
   - Implementasi full preprocess pipeline (letterboxing, normalization, resize)
   - Integrasi ONNX inference & decoder output model YOLO/SSD
2. **Object Detection Plugin (Phase 4, 5, 6, & 7)**:
   - Non-Maximum Suppression (NMS) & IoU postprocessing
   - Visualisasi bounding box dengan canvas overlay
   - custom labels (.txt / .json) & universal model package (.zip)
3. **Stabilization**:
   - Fix `@infera/core` alias di `packages/inference-engine` — hapus workaround relative import
   - Unit test pertama (Vitest) — `validateModelFile()` dan `PluginManager` di `packages/core`
4. **IndexedDB (Dexie.js)** — histori inferensi di `web-client/src/db/`

---

## Referensi
- Dokumen acuan: `universal_inference_platform_tdd.md`
- Repo: https://github.com/FahroziAldinata/InFera-universal-inference-platform