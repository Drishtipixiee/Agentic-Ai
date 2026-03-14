import { calculateNEWS2, getRiskLabel } from '../core/news2Engine.js';
import { analyzeHRV, generateRRIntervals } from '../core/hrvAnalysis.js';
import AuditEntry from '../models/AuditEntry.js';
import VitalsReading from '../models/VitalsReading.js';

export class TriageAgent {
  constructor() {
    this.status = 'IDLE';
  }

  async process(sanitisedRecord) {
    this.status = 'RUNNING';
    try {
      // Step 1: NEWS2 scoring
      const news2 = calculateNEWS2(sanitisedRecord);

      // Step 2: HRV analysis
      const rrIntervals = sanitisedRecord.rrIntervals?.length >= 2
        ? sanitisedRecord.rrIntervals
        : generateRRIntervals(sanitisedRecord.hr || 75, 80);
      const hrv = analyzeHRV(rrIntervals);

      // Step 3: Composite confidence score
      // Elevates confidence when HRV also signals risk
      let confidence = Math.min(0.99, news2.total / 12);
      if (hrv.autonomicRisk) confidence = Math.min(0.99, confidence + 0.15);

      // Step 4: Chain-of-Diagnosis reasoning string
      const cod = this._buildChainOfDiagnosis(sanitisedRecord, news2, hrv);

      // Step 5: Audit trail
      await new AuditEntry({
        agentName: 'TriageAgent',
        action: 'TRIAGE_COMPLETE',
        reasoning: cod,
        confidence,
        news2Score: news2.total,
        band: news2.band,
        metadata: {
          news2Breakdown: news2.scores,
          shapWeights: news2.shapWeights,
          hrv: { sdnn: hrv.sdnn, rmssd: hrv.rmssd, lfhf: hrv.lfhf },
        },
      }).save();

      // Step 6: Update VitalsReading with computed scores
      await VitalsReading.findOneAndUpdate(
        { scenario: sanitisedRecord.scenario, news2: { $exists: false } },
        { news2: { total: news2.total, band: news2.band, color: news2.color, scores: news2.scores, shapWeights: news2.shapWeights }, hrv },
        { sort: { timestamp: -1 } }
      );

      this.status = 'DONE';
      return { news2, hrv, confidence, cod };
    } catch (err) {
      this.status = 'ERROR';
      throw err;
    }
  }

  _buildChainOfDiagnosis(vitals, news2, hrv) {
    const steps = [
      `[1] PARAMETER ASSESSMENT: RR=${vitals.rr}bpm(score:${news2.scores?.rr}), SpO2=${vitals.spo2}%(score:${news2.scores?.spo2}), SysBP=${vitals.sysBP}mmHg(score:${news2.scores?.sysBP}), HR=${vitals.hr}bpm(score:${news2.scores?.hr}), Temp=${vitals.temp}°C(score:${news2.scores?.temp}), Consciousness=${vitals.consciousness}(score:${news2.scores?.consciousness}).`,
      `[2] AGGREGATE NEWS2 SCORE: ${news2.total}/20 → Risk Band: ${news2.band} (${getRiskLabel(news2.band)}).`,
      `[3] HRV ANALYSIS: SDNN=${hrv.sdnn}ms, RMSSD=${hrv.rmssd}ms, LF/HF=${hrv.lfhf}. ${hrv.interpretation}.`,
      hrv.autonomicRisk
        ? `[4] AUTONOMIC FLAG: SDNN < 50ms detected — vagal withdrawal pattern consistent with early sepsis or myocardial stress.`
        : `[4] AUTONOMIC STATUS: Variability within acceptable range. No autonomic failure signal.`,
      `[5] DOMINANT FEATURE (XAI): ${this._dominantFeature(news2.shapWeights)} contributed most to risk score.`,
    ];
    return steps.join(' ');
  }

  _dominantFeature(shapWeights) {
    if (!shapWeights) return 'Unknown';
    const sorted = Object.entries(shapWeights).sort((a, b) => b[1] - a[1]);
    const labels = { rr: 'Respiration Rate', spo2: 'Oxygen Saturation', sysBP: 'Blood Pressure', hr: 'Heart Rate', consciousness: 'Consciousness', temp: 'Temperature' };
    return labels[sorted[0]?.[0]] || sorted[0]?.[0] || 'None';
  }
}
