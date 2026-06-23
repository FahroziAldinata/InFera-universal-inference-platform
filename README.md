# InFera — Universal Inference Platform

InFera is a browser-first, framework-agnostic, and light-weight machine learning inference platform designed to run ONNX models natively in the client browser with WebGPU acceleration and WASM fallbacks.

## Project Structure

This monorepo uses Turborepo and `pnpm` workspace structure:

- **`apps/web-client`**: A web application built with React + Vite + TypeScript to run browser inference MVP.
- **`packages/core`**: Base types, validation helpers, and plugin managers.
- **`packages/inference-engine`**: Low-level ONNX Runtime wrapper for launching and disposing sessions.
- **`packages/plugins/image-classification`**: Plugin for running MobileNet-based image classification tasks.
- **`packages/plugins/object-detection`**: High-performance plugin for YOLOv5/v8 object detection with canvas overlay visualizers, ZIP model loaders (UAMP), WebGPU execution, and benchmarks.

## Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- `pnpm` (v11.8.0 recommended)

### Installation

```bash
pnpm install
```

### Commands

```bash
# Build all packages in the workspace
pnpm build

# Run type check on all workspace packages
pnpm typecheck

# Run test suites in all workspace packages
pnpm test
```
