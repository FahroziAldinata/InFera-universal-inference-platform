# Progress Pengerjaan — Universal Inference Platform (Infera)

> Dokumen ini merangkum progress implementasi berdasarkan TDD `universal_inference_platform_tdd.md`, mengikuti roadmap di bagian 12 (Tahap 1: Core Foundation & MVP).

Terakhir diperbarui: **23 Juni 2026**

---

## Status Ringkas

| Tahap (sesuai Roadmap TDD)              | Status         |
|------------------------------------------|----------------|
| Tahap 1: Core Foundation & MVP           | 🔄 In Progress |
| Tahap 2: Object Detection & Segmentation | ⬜ Belum mulai |
| Tahap 3: Tabular & OCR                   | ⬜ Belum mulai |
| Tahap 4: Plugin SDK Terbuka              | ⬜ Belum mulai |
| Tahap 5: Produksi & WebGPU               | ⬜ Belum mulai |

---

## 1. Infrastruktur Project ✅

- [x] Repo GitHub dibuat: `FahroziAldinata/InFera-universal-inference-platform`
- [x] Node.js v24.17.0 + npm 11.13.0 terinstall
- [x] pnpm v11.8.0 terinstall sebagai package manager
- [x] Monorepo di-setup dengan **Turborepo** (`turbo.json`)
- [x] `pnpm-workspace.yaml` dikonfigurasi (`apps/*`, `packages/*`, `packages/plugins/*`)
- [x] `.gitignore` dikonfigurasi (exclude `node_modules`, `dist`, `.turbo`, dll)
- [x] Branch utama disamakan jadi `main`, ter-push ke GitHub

**Struktur folder saat ini:**
```
Infera/
├── apps/
│   └── web-client/          ✅ React + Vite + TypeScript (scaffold awal)
├── packages/
│   ├── core/                ✅ Selesai (lihat detail di bawah)
│   ├── inference-engine/    ✅ Selesai (lihat detail di bawah)
│   └── plugins/
│       └── image-classification/   ⬜ Belum diisi
├── package.json              ✅ Root, dengan script lint/test/build/dev via turbo
├── turbo.json                ✅
├── pnpm-workspace.yaml        ✅
└── .gitignore                 ✅
```

---

## 2. `packages/core` ✅ Selesai

Berisi kontrak/interface inti platform sesuai TDD bagian 7 (Desain Plugin).

**File yang sudah dibuat:**
- `src/types/plugin.ts`
  - `Tensor` — representasi tensor universal antar plugin & engine
  - `ModelFormat`, `InputType` — tipe-tipe dasar
  - `InferenceResult<T>` — hasil generik dari inferensi
  - `ModelMetadata` — metadata model yang diupload
  - `InferencePlugin<T>` — **interface utama** yang wajib diimplementasikan tiap plugin task (init, preprocess, postprocess, dispose)
  - `PluginRegistration` — status registrasi plugin
- `src/utils/validation.ts`
  - `validateModelFile()` — validasi ukuran (maks 500MB) & ekstensi file model, sesuai TDD bagian 13 (Security Consideration — DoS prevention)
  - `sanitizeOutputText()` — sanitasi teks output model untuk mencegah XSS (relevan untuk plugin OCR nanti)
- `src/plugin-manager.ts`
  - Class `PluginManager` — register/unregister plugin, enable/disable, list plugin aktif
  - `pluginManager` — singleton instance
- `src/index.ts` — entry point export semua di atas

**Status build:** `pnpm exec tsc -b` ✅ lolos tanpa error.

---

## 3. `packages/inference-engine` ✅ Selesai (untuk ONNX)

Implementasi Engine API sesuai TDD bagian 11 (API Design), khusus runtime ONNX terlebih dahulu.

**File yang sudah dibuat:**
- `src/onnx-runner.ts`
  - Class `OnnxRunner` — wrapper di atas `onnxruntime-web`
    - `loadModel(file)` → load `.onnx`, kembalikan session ID unik
    - `warmup(modelId, inputShape)` → dummy inference untuk mencegah lag shader pertama kali
    - `run(modelId, inputTensor)` → eksekusi inferensi sesungguhnya
    - `dispose(modelId)` → release session, cegah memory leak (poin kritik Senior Engineer di TDD 16.1)
  - `onnxRunner` — singleton instance
- `src/index.ts` — entry point export

**Catatan teknis:**
- Sempat ada kendala resolusi module `@infera/core` lewat workspace alias (`Cannot find module`). **Solusi sementara**: `onnx-runner.ts` mengimpor tipe `Tensor` via path relatif langsung (`../../core/src/types/plugin`) alih-alih nama package `@infera/core`. Ini berfungsi, namun **perlu dirapikan kembali di kemudian hari** agar konsisten memakai package alias (kemungkinan perlu konfigurasi `tsup`/`tsc -b` yang lebih matang atau pindah ke bundler seperti `vite-plugin-dts`).
- Saat ini baru mendukung **executionProvider: `wasm`**. Dukungan `webgl`/`webgpu` (TDD Tahap 5) belum diimplementasikan.

**Status build:** `pnpm exec tsc --noEmit` ✅ lolos tanpa error.

---

## 4. `apps/web-client` 🔄 Baru Scaffold

- [x] Scaffold awal via `pnpm create vite@latest -- --template react-ts`
- [x] Dependency terinstall: `zustand`, `dexie`, `tailwindcss`, `postcss`, `autoprefixer`
- [ ] Konfigurasi Tailwind belum dirapikan/diverifikasi jalan
- [ ] Belum ada komponen UI (uploader, layout, dsb.)
- [ ] Belum terhubung ke `packages/core` & `packages/inference-engine`

---

## 5. Tooling: Lint & Test ✅ Selesai

- [x] ESLint (`eslint.config.js`, flat config) + `@typescript-eslint`
- [x] Prettier (`.prettierrc`)
- [x] Vitest terinstall di root (belum ada test case ditulis)
- [x] Script terpusat di root `package.json`:
  ```json
  "scripts": {
    "test": "pnpm exec turbo run test",
    "lint": "pnpm exec turbo run lint",
    "build": "pnpm exec turbo run build",
    "dev": "pnpm exec turbo run dev"
  }
  ```
- [x] `pnpm run lint` berhasil dijalankan di semua workspace (`@infera/core`, `@infera/inference-engine`, `web-client`)
- [ ] Belum ada unit test sungguhan (baru placeholder `echo "no test configured yet"`)

---

## 6. Belum Dikerjakan (Next Steps)

Urutan logis berikutnya, masih dalam **Tahap 1 (MVP)** sesuai roadmap TDD:

1. **`packages/plugins/image-classification`** — implementasi `InferencePlugin` pertama:
   - `preprocess()` — resize gambar ke ukuran input model (misal 224x224), normalisasi RGB
   - `postprocess()` — ubah output tensor jadi daftar label + confidence score
   - `renderInputConfig()` / `renderResultVisualization()` — komponen React sederhana
2. **Hubungkan `web-client` ⇄ `core` ⇄ `inference-engine`**:
   - Komponen uploader model (`.onnx`) & label (`.txt`)
   - Komponen uploader gambar input
   - Tombol "Jalankan Inferensi" yang memanggil `pluginManager` + `onnxRunner`
   - Tampilkan hasil confidence score di UI
3. **Rapikan resolusi module `@infera/core`** (lihat catatan teknis di atas) agar tidak lagi pakai workaround relative import.
4. Tulis unit test pertama (Vitest) untuk `validateModelFile()` dan `PluginManager` di `packages/core`.
5. Setup IndexedDB (Dexie.js) di `web-client/src/db/` untuk histori inferensi (boleh ditunda ke Tahap 3 sesuai roadmap, tapi skema dasar bisa disiapkan lebih awal).

---

## Referensi
- Dokumen acuan: `universal_inference_platform_tdd.md`
- Repo: https://github.com/FahroziAldinata/InFera-universal-inference-platform
