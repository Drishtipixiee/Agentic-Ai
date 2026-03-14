import AuditEntry from '../models/AuditEntry.js';

// Curated clinical knowledge base — simulates PubMed RAG
const EVIDENCE_MAP = [
  {
    condition: 'Sepsis — Early Stage',
    match: (vitals, news2, hrv) =>
      news2.band === 'MEDIUM' && hrv.sdnn < 60 && vitals.hr > 95,
    narrative: (v, news2, hrv) =>
      `Tachycardia (HR=${v.hr}bpm) combined with vagal withdrawal (SDNN<60ms) indicates early septic response. Increased cardiac sympathetic drive with reduced parasympathetic modulation. [RCP NEWS2 2017; PMID:28090692 — HRV in sepsis prediction]`,
  },
  {
    condition: 'Sepsis — Advanced / Septic Shock',
    match: (vitals, news2, hrv) =>
      (news2.band === 'HIGH' || news2.band === 'CRITICAL') && vitals.sysBP < 100,
    narrative: (v, news2, hrv) =>
      `Hypotension (SysBP=${v.sysBP}mmHg) with elevated NEWS2 meets SEPSIS-3 criteria for septic shock. Immediate IV fluid resuscitation and blood cultures required. [Singer et al., JAMA 2016; PMID:26903338]`,
  },
  {
    condition: 'Respiratory Failure — Type 1',
    match: (vitals, news2, hrv) =>
      vitals.spo2 < 94 && vitals.rr > 20,
    narrative: (v, news2, hrv) =>
      `SpO2=${v.spo2}% with RR=${v.rr}bpm suggests Type 1 respiratory failure (hypoxaemia without hypercapnia). Consider supplemental O2 titration to 94–98%. [BTS Oxygen Guidelines 2017]`,
  },
  {
    condition: 'Autonomic Failure — Myocardial Risk',
    match: (vitals, news2, hrv) =>
      hrv.sdnn < 50 && hrv.lfhf > 3,
    narrative: (v, news2, hrv) =>
      `SDNN=${hrv.sdnn}ms with elevated LF/HF=${hrv.lfhf} indicates sympathovagal imbalance. Reduced HRV is an independent predictor of myocardial infarction and in-hospital mortality. [PMID:9822354 — Kleiger HRV post-MI]`,
  },
  {
    condition: 'Fever — Systemic Inflammatory Response',
    match: (vitals, news2, hrv) =>
      vitals.temp > 38.5 && vitals.hr > 90,
    narrative: (v, news2, hrv) =>
      `Temperature=${v.temp}°C with HR=${v.hr}bpm meets SIRS temperature and tachycardia criteria. Consider blood, urine, and sputum cultures. [Bone et al., Chest 1992 — SIRS definition]`,
  },
  {
    condition: 'Neurological Deterioration',
    match: (vitals, news2, hrv) =>
      vitals.consciousness !== 'Alert',
    narrative: (v, news2, hrv) =>
      `Altered consciousness (${v.consciousness}) detected. GCS equivalent deterioration. Immediate neurological assessment required; consider CT head and stroke protocol. [NICE Guideline NG128]`,
  },
  {
    condition: 'Physiologically Stable',
    match: (vitals, news2, hrv) => news2.band === 'STABLE',
    narrative: (v, news2, hrv) =>
      `All physiological parameters within normal bounds. NEWS2=${news2.total}. Routine monitoring recommended per ward protocol. No immediate clinical escalation required.`,
  },
];

export class DiagnosticAgent {
  constructor() {
    this.status = 'IDLE';
  }

  async process(sanitisedRecord, triageResult) {
    this.status = 'RUNNING';
    try {
      const { news2, hrv } = triageResult;

      // Match against evidence map (multiple conditions may match)
      const matches = EVIDENCE_MAP.filter(e => e.match(sanitisedRecord, news2, hrv));
      const primaryMatch = matches[0] || EVIDENCE_MAP[EVIDENCE_MAP.length - 1];

      const diagnosis = {
        condition: primaryMatch.condition,
        narrative: primaryMatch.narrative(sanitisedRecord, news2, hrv),
        additionalConditions: matches.slice(1).map(m => m.condition),
        evidenceCount: matches.length,
      };

      await new AuditEntry({
        agentName: 'DiagnosticAgent',
        action: 'DIAGNOSIS_GENERATED',
        reasoning: `Matched ${matches.length} evidence pattern(s). Primary: "${diagnosis.condition}". ${diagnosis.narrative}`,
        confidence: triageResult.confidence,
        news2Score: news2.total,
        band: news2.band,
        metadata: { diagnosis },
      }).save();

      this.status = 'DONE';
      return diagnosis;
    } catch (err) {
      this.status = 'ERROR';
      throw err;
    }
  }
}
