# Panduan Rilis — InFera

Dokumen ini menjelaskan proses rilis versi baru InFera secara lengkap.

---

## Prasyarat

Pastikan hal berikut sudah dikonfigurasi sebelum melakukan rilis:

- [ ] Akses push ke branch `main`
- [ ] npm account dengan akses ke scope `@infera`
- [ ] GitHub repository secret `NPM_TOKEN` sudah dikonfigurasi
- [ ] Semua test, typecheck, build, dan lint lulus

---

## Proses Rilis

### 1. Pastikan Branch `main` Bersih

```bash
git checkout main
git pull origin main
git status
```

Expected output:
```
On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean
```

### 2. Jalankan Validasi Lengkap

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm lint
pnpm docs:build
```

Semua perintah harus **lulus tanpa error** sebelum melanjutkan.

### 3. Bump Versi Package

Edit file `package.json` di setiap package untuk memperbarui versi:

| Package | File |
|---|---|
| `@infera/core` | `packages/core/package.json` |
| `@infera/inference-engine` | `packages/inference-engine/package.json` |
| `@infera/plugin-object-detection` | `packages/plugins/object-detection/package.json` |
| `@infera/plugin-image-classification` | `packages/plugins/image-classification/package.json` |

Ikuti [Semantic Versioning](https://semver.org/):
- **PATCH** (`0.2.0` → `0.2.1`): Bug fixes
- **MINOR** (`0.2.0` → `0.3.0`): Fitur baru, backward compatible
- **MAJOR** (`0.2.0` → `1.0.0`): Breaking changes

### 4. Update CHANGELOG.md

Pindahkan entri dari `[Unreleased]` ke bagian baru dengan versi dan tanggal:

```markdown
## [0.3.0] — 2026-MM-DD

### Ditambahkan
- ...
```

### 5. Commit Perubahan Versi

```bash
git add packages/*/package.json packages/plugins/*/package.json CHANGELOG.md
git commit -m "chore: bump version to v0.3.0"
```

### 6. Buat Git Tag

```bash
git tag -a v0.3.0 -m "Release v0.3.0"
```

### 7. Push ke GitHub

```bash
git push origin main
git push origin v0.3.0
```

GitHub Actions workflow `release.yml` akan otomatis:
1. Build semua package
2. Jalankan typecheck dan test
3. Publish setiap package ke npm registry

### 8. Verifikasi Rilis

Setelah workflow selesai, verifikasi:

```bash
# Verifikasi di npm registry
npm view @infera/core version
npm view @infera/inference-engine version
npm view @infera/plugin-object-detection version
npm view @infera/plugin-image-classification version
```

Verifikasi di GitHub:
- Buka tab **Actions** → pastikan workflow Release berhasil
- Buka tab **Releases** → buat release notes baru

---

## Konfigurasi NPM_TOKEN di GitHub

Untuk mengaktifkan publish otomatis ke npm:

1. Generate npm access token:
   - Login ke [npmjs.com](https://www.npmjs.com)
   - Buka **Account Settings → Access Tokens**
   - Klik **Generate New Token → Classic Token**
   - Pilih tipe **Automation**
   - Salin token yang dihasilkan

2. Tambahkan ke GitHub Secrets:
   - Buka repository GitHub
   - Buka **Settings → Secrets and variables → Actions**
   - Klik **New repository secret**
   - Name: `NPM_TOKEN`
   - Value: (paste token npm Anda)

---

## Dry Run (Pengujian Tanpa Publish)

Untuk memverifikasi konten paket tanpa benar-benar publish:

```bash
# Verifikasi konten bundle
npm pack --dry-run --workspaces
```

Atau per package:
```bash
cd packages/core && npm pack --dry-run
cd packages/inference-engine && npm pack --dry-run
cd packages/plugins/object-detection && npm pack --dry-run
cd packages/plugins/image-classification && npm pack --dry-run
```

---

## Rollback

Jika rilis bermasalah:

```bash
# Hapus tag lokal
git tag -d v0.3.0

# Hapus tag remote
git push origin --delete v0.3.0

# Deprecate versi di npm (JANGAN unPublish kecuali sangat mendesak)
npm deprecate @infera/plugin-object-detection@0.3.0 "Versi ini memiliki bug kritis, gunakan v0.3.1"
```

---

*Dokumen dibuat oleh Fahrozi Aldinata.*
