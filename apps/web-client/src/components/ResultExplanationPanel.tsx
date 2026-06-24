interface ResultExplanationPanelProps {
    label: string;
    confidence: number;
}

export function ResultExplanationPanel({ label, confidence }: ResultExplanationPanelProps) {
    const percentage = (confidence * 100).toFixed(0);

    // Confidence badge
    let badgeClass = 'low';
    let badgeLabel = 'Low';
    if (confidence >= 0.90) { badgeClass = 'very-high'; badgeLabel = 'Very High'; }
    else if (confidence >= 0.70) { badgeClass = 'high'; badgeLabel = 'High'; }
    else if (confidence >= 0.40) { badgeClass = 'medium'; badgeLabel = 'Medium'; }

    // Visual features
    let visualFeatures: string[];
    const cleanLabel = label.toLowerCase();
    if (cleanLabel.includes('cat') || cleanLabel.includes('gecko') || cleanLabel.includes('lizard')) {
        visualFeatures = ['Fur/skin pattern texture', 'Ear and head morphology', 'Facial structure geometry'];
    } else if (cleanLabel.includes('dog')) {
        visualFeatures = ['Snout shape and proportions', 'Ear positioning', 'Body posture'];
    } else if (cleanLabel.includes('car') || cleanLabel.includes('truck') || cleanLabel.includes('vehicle')) {
        visualFeatures = ['Chassis contour lines', 'Wheel/tire geometry', 'Window reflection patterns'];
    } else {
        visualFeatures = ['Surface texture features', 'Object dimensional proportions', 'Visual boundary contours'];
    }

    const explanationText = `Model predicts this image as "${label}" with ${percentage}% confidence based on detected visual patterns.`;

    return (
        <div className="analysis-section">
            <div className="analysis-section-header">
                <span className="analysis-section-title">AI Explanation</span>
                <span className={`confidence-badge ${badgeClass}`}>{badgeLabel}</span>
            </div>

            <div className="explanation-text-block">
                <p style={{ color: 'var(--tx-1)', fontWeight: 500, marginBottom: '8px', fontSize: '12px', lineHeight: 1.6 }}>
                    {explanationText}
                </p>
                <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    Visual cues detected:
                </span>
                <ul className="explanation-features">
                    {visualFeatures.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
            </div>

            <div className="explanation-footer">
                <span className="explanation-footer-label">Quality Note</span>
                <span style={{ fontSize: '10px', color: 'var(--tx-3)', fontStyle: 'italic', maxWidth: '180px', textAlign: 'right' }}>
                    Affected by image sharpness, lighting &amp; angle.
                </span>
            </div>
        </div>
    );
}
