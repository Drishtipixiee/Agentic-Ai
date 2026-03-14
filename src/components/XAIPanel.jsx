const FEATURE_LABELS = {
  rr: 'Resp. Rate',
  spo2: 'SpO₂ Level',
  sysBP: 'Systolic BP',
  hr: 'Heart Rate',
  consciousness: 'Consciousness',
  temp: 'Temperature',
};

export default function XAIPanel({ shapWeights }) {
  const weights = shapWeights || {};
  const sorted = Object.entries(FEATURE_LABELS)
    .map(([key, label]) => ({ key, label, weight: weights[key] || 0 }))
    .sort((a, b) => b.weight - a.weight);

  const max = sorted[0]?.weight || 1;

  return (
    <div className="card">
      <div className="card__header">
        <span className="card__title">XAI — Feature Importance</span>
        <span className="card__badge" style={{ background: 'rgba(20,184,166,0.1)', color: 'var(--accent-teal)' }}>
          SHAP Proxy
        </span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
        Contribution of each vital sign to the current NEWS2 risk score
      </div>
      <div className="xai-bars">
        {sorted.map(({ key, label, weight }) => (
          <div key={key} className="xai-bar">
            <div className="xai-bar__label">{label}</div>
            <div className="xai-bar__track">
              <div
                className="xai-bar__fill"
                style={{ width: max > 0 ? `${(weight / max) * 100}%` : '2%' }}
              />
            </div>
            <div className="xai-bar__pct">{(weight * 100).toFixed(0)}%</div>
          </div>
        ))}
      </div>
      {Object.values(weights).every(v => v === 0) && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
          Equal distribution — patient is physiologically stable
        </div>
      )}
    </div>
  );
}
