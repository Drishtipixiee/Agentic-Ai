import AuditEntry from '../models/AuditEntry.js';

const RAPIDSOS_STUB_URL = 'https://api.rapidsos.com/v1/incidents'; // stub
const TWILIO_STUB_URL = 'https://api.twilio.com/2010-04-01/Accounts'; // stub

export class EscalationAgent {
  constructor(getKillSwitch) {
    this.getKillSwitch = getKillSwitch; // function returning bool
    this.status = 'IDLE';
    this.CONFIDENCE_THRESHOLD = 0.95;
  }

  async process(triageResult, diagnosis) {
    this.status = 'RUNNING';
    const { news2, hrv, confidence } = triageResult;
    const killSwitch = this.getKillSwitch();
    let escalated = false;
    let suppressReason = null;

    // Safety guardrails
    const shouldEscalate =
      (news2.band === 'HIGH' || news2.band === 'CRITICAL') &&
      confidence >= this.CONFIDENCE_THRESHOLD &&
      !killSwitch;

    if (killSwitch) {
      suppressReason = `Kill switch ACTIVE — escalation suppressed. Confidence=${(confidence * 100).toFixed(1)}%.`;
    } else if (confidence < this.CONFIDENCE_THRESHOLD) {
      suppressReason = `Confidence ${(confidence * 100).toFixed(1)}% below 95% threshold — escalation deferred.`;
    }

    if (shouldEscalate) {
      escalated = true;
      await this._dispatchRapidSOS(news2, hrv, diagnosis);
      await this._dispatchTwilio(news2, diagnosis);
    }

    await new AuditEntry({
      agentName: 'EscalationAgent',
      action: escalated ? 'ESCALATION_TRIGGERED' : 'ESCALATION_SUPPRESSED',
      reasoning: escalated
        ? `Autonomous escalation triggered. NEWS2=${news2.total} (${news2.band}), Confidence=${(confidence * 100).toFixed(1)}%. RapidSOS and Twilio stubs invoked. Diagnosis: ${diagnosis.condition}.`
        : `Escalation suppressed. ${suppressReason}`,
      confidence,
      news2Score: news2.total,
      band: news2.band,
      escalated,
      killSwitchActive: killSwitch,
      metadata: { diagnosis: diagnosis.condition },
    }).save();

    this.status = 'DONE';
    return { escalated, suppressReason, confidence };
  }

  async _dispatchRapidSOS(news2, hrv, diagnosis) {
    // STUB — logs structured incident record
    const incident = {
      service: 'RapidSOS E911 Digital Alert (STUB)',
      severity: news2.band,
      news2Score: news2.total,
      sdnn: hrv.sdnn,
      condition: diagnosis.condition,
      narrative: diagnosis.narrative,
      timestamp: new Date().toISOString(),
      location: { building: 'Ward 4B', floor: 3, room: '4B-12' },
    };
    console.log('[EscalationAgent] → RapidSOS STUB:', JSON.stringify(incident, null, 2));
    return incident;
  }

  async _dispatchTwilio(news2, diagnosis) {
    // STUB — logs call record
    const call = {
      service: 'Twilio Programmable Voice (STUB)',
      to: '+1-555-ONCALL',
      message: `ALERT: Patient clinical deterioration. NEWS2 Score ${news2.total}, Risk Band: ${news2.band}. Condition: ${diagnosis.condition}. Immediate assessment required.`,
      timestamp: new Date().toISOString(),
    };
    console.log('[EscalationAgent] → Twilio STUB:', JSON.stringify(call, null, 2));
    return call;
  }
}
