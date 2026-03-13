const PARAM_LABELS = {
  rr: 'Resp. Rate',
  spo2: 'SpO₂',
  sysBP: 'Systolic BP',
  hr: 'Heart Rate',
  consciousness: 'AVPU',
  temp: 'Temperature',
};

function scoreColor(score) {
  if (score === 0) return 'var(--risk-stable)';
  if (score === 1) return 'var(--risk-low)';
  if (score === 2) return 'var(--risk-medium)';
  return 'var(--risk-high)';
}

export default function News2Breakdown({ news2 }) {
  const scores = news2?.scores || {};
  const total = news2?.total ?? 0;
  const maxPossible = 3;

  return (
    <div className="card">
      <div className="card__header">
        <span className="card__title">NEWS2 Breakdown</span>
        <span className="card__badge" style={{ background: `${news2?.color || '#22c55e'}20`, color: news2?.color || '#22c55e' }}>
          {total} / 20
        </span>
      </div>
      <div className="news2-rows">
        {Object.entries(PARAM_LABELS).map(([key, label]) => {
          const score = scores[key] ?? 0;
          const pct = (score / maxPossible) * 100;
          const color = scoreColor(score);
          return (
            <div key={key} className="news2-row">
              <div className="news2-row__label">{label}</div>
              <div className="news2-row__bar-track">
                <div
                  className="news2-row__bar-fill"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
              <div className="news2-row__score" style={{ color }}>{score}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
