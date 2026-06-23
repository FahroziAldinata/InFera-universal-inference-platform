# =============================================================================
# verify-image-classification.ps1
# Jalankan dari ROOT folder Infera:
#   .\verify-image-classification.ps1
# =============================================================================

$pluginPath = "packages\plugins\image-classification"
$pass = 0
$fail = 0

function Check($label, $condition) {
    if ($condition) {
        Write-Host "  [OK] $label" -ForegroundColor Green
        $script:pass++
    } else {
        Write-Host "  [FAIL] $label" -ForegroundColor Red
        $script:fail++
    }
}

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host " Verifikasi: image-classification plugin" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "1. Struktur File & Folder" -ForegroundColor Yellow
# -----------------------------------------------------------------------------

Check "Folder plugin ada" (Test-Path $pluginPath)
Check "package.json ada" (Test-Path "$pluginPath\package.json")
Check "tsconfig.json ada" (Test-Path "$pluginPath\tsconfig.json")
Check "src\types.ts ada" (Test-Path "$pluginPath\src\types.ts")
Check "src\plugin.ts ada" (Test-Path "$pluginPath\src\plugin.ts")
Check "src\index.ts ada" (Test-Path "$pluginPath\src\index.ts")

# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "2. package.json - Konten" -ForegroundColor Yellow
# -----------------------------------------------------------------------------

$pkg = Get-Content "$pluginPath\package.json" -Raw | ConvertFrom-Json
Check "name = @infera/plugin-image-classification" ($pkg.name -eq "@infera/plugin-image-classification")
Check "dependency ke @infera/core ada" ($pkg.dependencies.'@infera/core' -eq "workspace:*")
Check "main mengarah ke src/index.ts" ($pkg.main -eq "src/index.ts")

# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "3. src\types.ts - Konten" -ForegroundColor Yellow
# -----------------------------------------------------------------------------

$types = Get-Content "$pluginPath\src\types.ts" -Raw
Check "ClassificationLabel dideklarasikan" ($types -match "ClassificationLabel")
Check "ClassificationResult dideklarasikan" ($types -match "ClassificationResult")
Check "ImageClassificationConfig dideklarasikan" ($types -match "ImageClassificationConfig")
Check "DEFAULT_CONFIG dideklarasikan" ($types -match "DEFAULT_CONFIG")
Check "inputWidth ada di config" ($types -match "inputWidth")
Check "inputHeight ada di config" ($types -match "inputHeight")
Check "topK ada di config" ($types -match "topK")
Check "normalize ada di config" ($types -match "normalize")

# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "4. src\plugin.ts - Struktur Dasar" -ForegroundColor Yellow
# -----------------------------------------------------------------------------

$plugin = Get-Content "$pluginPath\src\plugin.ts" -Raw
Check "Import dari @infera/core" ($plugin -match "@infera/core")
Check "Class ImageClassificationPlugin ada" ($plugin -match "class ImageClassificationPlugin")
Check "Implements InferencePlugin" ($plugin -match "implements InferencePlugin")
Check "id = image-classification" ($plugin -match "image-classification")
Check "supportedInputTypes mengandung image" ($plugin -match "'image'")
Check "supportedModelFormats mengandung onnx" ($plugin -match "'onnx'")
Check "Method init ada" ($plugin -match "async init")
Check "Method preprocess ada" ($plugin -match "async preprocess")
Check "Method postprocess ada" ($plugin -match "async postprocess")
Check "Method dispose ada" ($plugin -match "async dispose")
Check "Method loadLabels ada" ($plugin -match "loadLabels")
Check "Singleton imageClassificationPlugin ada" ($plugin -match "imageClassificationPlugin")

# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "5. src\plugin.ts - Logika preprocess" -ForegroundColor Yellow
# -----------------------------------------------------------------------------

Check "setInputShape ada" ($plugin -match "setInputShape")
Check "inputShape disimpan di state" ($plugin -match "private inputShape")
Check "Validasi format NCHW 4 dimensi" ($plugin -match "shape\.length !== 4")
Check "Pakai inputShape dari state bukan hardcode" ($plugin -match "this\.inputShape\[2\]")
Check "Gunakan OffscreenCanvas" ($plugin -match "OffscreenCanvas")
Check "drawImage untuk resize" ($plugin -match "drawImage")
Check "Ambil pixel data via getImageData" ($plugin -match "getImageData")
Check "Konversi ke Float32Array" ($plugin -match "Float32Array")
Check "Format output NCHW" ($plugin -match "1, 3, targetH, targetW")
Check "Normalisasi dibagi 255" ($plugin -match "255")
Check "Config normalize dihormati" ($plugin -match "this\.config\.normalize")
Check "Validasi input HTMLImageElement atau ImageBitmap" ($plugin -match "HTMLImageElement")

# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "6. src\plugin.ts - Logika postprocess" -ForegroundColor Yellow
# -----------------------------------------------------------------------------

Check "Validasi output bertipe Float32Array" ($plugin -match "Float32Array")
Check "Softmax diimplementasikan" ($plugin -match "softmax|Math\.exp")
Check "Trik max-subtraction untuk stabilitas numerik" ($plugin -match "maxScore|max-subtraction|Math\.max")
Check "Sort index descending" ($plugin -match "sort.*probabilities|probabilities.*sort")
Check "Ambil topK dari config" ($plugin -match "this\.config\.topK")
Check "Fallback label jika labels kosong" ($plugin -match "Class \$\{classIndex\}|Class.*classIndex")
Check "Rank dimulai dari 1" ($plugin -match "rank \+ 1|rank: rank")
Check "Return pluginId" ($plugin -match "pluginId: this\.id")
Check "Return rawOutputShape" ($plugin -match "rawOutputShape")
Check "Hitung executionTimeMs via performance.now" ($plugin -match "performance\.now")

# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "7. src\index.ts - Ekspor" -ForegroundColor Yellow
# -----------------------------------------------------------------------------

$index = Get-Content "$pluginPath\src\index.ts" -Raw
Check "Export ImageClassificationPlugin" ($index -match "ImageClassificationPlugin")
Check "Export imageClassificationPlugin" ($index -match "imageClassificationPlugin")
Check "Export ClassificationResult" ($index -match "ClassificationResult")
Check "Export DEFAULT_CONFIG" ($index -match "DEFAULT_CONFIG")

# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "8. pnpm-workspace.yaml - Plugin terdaftar" -ForegroundColor Yellow
# -----------------------------------------------------------------------------

$workspace = Get-Content "pnpm-workspace.yaml" -Raw
Check "plugins/* terdaftar di workspace" ($workspace -match "plugins")

# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
$color = if ($fail -eq 0) { "Green" } else { "Red" }
Write-Host " HASIL: $pass OK  |  $fail GAGAL" -ForegroundColor $color
Write-Host "=======================================" -ForegroundColor Cyan

if ($fail -gt 0) {
    Write-Host ""
    Write-Host "Ada $fail item yang perlu diperbaiki sebelum lanjut." -ForegroundColor Red
} else {
    Write-Host ""
    Write-Host "Plugin image-classification selesai! Siap lanjut ke web-client." -ForegroundColor Green
}
Write-Host ""