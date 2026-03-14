/**
 * NEWS2 Scoring Engine
 * Based on Royal College of Physicians NEWS2 guidelines
 * Returns per-parameter scores and aggregate risk band
 */

// Scoring tables matching the RCP NEWS2 specification
const RR_SCORE = (rr) => {
  if (rr <= 8) return 3;
  if (rr <= 11) return 1;
  if (rr <= 20) return 0;
  if (rr <= 24) return 2;
  return 3; // >= 25
};

const SPO2_SCORE = (spo2) => {
  if (spo2 <= 91) return 3;
  if (spo2 <= 93) return 2;
  if (spo2 <= 95) return 1;
  return 0; // >= 96
};

const SYSBP_SCORE = (bp) => {
  if (bp <= 90) return 3;
  if (bp <= 100) return 2;
  if (bp <= 110) return 1;
  if (bp <= 219) return 0;
  return 3; // >= 220
};

const HR_SCORE = (hr) => {
  if (hr <= 40) return 3;
  if (hr <= 50) return 1;
  if (hr <= 90) return 0;
  if (hr <= 110) return 1;
  if (hr <= 130) return 2;
  return 3; // >= 131
};

const CONSCIOUSNESS_SCORE = (level) => {
  // level: 'Alert' = 0, 'CVPU' or 'NewConfusion' = 3
  if (level === 'Alert') return 0;
  return 3;
};

const TEMP_SCORE = (temp) => {
  if (temp <= 35.0) return 3;
  if (temp <= 36.0) return 1;
  if (temp <= 38.0) return 0;
  if (temp <= 39.0) return 1;
  return 2; // >= 39.1
};

export function calculateNEWS2(vitals) {
  const {
    rr = 16,
    spo2 = 98,
    sysBP = 120,
    hr = 75,
    consciousness = 'Alert',
    temp = 36.6,
  } = vitals;

  const scores = {
    rr: RR_SCORE(rr),
    spo2: SPO2_SCORE(spo2),
    sysBP: SYSBP_SCORE(sysBP),
    hr: HR_SCORE(hr),
    consciousness: CONSCIOUSNESS_SCORE(consciousness),
    temp: TEMP_SCORE(temp),
  };

  const total = Object.values(scores).reduce((a, b) => a + b, 0);

  let band, color;
  if (total === 0) { band = 'STABLE'; color = '#22c55e'; }
  else if (total <= 4) { band = 'LOW'; color = '#84cc16'; }
  else if (total <= 6) { band = 'MEDIUM'; color = '#f59e0b'; }
  else if (total <= 8) { band = 'HIGH'; color = '#ef4444'; }
  else { band = 'CRITICAL'; color = '#dc2626'; }

  // SHAP-proxy: normalised contribution of each parameter
  const shapWeights = {};
  if (total > 0) {
    for (const [key, val] of Object.entries(scores)) {
      shapWeights[key] = parseFloat((val / total).toFixed(3));
    }
  } else {
    for (const key of Object.keys(scores)) shapWeights[key] = 0;
  }

  return { scores, total, band, color, shapWeights };
}

export function getRiskLabel(band) {
  const labels = {
    STABLE: 'Stable — Monitor Routinely',
    LOW: 'Low Risk — Increased Monitoring',
    MEDIUM: 'Medium Risk — Urgent Assessment',
    HIGH: 'High Risk — Emergency Response',
    CRITICAL: 'Critical — Immediate Escalation',
  };
  return labels[band] || 'Unknown';
}
