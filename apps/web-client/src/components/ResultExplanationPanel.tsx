interface ResultExplanationPanelProps {
    label: string;
    confidence: number;
}

export function ResultExplanationPanel({ label, confidence }: ResultExplanationPanelProps) {
    const percentage = (confidence * 100).toFixed(1);
    
    // Determine Confidence Level
    let confidenceLevel = 'Rendah';
    let confidenceClass = 'confidence-low';
    if (confidence >= 0.75) {
        confidenceLevel = 'Tinggi';
        confidenceClass = 'confidence-high';
    } else if (confidence >= 0.40) {
        confidenceLevel = 'Sedang';
        confidenceClass = 'confidence-medium';
    }

    // Determine Explanation based on Class
    let explanationText = '';
    const cleanLabel = label.toLowerCase();
    
    if (cleanLabel.includes('cat')) {
        explanationText = 'Model mendeteksi bahwa gambar ini kemungkinan besar adalah seekor kucing karena mendeteksi karakteristik visual pendukung seperti bentuk telinga yang runcing, struktur wajah bulat, dan proporsi tubuh khas felidae.';
    } else if (cleanLabel.includes('dog')) {
        explanationText = 'Model mengidentifikasi objek sebagai anjing karena kecocokan visual pada bentuk moncong wajah yang khas, posisi telinga, dan pola bulu/postur tubuh secara umum.';
    } else if (cleanLabel.includes('bird')) {
        explanationText = 'Model mendeteksi indikasi burung berdasarkan visual paruh runcing, bentuk tubuh burung, dan keberadaan sayap atau tekstur bulu.';
    } else {
        explanationText = 'Model mendeteksi objek yang paling mirip dengan kelas ini berdasarkan pola visual yang dipelajari selama proses training.';
    }

    return (
        <div className="rp-section explanation-section">
            <div className="rp-section-header">
                <span className="rp-section-title">Analisis Hasil</span>
            </div>
            <div className="rp-section-body">
                <div className="explanation-card">
                    <div className="explanation-row">
                        <span className="explanation-label">Prediksi:</span>
                        <span className="explanation-value highlight">{label}</span>
                    </div>
                    <div className="explanation-row">
                        <span className="explanation-label">Akurasi:</span>
                        <span className="explanation-value highlight">{percentage}%</span>
                    </div>
                    <div className="explanation-row">
                        <span className="explanation-label">Tingkat Keyakinan:</span>
                        <span className={`explanation-value status-badge ${confidenceClass}`}>
                            {confidenceLevel}
                        </span>
                    </div>
                    
                    <div className="explanation-detail">
                        <span className="detail-header">Penjelasan:</span>
                        <p className="detail-body">{explanationText}</p>
                    </div>

                    <div className="explanation-notes">
                        <span className="notes-header">Catatan:</span>
                        <p className="notes-body">
                            Prediksi dapat berubah apabila:
                            <br />• gambar blur
                            <br />• pencahayaan buruk
                            <br />• objek tertutup
                            <br />• resolusi rendah
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
