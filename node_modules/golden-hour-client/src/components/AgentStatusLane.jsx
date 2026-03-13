import { useRef, useEffect } from 'react';

const AGENT_BORDER_COLORS = {
  MonitoringAgent: '#38bdf8',
  PrivacyAgent: '#8b5cf6',
  TriageAgent: '#f59e0b',
  DiagnosticAgent: '#14b8a6',
  EscalationAgent: '#ef4444',
};

const AGENT_STATUS_COLORS = {
  IDLE: 'var(--agent-idle)',
  RUNNING: 'var(--agent-running)',
  DONE: 'var(--agent-done)',
  ERROR: 'var(--agent-error)',
  TRIGGERED: 'var(--agent-triggered)',
};

const AGENTS = [
  { key: 'monitoring', name: 'MonitoringAgent', icon: '📡', desc: 'Vitals Ingestion' },
  { key: 'privacy', name: 'PrivacyAgent', icon: '🔐', desc: 'PHI Encryption' },
  { key: 'triage', name: 'TriageAgent', icon: '🩺', desc: 'Chain-of-Diagnosis' },
  { key: 'diagnostic', name: 'DiagnosticAgent', icon: '🔬', desc: 'RAG Evidence' },
  { key: 'escalation', name: 'EscalationAgent', icon: '🚨', desc: 'Emergency Dispatch' },
];

export default function AgentStatusLane({ statuses }) {
  return (
    <div className="card">
      <div className="card__header">
        <span className="card__title">Agent Pipeline</span>
        <span className="card__badge" style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--accent-blue)' }}>
          5 Agents
        </span>
      </div>
      <div className="agent-lane">
        {AGENTS.map(({ key, name, icon, desc }) => {
          const status = statuses?.[key] || 'IDLE';
          const color = AGENT_STATUS_COLORS[status] || 'var(--agent-idle)';
          const borderColor = AGENT_BORDER_COLORS[name];
          return (
            <div
              key={key}
              className="agent-item"
              style={{ borderColor: status !== 'IDLE' ? `${borderColor}40` : 'var(--border-glass)' }}
            >
              <span style={{ fontSize: 16 }}>{icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="agent-item__name">{name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{desc}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div
                  className={`agent-item__dot${status === 'RUNNING' ? ' agent-item__dot--running' : ''}`}
                  style={{ background: color }}
                />
                <div className="agent-item__status" style={{ color }}>{status}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
