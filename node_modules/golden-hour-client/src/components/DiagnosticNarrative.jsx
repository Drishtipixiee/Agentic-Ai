export default function DiagnosticNarrative({ diagnosis }) {
  return (
    <div className="card">
      <div className="card__header">
        <span className="card__title">AI Diagnostic Narrative</span>
        <span className="card__badge" style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--accent-blue)' }}>
          RAG Evidence
        </span>
      </div>
      {diagnosis ? (
        <>
          <div className="narrative-condition">{diagnosis.condition}</div>
          <div className="narrative-box">{diagnosis.narrative}</div>
          {diagnosis.additionalConditions?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Co-occurring conditions:
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {diagnosis.additionalConditions.map(c => (
                  <span key={c} style={{
                    fontSize: 10, padding: '2px 8px',
                    background: 'rgba(56,189,248,0.08)',
                    border: '1px solid rgba(56,189,248,0.15)',
                    borderRadius: 12,
                    color: 'var(--accent-blue)',
                  }}>{c}</span>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '12px 0' }}>
          Awaiting diagnostic analysis…
        </div>
      )}
    </div>
  );
}
