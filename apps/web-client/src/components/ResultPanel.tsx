import { useInferenceStore } from '../store/inferenceStore';

export function ResultPanel() {
  const { step, result, executionTimeMs, errorMessage } = useInferenceStore();

  if (step === 'error' && errorMessage) {
    return (
      <div className="card card-error">
        <h2 className="card-title">Error</h2>
        <p className="error-message">{errorMessage}</p>
      </div>
    );
  }

  if (step !== 'done' || !result) return null;

  return (
    <div className="card">
      <div className="result-header">
        <h2 className="card-title">3. Hasil Inferensi</h2>
        {executionTimeMs !== null && (
          <span className="execution-time">{executionTimeMs.toFixed(1)} ms</span>
        )}
      </div>

      <ul className="result-list">
        {result.topK.map((item) => (
          <li key={item.rank} className="result-item">
            {/* Rank badge */}
            <span className="result-rank">#{item.rank}</span>

            {/* Label + confidence bar */}
            <div className="result-bar-wrap">
              <div className="result-label-row">
                <span className="result-label">{item.label}</span>
                <span className="result-confidence">
                  {(item.confidence * 100).toFixed(2)}%
                </span>
              </div>
              <div className="result-bar-bg">
                <div
                  className="result-bar-fill"
                  style={{ width: `${(item.confidence * 100).toFixed(2)}%` }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}