---
layout: home

hero:
  name: "InFera"
  text: "Universal Inference Platform"
  tagline: Platform inferensi machine learning yang berjalan langsung di browser — browser-first, framework-agnostic, dipercepat WebGPU dengan fallback WASM otomatis.
  image:
    src: /logo.svg
    alt: InFera Logo
  actions:
    - theme: brand
      text: Mulai Sekarang →
      link: /guide/getting-started
    - theme: alt
      text: Lihat di GitHub
      link: https://github.com/FahroziAldinata/InFera-universal-inference-platform

features:
  - icon: 🌐
    title: Browser-First
    details: Tidak ada server, tidak ada instalasi Python. Jalankan model ONNX secara langsung di browser pengguna dengan inferensi sepenuhnya client-side.

  - icon: ⚡
    title: WebGPU Accelerated
    details: Memanfaatkan WebGPU untuk akselerasi hardware GPU penuh. Fallback otomatis ke WebAssembly (WASM) ketika WebGPU tidak tersedia.

  - icon: 🔌
    title: Plugin Architecture
    details: Sistem plugin yang dapat dikembangkan. Tambahkan plugin object detection, image classification, atau buat plugin kustom Anda sendiri.

  - icon: 📦
    title: Universal Model Package (UAMP)
    details: Format paket model `.zip` yang mandiri — satu file berisi bobot ONNX, label, konfigurasi, dan metadata. Dengan proteksi keamanan ZIP Slip dan ZIP Bomb.

  - icon: 🎯
    title: Framework Agnostic
    details: Bekerja dengan React, Vue, Angular, Svelte, atau vanilla JavaScript. Tidak ada ketergantungan pada framework tertentu.

  - icon: 🔒
    title: Sepenuhnya Private
    details: Data pengguna tidak pernah meninggalkan browser. Inferensi dilakukan sepenuhnya secara lokal tanpa mengirimkan data ke server manapun.

  - icon: 📊
    title: Benchmark Real-time
    details: Lacak latensi preprocessing, inference, dan postprocessing, FPS throughput, serta jejak memori heap secara real-time.

  - icon: 🖼️
    title: Canvas Overlay
    details: Visualisasi bounding box resolusi tinggi dengan dukungan Retina/DPI otomatis, animasi seleksi rAF, dan hitbox interaktif.
---

<div style="text-align: center; margin-top: 48px; padding: 32px; background: var(--vp-c-bg-soft); border-radius: 16px; border: 1px solid var(--vp-c-border);">
  <p style="color: var(--vp-c-text-2); font-size: 0.9rem; margin: 0;">
    Dibuat oleh <strong>Fahrozi Aldinata</strong> dengan dukungan AI.
    Dirilis di bawah <a href="https://github.com/FahroziAldinata/InFera-universal-inference-platform/blob/main/LICENSE">Lisensi MIT</a>.
  </p>
</div>
