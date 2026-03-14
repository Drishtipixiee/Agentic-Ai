import { useRef, useEffect } from 'react';

const AGENT_COLORS = {
  MonitoringAgent: '#38bdf8',
  PrivacyAgent: '#8b5cf6',
  TriageAgent: '#f59e0b',
  DiagnosticAgent: '#14b8a6',
  EscalationAgent: '#ef4444',
  System: '#64748b',
};

const ACTION_ICON = {
  VITALS_INGESTED: '📡',
  PHI_SANITISED: '🔐',
  TRIAGE_COMPLETE: '🩺',
  DIAGNOSIS_GENERATED: '🔬',
  ESCALATION_TRIGGERED: '🚨',
  ESCALATION_SUPPRESSED: '🛡',
  TRIAGE_COMPLETE_LOCAL: '📊',
};

export default function AuditTrail({ entries, scenario, escalation }) {
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <div className="card" style={{ flex: 1 }}>
      <div className="card__header">
        <span className="card__title">Decision Audit Trail</span>
        <span className="card__badge" style={{ background: 'rgba(100,116,139,0.15)', color: '#94a3b8' }}>
          Immutable
        </span>
      </div>

      {/* Summary bar */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(56,189,248,0.08)', color: 'var(--accent-blue)' }}>
          Scenario: {scenario}
        </span>
        {escalation?.escalated && (
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', color: 'var(--risk-high)' }}>
            🚨 Escalated
          </span>
        )}
        {escalation?.suppressReason && (
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(245,158,11,0.1)', color: 'var(--risk-medium)' }}>
            🛡 Suppressed
          </span>
        )}
      </div>

      <div className="audit-list" ref={listRef}>
        {entries.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
            Audit log initializing…
          </div>
        )}
        {entries.map((e, i) => {
          const agent = e.agent || 'System';
          const color = AGENT_COLORS[agent] || '#64748b';
          const icon = ACTION_ICON[e.action] || '📝';
          return (
            <div key={e.id || i} className="audit-entry" style={{ borderLeftColor: color }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="audit-entry__agent" style={{ color }}>
                  {icon} {agent}
                </div>
                <div className="audit-entry__time">{e.time}</div>
              </div>
              <div className="audit-entry__action">
                {e.action?.replace(/_/g, ' ')}
                {e.news2 !== undefined && (
                  <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--text-muted)' }}>
                    NEWS2={e.news2} ({e.band})
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
