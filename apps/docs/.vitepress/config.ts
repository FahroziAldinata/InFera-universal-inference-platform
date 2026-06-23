import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'id-ID',
  title: 'InFera',
  description: 'Platform inferensi machine learning universal untuk browser — browser-first, framework-agnostic, WebGPU-accelerated.',

  base: '/InFera-universal-inference-platform/',

  ignoreDeadLinks: true,

  head: [
    ['link', { rel: 'icon', href: '/InFera-universal-inference-platform/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#6366f1' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'InFera — Universal Inference Platform' }],
    ['meta', { property: 'og:description', content: 'Platform inferensi ML browser-first dengan WebGPU acceleration dan WASM fallback.' }],
  ],

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'InFera',

    nav: [
      { text: 'Panduan', link: '/guide/getting-started' },
      { text: 'Plugin', items: [
        { text: 'Object Detection', link: '/plugins/object-detection' },
        { text: 'Image Classification', link: '/plugins/image-classification' },
      ]},
      { text: 'API', link: '/api/' },
      { text: 'UAMP', link: '/uamp/' },
      { text: 'Changelog', link: '/changelog/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Panduan',
          items: [
            { text: 'Memulai', link: '/guide/getting-started' },
            { text: 'Arsitektur', link: '/guide/architecture' },
          ],
        },
      ],
      '/plugins/': [
        {
          text: 'Plugin',
          items: [
            { text: 'Object Detection', link: '/plugins/object-detection' },
            { text: 'Image Classification', link: '/plugins/image-classification' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Ringkasan', link: '/api/' },
            { text: '@infera/core', link: '/api/core' },
            { text: '@infera/inference-engine', link: '/api/inference-engine' },
            { text: '@infera/plugin-object-detection', link: '/api/plugin-object-detection' },
            { text: '@infera/plugin-image-classification', link: '/api/plugin-image-classification' },
          ],
        },
      ],
      '/uamp/': [
        {
          text: 'UAMP',
          items: [
            { text: 'Spesifikasi', link: '/uamp/' },
          ],
        },
      ],
      '/benchmark/': [
        {
          text: 'Benchmark',
          items: [
            { text: 'Hasil Pengujian', link: '/benchmark/' },
          ],
        },
      ],
      '/browser-compat/': [
        {
          text: 'Kompatibilitas',
          items: [
            { text: 'Browser Compatibility', link: '/browser-compat/' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/FahroziAldinata/InFera-universal-inference-platform' },
    ],

    footer: {
      message: 'Dirilis di bawah lisensi MIT.',
      copyright: 'Copyright © 2025–2026 Fahrozi Aldinata',
    },

    editLink: {
      pattern: 'https://github.com/FahroziAldinata/InFera-universal-inference-platform/edit/main/apps/docs/:path',
      text: 'Edit halaman ini di GitHub',
    },

    search: {
      provider: 'local',
    },

    docFooter: {
      prev: 'Halaman Sebelumnya',
      next: 'Halaman Berikutnya',
    },

    lastUpdated: {
      text: 'Terakhir diperbarui',
    },
  },

  markdown: {
    lineNumbers: true,
  },
})
