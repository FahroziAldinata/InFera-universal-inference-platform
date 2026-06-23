import { useRef } from 'react';
import { useInferenceStore } from '../store/inferenceStore';

export function ImageUploader() {
  const { step, imagePreviewUrl, setImageFile } = useInferenceStore();
  const inputRef = useRef<HTMLInputElement>(null);

  // Hanya aktif setelah model berhasil dimuat
  const isEnabled = step === 'model-ready' || step === 'image-ready' || step === 'done';

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setImageFile(file, previewUrl);
  }

  return (
    <div className={`card ${!isEnabled ? 'card-disabled' : ''}`}>
      <h2 className="card-title">2. Upload Gambar</h2>

      {!isEnabled ? (
        <p className="hint">Muat model terlebih dahulu.</p>
      ) : (
        <>
          <button
            className="upload-btn"
            onClick={() => inputRef.current?.click()}
          >
            {imagePreviewUrl ? 'Ganti gambar' : 'Pilih gambar'}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleChange}
          />

          {imagePreviewUrl && (
            <img
              src={imagePreviewUrl}
              alt="Preview input"
              className="image-preview"
            />
          )}
        </>
      )}
    </div>
  );
}