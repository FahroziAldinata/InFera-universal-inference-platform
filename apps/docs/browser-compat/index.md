# Kompatibilitas Browser

Halaman ini mendokumentasikan kompatibilitas InFera dengan berbagai browser dan platform.

## Tabel Kompatibilitas Utama

| Browser | Backend WASM | Backend WebGPU | Versi Minimum Direkomendasikan |
|---|:---:|:---:|---|
| **Google Chrome** | ✅ Didukung | ✅ Didukung | Chrome 113+ |
| **Microsoft Edge** | ✅ Didukung | ✅ Didukung | Edge 113+ |
| **Opera** | ✅ Didukung | ✅ Didukung | Opera 99+ |
| **Mozilla Firefox** | ✅ Didukung | ⚠️ Perlu Flag | Firefox 115+ (aktifkan `dom.webgpu.enabled`) |
| **Apple Safari** | ✅ Didukung | ⚠️ Eksperimental | Safari 17+ (aktifkan WebGPU feature flag) |
| **Mobile Chrome (Android)** | ✅ Didukung | ✅ Didukung | Chrome 121+ |
| **Mobile Safari (iOS)** | ✅ Didukung | ⚠️ Eksperimental | iOS 17+ |

## Tabel Dukungan WebGPU per Platform

| Sistem Operasi | Chrome / Edge | Firefox | Safari |
|---|:---:|:---:|:---:|
| **Windows** | ✅ Out-of-the-box (D3D12/Vulkan) | ⚠️ Under Flag | ❌ N/A |
| **macOS** | ✅ Out-of-the-box (Metal) | ⚠️ Under Flag | ⚠️ Flag Eksperimental |
| **Linux** | ✅ Out-of-the-box (Vulkan) | ⚠️ Under Flag | ❌ N/A |
| **Android** | ✅ Out-of-the-box (Vulkan) | ❌ N/A | ❌ N/A |
| **iOS / iPadOS** | ❌ N/A | ❌ N/A | ⚠️ Flag Eksperimental |

## Mengaktifkan WebGPU di Firefox

WebGPU di Firefox masih dalam tahap pengembangan. Untuk mengaktifkannya:

1. Buka `about:config` di address bar Firefox
2. Cari `dom.webgpu.enabled`
3. Set nilai ke `true`
4. Restart Firefox

> [!NOTE]
> InFera akan otomatis fallback ke WASM jika WebGPU tidak tersedia, sehingga aplikasi tetap berfungsi meskipun tanpa mengaktifkan flag ini.

## Mengaktifkan WebGPU di Safari

1. Buka **Preferences → Advanced**
2. Aktifkan **Show Develop menu in menu bar**
3. Buka menu **Develop → Experimental Features**
4. Aktifkan **WebGPU**

## Strategi Fallback Otomatis

InFera mengimplementasikan progressive enhancement secara otomatis:

```
WebGPU tersedia?
  ├── Ya  → Gunakan WebGPU backend (performa maksimal)
  └── Tidak → WASM SIMD tersedia?
                ├── Ya  → Gunakan WASM SIMD (performa baik)
                └── Tidak → Gunakan WASM standard (kompatibilitas universal)
```

Tidak diperlukan konfigurasi tambahan. Cukup set `preferredBackend: 'auto'`.

## Fitur yang Membutuhkan Browser Modern

| Fitur | API Browser | Versi Minimum |
|---|---|---|
| WebGPU Inference | WebGPU API | Chrome 113+ |
| WASM Inference | WebAssembly | Semua browser modern |
| ZIP Decompression | Streams API + fflate | Semua browser modern |
| IndexedDB Cache | IndexedDB API | Semua browser modern |
| Canvas Overlay | Canvas 2D API | Semua browser modern |
| Web Worker Post-processing | Web Workers | Semua browser modern |

## Pengujian Kompatibilitas

Untuk memverifikasi kompatibilitas di browser Anda, jalankan:

```typescript
import { detectCapabilities } from '@infera/inference-engine';

const caps = await detectCapabilities();
console.log({
  webgpu: caps.webgpu,      // true/false
  wasmSimd: caps.wasmSimd,  // true/false
  wasm: caps.wasm,          // true/false
  backend: caps.recommended // 'webgpu' | 'wasm'
});
```
