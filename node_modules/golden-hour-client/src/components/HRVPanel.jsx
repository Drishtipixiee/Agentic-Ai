export default function HRVPanel({ hrv }) {
  if (!hrv) return (
    <div className="card">
      <div className="card__header"><span className="card__title">HRV Analysis</span></div>
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px 0', fontSize: 12 }}>
        Awaiting HRV data…
      </div>
    </div>
  );

  const sdnnRisk = hrv.sdnn < 50;
  const rmssdStatus = hrv.rmssd < 20 ? 'Critical' : hrv.rmssd < 40 ? 'Low' : 'Normal';
  const lfhfStatus = hrv.lfhf > 3 ? 'High' : hrv.lfhf > 2 ? 'Elevated' : 'Balanced';

  const sdnnColor = sdnnRisk ? 'var(--risk-high)' : hrv.sdnn < 100 ? 'var(--risk-medium)' : 'var(--risk-stable)';
  const rmssdColor = hrv.rmssd < 20 ? 'var(--risk-high)' : hrv.rmssd < 40 ? 'var(--risk-medium)' : 'var(--risk-stable)';
  const lfhfColor = hrv.lfhf > 3 ? 'var(--risk-high)' : hrv.lfhf > 2 ? 'var(--risk-medium)' : 'var(--accent-blue)';

  return (
    <div className="card">
      <div className="card__header">
        <span className="card__title">HRV Analysis</span>
        {sdnnRisk && (
          <span className="card__badge" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--risk-high)' }}>
            ⚠ Autonomic Risk
          </span>
        )}
      </div>
      <div className="hrv-grid">
        {/* SDNN */}
        <div className="hrv-metric">
          <div className="hrv-metric__value" style={{ color: sdnnColor }}>{hrv.sdnn}</div>
          <div className="hrv-metric__label">SDNN (ms)</div>
          <div className="hrv-metric__status" style={{
            background: sdnnRisk ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
            color: sdnnColor,
          }}>
            {sdnnRisk ? 'HIGH RISK' : 'NORMAL'}
          </div>
        </div>
        {/* RMSSD */}
        <div className="hrv-metric">
          <div className="hrv-metric__value" style={{ color: rmssdColor }}>{hrv.rmssd}</div>
          <div className="hrv-metric__label">RMSSD (ms)</div>
          <div className="hrv-metric__status" style={{
            background: `${rmssdColor}20`,
            color: rmssdColor,
          }}>
            {rmssdStatus.toUpperCase()}
          </div>
        </div>
        {/* LF/HF */}
        <div className="hrv-metric">
          <div className="hrv-metric__value" style={{ color: lfhfColor }}>{hrv.lfhf}</div>
          <div className="hrv-metric__label">LF / HF</div>
          <div className="hrv-metric__status" style={{
            background: `${lfhfColor}20`,
            color: lfhfColor,
          }}>
            {lfhfStatus.toUpperCase()}
          </div>
        </div>
      </div>
      {hrv.interpretation && (
        <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, padding: '8px 10px', background: 'var(--bg-glass)', borderRadius: 8 }}>
          {hrv.interpretation}
        </div>
      )}
    </div>
  );
}
