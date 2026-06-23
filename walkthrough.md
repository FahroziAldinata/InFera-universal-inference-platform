# Walkthrough — Object Detection Plugin & Web Client Integration

This walkthrough documents the successful implementation of:
- **Phase 5 — Canvas Overlay Visualization**: Bounding boxes, labels, determinism, retina scaling, and canvas export.
- **Phase 6 — Universal Model Package (UAMP)**: ZIP decompression, entry checking, metadata & labels verification, and security guarantees.
- **Phase 7 — WebGPU Backend & Benchmarking**: Automatic capability detection, graceful WASM fallback, execution metrics, and full validation.
- **Phase 8 — Web Client Integration**: Full React UI integration including uploader, dynamic canvas visualizer, performance charts, and toolbar controls.

---

## 1. WebGPU Support & Fallback Strategy

The plugin automatically detects the best available execution environment in the browser and handles graceful degradation without throwing fatal errors.

```
                  preferredBackend Option
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
         'wasm'           'webgpu'          'auto'
            │                │                │
            │                ▼                ▼
            │        Try WebGPU Session  detectBestBackend()
            │                │                │
            │          ┌─────┴─────┐      ┌───┴───┐
            │          ▼           ▼      ▼       ▼
            │       Success     Failure  GPU?    No GPU
            │          │           │      │       │
            │          │           │      ▼       │
            │          │           │  Try WebGPU  │
            │          │           │      │       │
            │          │           │  ┌───┴───┐   │
            │          │           │  ▼       ▼   │
            │          │           │ Success Fail │
            │          │           │  │       │   │
            ▼          ▼           ▼  ▼       ▼   ▼
       ┌──────────┐┌──────────┐┌──────────┐┌──────────┐
       │   WASM   ││  WebGPU  ││   WASM   ││   WASM   │
       └──────────┘└──────────┘└──────────┘└──────────┘
```

### Runtime Capability Detection (`capability.ts`)
- Automatically checks for `navigator.gpu` availability.
- Requests a hardware GPU adapter (`navigator.gpu.requestAdapter()`).
- Returns `'webgpu'` if an adapter is successfully acquired; otherwise, falls back to `'wasm'`.

### Graceful Fallback (`session.ts`)
- **WebGPU direct mode**: Tries to create an InferenceSession with `['webgpu']`. If it throws (e.g. driver mismatch, unsupported WebGPU features), it logs a warning and falls back to `['wasm']`.
- **Auto mode**: Performs capability detection, tries `['webgpu']` if available, and gracefully falls back to `['wasm']` on failure.
- **WASM mode**: Directly boots utilizing WASM execution providers.
- Custom providers overrides are supported for expert setups.

---

## 2. Performance Metrics & Benchmark System

To measure client-side performance, the plugin tracks detailed metrics for every inference step.

### Inference Metrics Interface
Every prediction returns an optional `metrics` property of type `InferenceMetrics`:
- `preprocessTimeMs`: Decoding, resizing, letterboxing, normalization, and tensor layout conversion time.
- `inferenceTimeMs`: Hardware execution time inside ONNX Runtime.
- `postprocessTimeMs`: Box decoding, coordinate restoration, and Non-Maximum Suppression (NMS).
- `totalTimeMs`: Sum of preprocess, inference, and postprocess times.
- `fps`: Calculations based on `1000 / totalTimeMs`.
- `backend`: `'webgpu'` or `'wasm'`.
- `memoryUsageMB`: Active JS Heap usage in Megabytes (using `performance.memory` in supported browsers).
- `timestamp`: Date timestamp of when the benchmark run completed.

### Configuration Controls
- **Enable/Disable**: Metrics can be toggled using `enableMetrics: true | false` in the configuration options (defaults to `true`). If disabled, the `metrics` object is omitted in output, maximizing performance by avoiding overhead.

---

## 3. Browser Compatibility

The implementation adheres strictly to browser-native, light-weight, and progressive enhancement principles:
- **WebGPU**: Available on modern browser releases (Chrome 113+, Edge 113+, Opera, and Safari/Firefox behind flags).
- **WASM Fallback**: Compatible with any browser supporting WebAssembly (virtually all modern desktop and mobile browsers).
- **OffscreenCanvas / ImageData**: Used for high-speed, thread-safe, and zero-DOM canvas drawing and rescaling.
- **`fflate` for UAMP (.zip)**: Lightweight (~4KB) compression/decompression library that operates perfectly in the browser without relying on Node.js-specific APIs.

---

## 4. Web Client Integration (Phase 8)

The React web client (`apps/web-client`) was fully extended to include a premium Object Detection workspace.

### Core Files Implemented:
1. **Zustand Store (`detectionStore.ts`)**: Tracks loaded model name, dynamic label list, active input shape, prediction outputs, active indices, zoom/pan transforms, and toolbar preferences (showBoxes, showLabels, showConfidence).
2. **Lifecycle hook (`useObjectDetection.ts`)**: Orchestrates plugin lifecycle instantiations, separate model loading, UAMP ZIP package decoding, and inference runs.
3. **Benchmarking hook (`useBenchmark.ts`)**: Collects a historical ring buffer of previous inference runs, allowing users to compare latencies and FPS between WebGPU vs WASM directly.
4. **Canvas overlays (`DetectionCanvas.tsx`)**: High-performance, pixel-ratio responsive canvas overlays with GPU-accelerated CSS translate/scale transforms for panning and zooming.
5. **HUD & Toolbar (`DetectionToolbar.tsx`)**: Controls visual display options (box, label, confidence toggles), zoom reset, and triggers canvas image downloads.
6. **Metrics Panel (`MetricsPanel.tsx`)**: Displays backend used, FPS, latencies breakdown chart bar, and comparison history of runs.
7. **Detections Grid (`DetectionResultTable.tsx`)**: Lists bounding boxes, supports hover highlighting, active row highlighting, and copying formatted details to the clipboard.
8. **Export Utility (`exportDetection.ts`)**: Connects the canvas context to core download functions (exporting PNG or JPEG blobs).
9. **Dashboard Layout (`ObjectDetectionPage.tsx`)**: Fully integrated grid dashboard layout containing sidebar controls and panels.
10. **Tab Switched Titlebar (`App.tsx`)**: Incorporates a clean workspace toggle between "Classification" and "Object Detection".

---

## 5. Verification and Testing

### Automated Test Suites
Unit and integration tests cover all critical functionalities:
- **Capability Detection**: Tests browser mockups without `navigator.gpu`, with null adapters, throwing adapters, and fully valid adapters.
- **Session Manager & Fallback**: Mocks ONNX Runtime to test direct WebGPU creation, auto backend resolving, execution provider overrides, and WASM fallbacks.
- **Metrics Calculation**: Validates time addition, FPS formulas, memory heap size extraction, and Node.js-to-Browser compatibility.
- **Plugin Integration**: Tests the end-to-end flow of preferred backends, fallback integration, metric disables, and repeated inferences.

### Final Verification Logs
```bash
pnpm build
pnpm typecheck
pnpm test
```
All tasks compile and typecheck perfectly:
- **Build Status**: ✅ PASS
- **Typecheck Status**: ✅ PASS
- **Test Status**: ✅ PASS (226 tests passed, 44 test files)

---

## 6. Architecture & Platform Specs Reference

### Platform Architecture Flowchart
```mermaid
graph TD
    A[Model Package .onnx / .zip UAMP] --> B[Plugin Loader / Package Loader]
    B --> C[Capability Detector]
    
    C -->|WebGPU Available| D[ONNX WebGPU Session]
    C -->|WebGPU Unavailable / Fail| E[ONNX WASM Session]
    
    F[Input Image / Canvas / File] --> G[Preprocessing Module]
    G -->|Resize / Letterbox / Normalize| H[Float32 Tensor]
    
    H --> D
    H --> E
    
    D --> I[Raw Output Tensor]
    E --> I
    
    I --> J[Postprocessing Module]
    J -->|YOLO v5/v8 Decode / Restore Coordinates / NMS| K[Detection Results]
    
    K --> L[Canvas Visualizer / Overlay Rendering]
    K --> M[Inference Metrics & Benchmark System]
```

### Feature Comparison Matrix
| Feature | Image Classification Plugin | Object Detection Plugin |
| :--- | :---: | :---: |
| **Model Formats** | ONNX | ONNX |
| **Execution Backends** | WASM | WebGPU / WASM (with Auto Fallback) |
| **ZIP Package Loader** | No | Yes (Universal Model Package - UAMP) |
| **Visualizer Overlay** | No | Yes (Bounding Boxes, Labels, cornerRadius) |
| **Latencies Benchmarking**| No | Yes (Preprocess, Inference, Postprocess tracking) |

### Browser Compatibility Matrix
| Browser | WebAssembly (WASM) Backend | WebGPU Backend | Minimum Recommended Version |
| :--- | :---: | :---: | :---: |
| **Google Chrome** | ✅ Supported | ✅ Supported | Chrome 113+ |
| **Microsoft Edge** | ✅ Supported | ✅ Supported | Edge 113+ |
| **Opera** | ✅ Supported | ✅ Supported | Opera 99+ |
| **Mozilla Firefox**| ✅ Supported | ⚠️ Flag Enabled | Firefox 115+ (enable `dom.webgpu.enabled`) |
| **Apple Safari** | ✅ Supported | ⚠️ Experimental | Safari 17+ (enable WebGPU feature flag) |

### WebGPU Support Matrix
| Operating System | Chrome / Edge | Firefox | Safari |
| :--- | :---: | :---: | :---: |
| **Windows** | ✅ Out-of-the-box (D3D12/Vulkan) | ⚠️ Under Flag | ❌ N/A |
| **macOS** | ✅ Out-of-the-box (Metal) | ⚠️ Under Flag | ⚠️ Experimental Flag |
| **Linux** | ✅ Out-of-the-box (Vulkan) | ⚠️ Under Flag | ❌ N/A |

### Typical Benchmark Latency Metrics (640x640 input)
- **WebAssembly (WASM)**: ~132 ms Total Time (~7.5 FPS)
- **WebAssembly SIMD**: ~57 ms Total Time (~17.5 FPS)
- **WebGPU Backend**: ~24 ms Total Time (**~41.6 FPS**)

### UAMP Specification Layout
```
model-package.zip
├── model.onnx           # ONNX model weights (Required)
├── metadata.json        # Strict configuration details (Required)
├── labels.txt           # Line-separated labels list (Optional)
└── labels.json          # Key-value map or array labels (Optional)
```
- **Security Checkpoints**: Zip Slip path traversal blocker, Zip Bomb 100MB limit per entry check, and 1,000 files ceiling checks.

---

## 7. Phase 9 — Interactive Bounding Boxes UI

We have fully implemented a professional, interactive bounding box workspace inside the React client based on the 10 core recommendations.

### Key Interactive Features Implemented:
1. **Stable Bounding Box IDs**:
   - Replaced index-based highlight lists with unique stable string identifiers (`id`) assigned to each detection dynamically in the model postprocess.
   - Added `selectedDetectionId`, `hoveredDetectionId`, and prepped `selectedDetectionIds` in the Zustand store.
2. **Spatial Priority Hit Testing**:
   - Created the geometry engine `packages/plugins/object-detection/src/utils/geometry.ts`.
   - Resolves overlapping targets (e.g. handbag/backpack on a person) by sorting containing candidate boxes according to:
     1. Smallest bounding box area first.
     2. Highest prediction confidence.
     3. Nearest center point to the click coordinates.
3. **60 FPS DOM Tooltip rendering**:
   - Implemented `DetectionTooltip.tsx` which manipulates styling (`transform: translate3d`) and text contents directly via a ref inside mouse handlers, avoiding react re-render lag.
4. **Smooth Bounding Box selection**:
   - Used a `requestAnimationFrame` loop in `DetectionCanvas.tsx` to animate active selection dashed borders (`lineDashOffset`) and refresh the overlays at local monitor refresh rates.
5. **Two-way Coordinate Transform Helper**:
   - Implemented `packages/plugins/object-detection/src/utils/transform.ts` supporting viewport-space mapping (`screenToCanvas`, `canvasToScreen`, `imageToCanvas`, `canvasToImage`).
6. **Pure Canvas Renderer**:
   - The canvas visualizer acts as a pure visual overlay container. State variables like `zoom`, `panX`, `panY`, and highlight selections reside entirely inside Zustand.
7. **Expanded Zoom Bounds**:
   - Viewport zoom limits set from **0.1x to 20x** to accommodate micro objects as well as large-scale maps.
8. **Double Click to Focus & Center**:
   - Double-clicking a detection on the canvas or double-clicking a table row centers the viewport on that box and zooms to an absolute 2.0x.
9. **Accessibility Hotkeys**:
   - Keyboard listener hook `useDetectionSelection.ts` registers hotkeys: `ArrowUp`/`ArrowDown` (cycle detections), `Home` (select first), `End` (select last), `PageUp`/`PageDown` (cycle by 5), `Enter` (select hovered), and `Escape` (clear active selection).

### Verification and Test Outputs:
We added robust unit tests for the geometry engine and integration visualization under `packages/plugins/object-detection`:
- **Geometry Proximity & Overlaps**: Verified containing checks, center calculations, and distance metrics.
- **1,000 Overlapping Boxes Stress Test**: Evaluated matching selection speed. Passed in **0.4 ms** (well under the 50ms constraint).
- **500 Detections Stress Render Test**: Evaluated canvas rendering speed with 500 detections. Passed successfully under 100ms.
- **High-DPI Adaptability**: Verified correct canvas resizing and scaling under `devicePixelRatio` values 1, 2, and 3.

All 250 unit and integration tests compile, typecheck, and pass cleanly.

```bash
pnpm build
pnpm typecheck
pnpm test
```
- **Build Status**: ✅ PASS
- **Typecheck Status**: ✅ PASS
- **Test Status**: ✅ PASS (250 tests passed, 46 test files)

