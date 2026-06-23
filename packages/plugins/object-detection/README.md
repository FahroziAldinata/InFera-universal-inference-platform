# @infera/plugin-object-detection

Object Detection plugin for InFera Universal Inference Platform. Supports YOLOv5 and YOLOv8 models natively in the browser with WebGPU hardware acceleration, graceful WASM fallbacks, high-performance canvas overlays, and UAMP zip package loader support.

## Key Features

- **Auto Architecture Detection**: Dynamically supports YOLOv5 (`[1, N, 5+C]`) and YOLOv8 (`[1, 4+C, N]`) outputs based on shape analysis.
- **WebGPU Backend with WASM Fallback**: Leverages WebGPU for ultra-fast hardware acceleration when available. Gracefully degrades to WebAssembly (WASM) when drivers or browser flags are not present.
- **Universal Model Package (UAMP)**: Supports loading fully self-contained model archives (`.zip`) containing ONNX weights, labels mapping, model configurations, and documentation.
- **Safe ZIP Parsing**: Built-in protections against Zip Slip path traversal, Zip Bomb memory consumption, and extreme entry count limits.
- **Retina-Ready Canvas Overlay**: Draw high-performance bounding boxes, center points, and text labels directly onto elements, auto-adjusting for high-DPI displays.
- **Detailed Execution Benchmarks**: Track real-time preprocessing, model inference, and postprocessing latencies, FPS throughput, and heap memory footprint.

---

## Installation

```bash
pnpm install
```

---

## Configuration

Initialize the plugin with configuration parameters:

```ts
import { ObjectDetectionPlugin } from '@infera/plugin-object-detection';

const plugin = new ObjectDetectionPlugin({
    inputWidth: 640,
    inputHeight: 640,
    confidenceThreshold: 0.25,
    iouThreshold: 0.45,
    normalize: true,
    preferredBackend: 'auto',  // 'auto' | 'webgpu' | 'wasm'
    enableMetrics: true,      // Set to false to disable performance tracking
});
```

---

## Usage

### 1. Direct Model Loading
```ts
await plugin.init();
const modelFile = new File([/* ... */], 'yolov8n.onnx');
await plugin.loadModel(modelFile);
```

### 2. Loading UAMP Model Packages (.zip)
```ts
import { loadPackage } from '@infera/plugin-object-detection';

const zipFile = new File([/* ... */], 'yolov8n.zip');
const parsedPackage = await loadPackage(zipFile);

// Load the model weights and labels
await plugin.loadModel(parsedPackage.modelFile);
plugin.loadLabels(parsedPackage.labels.join('\n'));
plugin.setInputShape(parsedPackage.metadata.inputShape);
```

### 3. Prediction & Benchmarks
```ts
const imgInput = document.getElementById('my-image') as HTMLImageElement;
const result = await plugin.predict(imgInput);

console.log(result.detections);
// [ { classId: 0, className: 'person', confidence: 0.89, x: 10, y: 20, width: 100, height: 200 } ]

console.log(result.metrics);
// {
//   preprocessTimeMs: 1.2,
//   inferenceTimeMs: 14.5,
//   postprocessTimeMs: 0.8,
//   totalTimeMs: 16.5,
//   fps: 60.6,
//   backend: 'webgpu',
//   memoryUsageMB: 48.2
// }
```

### 4. Canvas Visualization Overlay
```ts
import { drawDetections } from '@infera/plugin-object-detection';

const canvas = document.getElementById('render-canvas') as HTMLCanvasElement;
const stats = drawDetections(canvas, result.detections, {
    drawCenterPoint: true,
    lineDash: [4, 4],
    cornerRadius: 8,
    labelPosition: 'top',
    fillOpacity: 0.15
});

console.log(`Rendered detections in ${stats.renderTimeMs}ms`);
```

---

## Browser Compatibility

- **WebGPU Acceleration**: Supported in Chrome 113+, Edge 113+, Opera, and Safari/Firefox with enabling flags.
- **WASM Fallback**: Compatible with all modern mobile and desktop web browsers supporting WebAssembly.
- **Decompression**: Fully client-side using `fflate` (~4KB, dependency-light).

---

## Test & Development

To compile TypeScript and run the verification suites:

```bash
# Build package
pnpm build

# Run type checking
pnpm typecheck

# Run test suite
pnpm test
```
