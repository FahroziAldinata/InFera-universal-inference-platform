# Panduan Deployment — InFera

Dokumen ini menjelaskan cara men-deploy website dokumentasi InFera ke GitHub Pages.

---

## Cara Kerja Deployment

Dokumentasi InFera di-deploy secara otomatis menggunakan GitHub Actions setiap kali ada push ke branch `main`.

```
Push ke main
    │
    ▼
GitHub Actions (.github/workflows/docs.yml)
    │
    ├── Install dependencies (pnpm install)
    ├── Build all packages (pnpm build)
    ├── Generate API docs (pnpm docs:api)
    ├── Build VitePress (pnpm docs:build)
    │
    ▼
Deploy ke GitHub Pages
    │
    ▼
https://FahroziAldinata.github.io/InFera-universal-inference-platform/
```

---

## Setup Awal GitHub Pages

Lakukan setup ini **sekali saja** sebelum deployment pertama:

### 1. Aktifkan GitHub Pages

1. Buka repository GitHub: `https://github.com/FahroziAldinata/InFera-universal-inference-platform`
2. Klik tab **Settings**
3. Di sidebar kiri, klik **Pages**
4. Di bagian **Source**, pilih **GitHub Actions**
5. Klik **Save**

### 2. Verifikasi Permissions

Pastikan workflow memiliki permission yang tepat. Di repository GitHub:
1. Buka **Settings → Actions → General**
2. Di bagian **Workflow permissions**, pilih **Read and write permissions**
3. Centang **Allow GitHub Actions to create and approve pull requests**
4. Klik **Save**

---

## Deployment Manual (Opsional)

Untuk trigger deployment tanpa push ke main:

1. Buka tab **Actions** di repository GitHub
2. Pilih workflow **Deploy Docs**
3. Klik **Run workflow**
4. Pilih branch `main`
5. Klik **Run workflow**

---

## Verifikasi Deployment

Setelah workflow selesai (~3-5 menit):

1. Buka tab **Actions** → pastikan semua step berwarna hijau ✅
2. Buka URL dokumentasi: `https://FahroziAldinata.github.io/InFera-universal-inference-platform/`
3. Verifikasi navigasi semua halaman berfungsi

---

## Build Lokal

Untuk mem-preview build dokumentasi secara lokal sebelum push:

```bash
# Generate API docs terlebih dahulu
pnpm docs:api

# Build VitePress
pnpm docs:build

# Preview build lokal (berjalan di http://localhost:4173)
pnpm docs:preview
```

---

## Troubleshooting

### Problem: Halaman 404 setelah deployment

**Penyebab**: Base URL belum dikonfigurasi dengan benar.

**Solusi**: Pastikan `base` di `apps/docs/.vitepress/config.ts` sesuai:
```typescript
base: '/InFera-universal-inference-platform/',
```

### Problem: Workflow gagal di step "Generate API docs"

**Penyebab**: TypeScript source tidak ter-build sebelum TypeDoc dijalankan.

**Solusi**: Pastikan step `pnpm build` berjalan sebelum `pnpm docs:api`.

### Problem: Assets (gambar, CSS) tidak muncul

**Penyebab**: Path relatif tidak memperhitungkan base URL.

**Solusi**: Gunakan path absolut dalam markdown:
```markdown
![Logo](/InFera-universal-inference-platform/logo.svg)
```
Atau gunakan sintaks VitePress untuk assets publik:
```markdown
![Logo](/logo.svg)
```
VitePress otomatis menambahkan base URL.

---

## Konfigurasi Custom Domain (Opsional)

Jika Anda memiliki domain custom:

1. Beli domain dari registrar (Namecheap, Cloudflare, dll.)
2. Tambahkan CNAME record: `docs.inferaplatform.com → FahroziAldinata.github.io`
3. Di repository GitHub **Settings → Pages → Custom domain**, masukkan domain Anda
4. Update `base` di `apps/docs/.vitepress/config.ts` menjadi `'/'`
5. Tambahkan file `apps/docs/public/CNAME` berisi nama domain Anda

---

*Dokumen dibuat oleh Fahrozi Aldinata.*
