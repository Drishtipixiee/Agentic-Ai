const VITAL_CONFIG = {
  rr:            { label: 'Resp. Rate', unit: 'bpm',  normal: [12, 20] },
  spo2:          { label: 'SpO₂',       unit: '%',    normal: [96, 100] },
  sysBP:         { label: 'Systolic BP',unit: 'mmHg', normal: [111, 219] },
  hr:            { label: 'Heart Rate', unit: 'bpm',  normal: [51, 90] },
  temp:          { label: 'Temp',       unit: '°C',   normal: [36.1, 38.0] },
  consciousness: { label: 'AVPU',       unit: '',     normal: ['Alert'] },
};

function getVitalColor(key, value, scoreVal) {
  if (scoreVal === 0) return 'var(--risk-stable)';
  if (scoreVal === 1) return 'var(--risk-low)';
  if (scoreVal === 2) return 'var(--risk-medium)';
  return 'var(--risk-high)';
}

function getScoreBg(score) {
  const map = {
    0: 'rgba(34,197,94,0.15)',
    1: 'rgba(132,204,22,0.15)',
    2: 'rgba(245,158,11,0.2)',
    3: 'rgba(239,68,68,0.2)',
  };
  return map[score] || 'rgba(255,255,255,0.05)';
}

export default function VitalsPanel({ vitals, news2 }) {
  if (!vitals) {
    return (
      <div className="card">
        <div className="card__header">
          <span className="card__title">Live Vitals</span>
        </div>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0', fontSize: 12 }}>
          Awaiting data stream…
        </div>
      </div>
    );
  }

  const scores = news2?.scores || {};
  const vitalKeys = ['rr', 'spo2', 'sysBP', 'hr', 'temp', 'consciousness'];

  return (
    <div className="card">
      <div className="card__header">
        <span className="card__title">Live Vitals</span>
        <span className="card__badge" style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--accent-blue)' }}>
          Real-Time
        </span>
      </div>
      <div className="vitals-grid">
        {vitalKeys.map(key => {
          const cfg = VITAL_CONFIG[key];
          const rawVal = vitals[key];
          const scoreVal = scores[key] ?? 0;
          const color = getVitalColor(key, rawVal, scoreVal);
          const display = key === 'temp'
            ? typeof rawVal === 'number' ? rawVal.toFixed(1) : '--'
            : rawVal ?? '--';

          return (
            <div
              key={key}
              className="vital-card"
              style={{ borderColor: scoreVal > 0 ? `${color}50` : 'var(--border-glass)' }}
            >
              <div className="vital-card__score" style={{ background: getScoreBg(scoreVal), color }}>
                {scoreVal}
              </div>
              <div className="vital-card__label">{cfg.label}</div>
              <div className="vital-card__value" style={{ color }}>
                {display}
              </div>
              <div className="vital-card__unit">{cfg.unit}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
