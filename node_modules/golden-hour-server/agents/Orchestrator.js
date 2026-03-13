import { MonitoringAgent } from './MonitoringAgent.js';
import { PrivacyAgent } from './PrivacyAgent.js';
import { TriageAgent } from './TriageAgent.js';
import { DiagnosticAgent } from './DiagnosticAgent.js';
import { EscalationAgent } from './EscalationAgent.js';
import AgentState from '../models/AgentState.js';

export class Orchestrator {
  constructor(io) {
    this.io = io; // Socket.io server instance
    this.killSwitchActive = false;
    this.currentScenario = 'STABLE';

    // Initialize agents
    this.monitoring = new MonitoringAgent(this);
    this.privacy = new PrivacyAgent();
    this.triage = new TriageAgent();
    this.diagnostic = new DiagnosticAgent();
    this.escalation = new EscalationAgent(() => this.killSwitchActive);

    this._processing = false;
  }

  async init() {
    // Ensure singleton AgentState document exists
    await AgentState.findOneAndUpdate(
      { stateId: 'singleton' },
      { stateId: 'singleton' },
      { upsert: true, new: true }
    );
    this.monitoring.start();
    console.log('[Orchestrator] Pipeline initialized');
  }

  async process(rawVitals) {
    if (this._processing) return; // Prevent overlap
    this._processing = true;

    try {
      this._broadcastAgentStatus('monitoring', 'DONE');

      // Stage 1: Privacy
      this._broadcastAgentStatus('privacy', 'RUNNING');
      const sanitised = await this.privacy.process(rawVitals);
      this._broadcastAgentStatus('privacy', 'DONE');

      // Stage 2: Triage
      this._broadcastAgentStatus('triage', 'RUNNING');
      const triageResult = await this.triage.process(sanitised);
      this._broadcastAgentStatus('triage', 'DONE');

      // Stage 3: Diagnostic
      this._broadcastAgentStatus('diagnostic', 'RUNNING');
      const diagnosis = await this.diagnostic.process(sanitised, triageResult);
      this._broadcastAgentStatus('diagnostic', 'DONE');

      // Stage 4: Escalation
      this._broadcastAgentStatus('escalation', 'RUNNING');
      const escalationResult = await this.escalation.process(triageResult, diagnosis);
      this._broadcastAgentStatus('escalation', escalationResult.escalated ? 'TRIGGERED' : 'DONE');

      // Build comprehensive state snapshot
      const state = {
        vitals: {
          rr: rawVitals.rr,
          spo2: rawVitals.spo2,
          sysBP: rawVitals.sysBP,
          hr: rawVitals.hr,
          consciousness: rawVitals.consciousness,
          temp: rawVitals.temp,
        },
        news2: triageResult.news2,
        hrv: triageResult.hrv,
        confidence: triageResult.confidence,
        diagnosis,
        escalation: escalationResult,
        scenario: rawVitals.scenario,
        killSwitchActive: this.killSwitchActive,
        timestamp: new Date().toISOString(),
      };

      // Persist to MongoDB
      await AgentState.findOneAndUpdate(
        { stateId: 'singleton' },
        {
          scenario: rawVitals.scenario,
          killSwitchActive: this.killSwitchActive,
          news2Score: triageResult.news2.total,
          band: triageResult.news2.band,
          confidence: triageResult.confidence,
          agentStatuses: {
            monitoring: this.monitoring.status,
            privacy: this.privacy.status,
            triage: this.triage.status,
            diagnostic: this.diagnostic.status,
            escalation: this.escalation.status,
          },
          latestVitals: state.vitals,
          latestNews2: triageResult.news2,
          latestHrv: triageResult.hrv,
          latestDiagnosis: diagnosis.narrative,
          lastEscalation: escalationResult.escalated ? new Date() : undefined,
        },
        { new: true }
      );

      // Broadcast to all connected dashboard clients
      this.io.emit('vitals:update', state);

      if (escalationResult.escalated) {
        this.io.emit('escalation:triggered', {
          news2Score: triageResult.news2.total,
          band: triageResult.news2.band,
          condition: diagnosis.condition,
          timestamp: new Date().toISOString(),
        });
      }

    } catch (err) {
      console.error('[Orchestrator] Pipeline error:', err.message);
    } finally {
      this._processing = false;
      // Reset agent statuses to IDLE after pipeline completes
      setTimeout(() => {
        ['privacy', 'triage', 'diagnostic'].forEach(a => this._broadcastAgentStatus(a, 'IDLE'));
        if (this.escalation.status !== 'TRIGGERED') this._broadcastAgentStatus('escalation', 'IDLE');
      }, 1500);
    }
  }

  toggleKillSwitch() {
    this.killSwitchActive = !this.killSwitchActive;
    console.log(`[Orchestrator] Kill switch → ${this.killSwitchActive ? 'ACTIVE' : 'INACTIVE'}`);
    this.io.emit('killswitch:changed', { active: this.killSwitchActive });
    return this.killSwitchActive;
  }

  setScenario(scenario) {
    this.currentScenario = scenario;
    this.monitoring.setScenario(scenario);
    this.io.emit('scenario:changed', { scenario });
  }

  _broadcastAgentStatus(agent, status) {
    this.io.emit('agent:status', { agent, status });
  }
}
