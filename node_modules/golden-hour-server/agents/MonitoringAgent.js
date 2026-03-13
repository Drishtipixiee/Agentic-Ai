import { generateVitals, setScenario, getScenario } from '../data/syntheticVitals.js';
import VitalsReading from '../models/VitalsReading.js';
import AuditEntry from '../models/AuditEntry.js';

export class MonitoringAgent {
  constructor(pipeline) {
    this.pipeline = pipeline; // Orchestrator reference
    this.intervalMs = 2000;
    this._timer = null;
    this.status = 'IDLE';
  }

  start() {
    this.status = 'RUNNING';
    this._timer = setInterval(() => this._tick(), this.intervalMs);
    console.log('[MonitoringAgent] Started — polling every 2s');
  }

  stop() {
    if (this._timer) clearInterval(this._timer);
    this._timer = null;
    this.status = 'IDLE';
  }

  setScenario(name) {
    setScenario(name);
    console.log(`[MonitoringAgent] Scenario changed → ${name}`);
  }

  async _tick() {
    try {
      this.status = 'RUNNING';
      const raw = generateVitals();

      // Persist raw vitals (PHI not yet encrypted — PrivacyAgent handles that)
      const saved = await new VitalsReading({
        patientId: raw.patientId,
        scenario: raw.scenario,
        rr: raw.rr,
        spo2: raw.spo2,
        sysBP: raw.sysBP,
        hr: raw.hr,
        consciousness: raw.consciousness,
        temp: raw.temp,
        rrIntervals: raw.rrIntervals,
        timestamp: raw.timestamp,
      }).save();

      await new AuditEntry({
        agentName: 'MonitoringAgent',
        action: 'VITALS_INGESTED',
        reasoning: `Ingested vitals for scenario: ${raw.scenario}. HR=${raw.hr}, SpO2=${raw.spo2}%, RR=${raw.rr}.`,
        confidence: 1.0,
        metadata: { vitalsId: saved._id },
      }).save();

      // Pass to pipeline
      await this.pipeline.process(raw);
      this.status = 'DONE';
    } catch (err) {
      this.status = 'ERROR';
      console.error('[MonitoringAgent] Error:', err.message);
    }
  }
}
