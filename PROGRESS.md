# Progress Pengerjaan — Universal Inference Platform (Infera)

> Dokumen ini merangkum progress implementasi berdasarkan TDD `universal_inference_platform_tdd.md`, mengikuti roadmap di bagian 12 (Tahap 1: Core Foundation & MVP).

Terakhir diperbarui: **24 Juni 2026**

---

## Status Ringkas

| Tahap (sesuai Roadmap TDD)              | Status         |
|------------------------------------------|----------------|
| Tahap 1: Core Foundation & MVP           | ✅ Selesai     |
| Tahap 2: Object Detection & Segmentation | 🏃 In Progress |
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

## 8. Object Detection Phase 2

### Tahap 2.1 — Types & Constants ✅
- [x] Tambahkan `ImageTensor`, `ResizeResult`, `LetterboxResult`, `PreprocessResult` ke `types.ts`
- [x] Tambahkan `DEFAULT_INPUT_SIZE`, `LETTERBOX_COLOR`, `DEFAULT_MEAN`, `DEFAULT_STD` ke `constants.ts`
- [x] Verifikasi build & typecheck sukses

### Tahap 2.2 — Image Decoder ✅
- [x] Implementasikan `fileToImageData` di `src/preprocess/image_data.ts`
- [x] Tambahkan unit test `image_data.test.ts`
- [x] Verifikasi test pass sukses

### Tahap 2.3 — Resize Module ✅
- [x] Implementasikan `resizeImage` di `src/preprocess/resize.ts`
- [x] Tambahkan unit test `resize.test.ts`
- [x] Verifikasi test pass sukses

### Tahap 2.4 — Letterbox Module ✅
- [x] Implementasikan `letterboxImage` di `src/preprocess/letterbox.ts`
- [x] Tambahkan unit test `letterbox.test.ts`
- [x] Verifikasi test pass sukses

### Tahap 2.5 — Normalization ✅
- [x] Implementasikan `normalizePixels` di `src/preprocess/normalize.ts`
- [x] Tambahkan unit test `normalize.test.ts`
- [x] Verifikasi test pass sukses

### Tahap 2.6 — Tensor Conversion ✅
- [x] Implementasikan `toCHWTensor` di `src/preprocess/tensor.ts`
- [x] Tambahkan unit test `tensor.test.ts`
- [x] Verifikasi test pass sukses

### Tahap 2.7 — Plugin Integration ✅
- [x] Integrasikan seluruh helper di `src/plugin.ts`
- [x] Tambahkan unit test `plugin.test.ts` untuk memverifikasi pipeline preprocess secara utuh
- [x] Verifikasi test pass sukses

---

## 9. Object Detection Phase 3 & 4

### Object Detection Phase 3

#### Tahap 3.1 — Model Metadata ✅
- [x] Buat `src/model_metadata.ts`
- [x] Definisikan interface `DetectionModelMetadata` dengan properti optional `architecture`
- [x] Refactor `src/types.ts` dan `src/metadata.ts`
- [x] Verifikasi build & typecheck sukses

#### Tahap 3.2 — Session Manager
- [ ] Buat `src/runtime/session.ts`
- [ ] Tambahkan unit test `session.test.ts`
- [ ] Verifikasi build, typecheck, dan test sukses

#### Tahap 3.3 — Inference Engine
- [ ] Buat `src/runtime/inference.ts`
- [ ] Tambahkan unit test `inference.test.ts`
- [ ] Verifikasi build, typecheck, dan test sukses

#### Tahap 3.4 — Plugin Integration
- [ ] Integrasikan runtime di `src/plugin.ts`
- [ ] Verifikasi build, typecheck, dan test sukses

### Object Detection Phase 4

#### Tahap 4.1 — Decoder
- [ ] Buat `src/postprocess/decoder.ts`, `yolov5_decoder.ts`, `yolov8_decoder.ts`
- [ ] Verifikasi build, typecheck, dan test sukses

#### Tahap 4.2 — Coordinate Restoration
- [ ] Buat `src/postprocess/restore.ts` & `restore.test.ts`
- [ ] Verifikasi build, typecheck, dan test sukses

#### Tahap 4.3 — IoU
- [ ] Buat `src/postprocess/iou.ts` & `iou.test.ts`
- [ ] Verifikasi build, typecheck, dan test sukses

#### Tahap 4.4 — Non-Max Suppression (NMS)
- [ ] Buat `src/postprocess/nms.ts` & `nms.test.ts`
- [ ] Verifikasi build, typecheck, dan test sukses

#### Tahap 4.5 — Pipeline Test
- [ ] Buat `src/__tests__/pipeline.test.ts`
- [ ] Verifikasi build, typecheck, dan test sukses

---

## 10. Next Steps

Urutan logis berikutnya:

1. **Object Detection Plugin (Phase 3 & 4)**:
   - Integrasi ONNX Runtime untuk inference
   - Non-Maximum Suppression (NMS) & IoU postprocessing
2. **Object Detection Plugin (Phase 5, 6, & 7)**:
   - Visualisasi bounding box dengan canvas overlay
   - custom labels (.txt / .json) & universal model package (.zip)
3. **Stabilization**:
   - Fix `@infera/core` alias di `packages/inference-engine` — hapus workaround relative import
   - Unit test pertama (Vitest) — `validateModelFile()` dan `PluginManager` di `packages/core`
4. **IndexedDB (Dexie.js)** — histori inferensi di `web-client/src/db/`


---

## Workspace Stabilization

### Tahap 1 — Readonly Array Fix ✅
- [x] Fix readonly array compatibility (`readonly InputType[]`, `readonly ModelFormat[]`).
- [x] Fix `web-client` RunButton state logic bug (TS2367).
- Verification: `pnpm build` ✅ — 4/4 tasks successful

### Tahap 2 — Typecheck Workspace ✅
- [x] Add root `typecheck` script ke `package.json`.
- [x] Tambah `"typecheck": "turbo run typecheck"` pipeline di `turbo.json`.
- [x] Add `typecheck` script ke `packages/core`.
- [x] Add `typecheck` script ke `packages/inference-engine`.
- [x] Add `typecheck` script ke `packages/plugins/image-classification`.
- [x] Add `typecheck` script ke `apps/web-client`.
- Verification: `pnpm typecheck` ✅ — 4/4 packages passed (4.195s)

### Tahap 3 — Integrasi Vitest ✅
- [x] Buat `packages/core/src/utils/validation.test.ts` (9 test cases).
- [x] Tambah `vitest` sebagai devDependency di `packages/core`.
- [x] Update script `test` di `packages/core` menjadi `vitest run`.
- Verification: `pnpm test` ✅ — 9/9 tests passed (`validation.test.ts`)

### Verification — Full Workspace Health Check ✅
| Command         | Status | Detail                          |
|-----------------|--------|---------------------------------|
| pnpm install    | ✅     | Done in 13.6s                   |
| pnpm build      | ✅     | 4/4 packages, 8.667s            |
| pnpm typecheck  | ✅     | 4/4 packages, 4.592s            |
| pnpm test       | ✅     | 9/9 tests passed, FULL TURBO    |

### Technical Notes
- Plugin contract migrated to immutable arrays.
- Workspace sekarang mendukung full type checking via Turborepo pipeline.
- `typecheck` task dikonfigurasi dengan `dependsOn: ["^typecheck"]` agar dependensi dicheck terlebih dahulu.

### Tahap 4 — CI GitHub Actions ✅
- [x] Buat `.github/workflows/ci.yml`.
- [x] Pipeline: `checkout → install pnpm 11.8.0 → setup Node 20 → install → build → typecheck → test`.
- [x] Trigger: `push` dan `pull_request` ke branch `main`.
- [x] `concurrency` group dikonfigurasi untuk cancel duplicate runs.
- [x] `--frozen-lockfile` dipakai pada install untuk memastikan lockfile tidak berubah di CI.
- Verification: File YAML valid (50 baris), tidak masuk `.gitignore` ✅

### Technical Notes
- `pnpm/action-setup@v4` dipilih karena kompatibel dengan `packageManager` field di root `package.json`.
- `actions/setup-node@v4` dengan `cache: pnpm` mengaktifkan caching dependency berbasis `pnpm-lock.yaml` agar CI lebih cepat pada run berikutnya.
- `concurrency.cancel-in-progress: true` mencegah antrian build menumpuk saat developer melakukan push cepat.
- `--frozen-lockfile` memproteksi CI dari drift antara `pnpm-lock.yaml` dan `package.json` yang tidak tersinkronisasi.

---

## Referensi
- Dokumen acuan: `universal_inference_platform_tdd.md`
- Repo: https://github.com/FahroziAldinata/InFera-universal-inference-platform