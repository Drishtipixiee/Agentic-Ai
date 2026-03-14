import { useState, useEffect, useRef } from 'react';
import { useSocket } from './hooks/useSocket.js';
import VitalsPanel from './components/VitalsPanel.jsx';
import News2Breakdown from './components/News2Breakdown.jsx';
import HRVPanel from './components/HRVPanel.jsx';
import XAIPanel from './components/XAIPanel.jsx';
import RiskTimeline from './components/RiskTimeline.jsx';
import DiagnosticNarrative from './components/DiagnosticNarrative.jsx';
import AuditTrail from './components/AuditTrail.jsx';
import AgentStatusLane from './components/AgentStatusLane.jsx';
import KillSwitch from './components/KillSwitch.jsx';

const SCENARIOS = ['STABLE', 'DETERIORATING', 'CRITICAL'];

export default function App() {
  const { connected, vitalsState, agentStatuses, escalationEvent, killSwitchActive } = useSocket();
  const [scenario, setScenario] = useState('STABLE');
  const [timelineData, setTimelineData] = useState([]);
  const [auditEntries, setAuditEntries] = useState([]);

  // Track time-series for timeline chart (last 60 points)
  useEffect(() => {
    if (!vitalsState) return;
    setTimelineData(prev => {
      const next = [
        ...prev,
        {
          time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          news2: vitalsState.news2?.total ?? 0,
          hr: vitalsState.vitals?.hr ?? 0,
          spo2: vitalsState.vitals?.spo2 ?? 0,
        }
      ];
      return next.slice(-60);
    });
  }, [vitalsState]);

  // Build audit entries from pipeline events
  useEffect(() => {
    if (!vitalsState) return;
    const entry = {
      id: Date.now(),
      agent: 'TriageAgent',
      action: 'TRIAGE_COMPLETE',
      news2: vitalsState.news2?.total,
      band: vitalsState.news2?.band,
      time: new Date().toLocaleTimeString(),
    };
    setAuditEntries(prev => [entry, ...prev].slice(0, 40));
  }, [vitalsState]);

  const handleScenarioChange = async (e) => {
    const s = e.target.value;
    setScenario(s);
    try {
      await fetch('/api/escalation/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: s }),
      });
    } catch {}
  };

  const news2 = vitalsState?.news2;
  const vitals = vitalsState?.vitals;
  const hrv = vitalsState?.hrv;
  const bandColor = news2?.color || '#22c55e';

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header__brand">
          <div className="header__logo">🏥</div>
          <div>
            <div className="header__title">Golden Hour</div>
            <div className="header__subtitle">Clinical Escalation AI · Runtime Rebels</div>
          </div>
        </div>

        <div className="header__controls">
          {/* Connection status */}
          <span className={`conn-dot conn-dot--${connected ? 'connected' : 'disconnected'}`} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 8 }}>
            {connected ? 'Live' : 'Offline'}
          </span>

          {/* Scenario selector */}
          <label style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 4 }}>Scenario:</label>
          <select
            id="scenario-selector"
            className="scenario-select"
            value={scenario}
            onChange={handleScenarioChange}
          >
            {SCENARIOS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Kill switch in header */}
          <KillSwitch active={killSwitchActive} confidence={vitalsState?.confidence} />
        </div>
      </header>

      {/* Main 3-column grid */}
      <main className="main-grid">
        {/* Column 1: Vitals + NEWS2 + HRV */}
        <div className="column">
          {/* Risk Banner */}
          <div className="card card--glow" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="risk-banner" style={{
              background: `linear-gradient(135deg, ${bandColor}15, ${bandColor}05)`,
              borderBottom: `1px solid ${bandColor}40`,
            }}>
              <div className="risk-banner__score" style={{ color: bandColor }}>
                {news2?.total ?? '--'}
              </div>
              <div className="risk-banner__info">
                <div className="risk-banner__band" style={{ color: bandColor }}>
                  {news2?.band ?? 'LOADING'}
                </div>
                <div className="risk-banner__label">NEWS2 Aggregate Score</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Confidence: {vitalsState?.confidence ? `${(vitalsState.confidence * 100).toFixed(1)}%` : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Vitals Panel */}
          <VitalsPanel vitals={vitals} news2={news2} />

          {/* NEWS2 Breakdown */}
          <News2Breakdown news2={news2} />

          {/* HRV Panel */}
          <HRVPanel hrv={hrv} />
        </div>

        {/* Column 2: Timeline + XAI + Narrative */}
        <div className="column">
          <RiskTimeline data={timelineData} />
          <XAIPanel shapWeights={news2?.shapWeights} />
          <DiagnosticNarrative diagnosis={vitalsState?.diagnosis} />
        </div>

        {/* Column 3: Agents + Audit Trail */}
        <div className="column">
          <AgentStatusLane statuses={agentStatuses} />
          <AuditTrail entries={auditEntries} scenario={scenario} escalation={vitalsState?.escalation} />
        </div>
      </main>

      {/* Escalation Toast */}
      {escalationEvent && (
        <div className="escalation-toast">
          <div className="escalation-toast__title">🚨 ESCALATION TRIGGERED</div>
          <div className="escalation-toast__body">
            NEWS2: {escalationEvent.news2Score} ({escalationEvent.band})<br />
            {escalationEvent.condition}<br />
            RapidSOS + Twilio alerts dispatched
          </div>
        </div>
      )}
    </div>
  );
}
