# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **@infera/plugin-object-detection (Phase 5 - 7)**:
  - Bounding Box and dynamic HSL color visualizer with auto Retina/DPI scaling.
  - Export capabilities for visualized canvas results (PNG, JPEG, DataURL).
  - Universal Model Package (UAMP) ZIP loader utilizing browser-native `fflate` with path traversal (Zip Slip) and Zip Bomb security checks.
  - Automatic WebGPU runtime capabilities detection with graceful WebAssembly (WASM) fallbacks.
  - Pre-inference & post-inference performance benchmarking metrics (FPS, preprocess/inference/postprocess latencies, heap memory footprint).
  - Multi-backend integration tests covering WASM, WebGPU, graceful fallbacks, and metrics suppression.
