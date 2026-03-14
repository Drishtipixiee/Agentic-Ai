/**
 * HRV Analysis Module
 * Computes SDNN, RMSSD, and simplified LF/HF ratio
 * from an array of RR intervals (in milliseconds)
 */

export function analyzeHRV(rrIntervals) {
  if (!rrIntervals || rrIntervals.length < 2) {
    return {
      sdnn: 0,
      rmssd: 0,
      lfhf: 1.5,
      autonomicRisk: false,
      interpretation: 'Insufficient data',
    };
  }

  // Mean RR
  const mean = rrIntervals.reduce((a, b) => a + b, 0) / rrIntervals.length;

  // SDNN — Standard Deviation of NN intervals (ms)
  const variance = rrIntervals.reduce((acc, rr) => acc + Math.pow(rr - mean, 2), 0) / rrIntervals.length;
  const sdnn = Math.sqrt(variance);

  // RMSSD — Root Mean Square of Successive Differences
  let sumSquaredDiffs = 0;
  for (let i = 1; i < rrIntervals.length; i++) {
    const diff = rrIntervals[i] - rrIntervals[i - 1];
    sumSquaredDiffs += diff * diff;
  }
  const rmssd = Math.sqrt(sumSquaredDiffs / (rrIntervals.length - 1));

  // Simplified LF/HF proxy via power spectral approximation
  // LF ≈ low-frequency components (0.04–0.15 Hz) → sympathetic
  // HF ≈ high-frequency components (0.15–0.4 Hz) → parasympathetic
  // For simulation: derive from SDNN/RMSSD ratio as proxy
  const lfhf = parseFloat((sdnn / (rmssd + 1)).toFixed(2));

  // Risk classification
  const autonomicRisk = sdnn < 50; // SDNN < 50ms = high autonomic risk

  let interpretation;
  if (sdnn > 100) interpretation = 'Healthy — High autonomic variability';
  else if (sdnn >= 50) interpretation = 'Moderate — Mild autonomic suppression';
  else if (sdnn >= 20) interpretation = 'Elevated Risk — Autonomic dysfunction';
  else interpretation = 'Critical — Severe autonomic failure (sepsis risk)';

  return {
    sdnn: parseFloat(sdnn.toFixed(2)),
    rmssd: parseFloat(rmssd.toFixed(2)),
    lfhf,
    autonomicRisk,
    interpretation,
    mean: parseFloat(mean.toFixed(2)),
  };
}

/**
 * Generate synthetic RR intervals for a given heart rate
 * with controllable variability
 */
export function generateRRIntervals(hr, sdnnTarget = 80, count = 60) {
  const meanRR = 60000 / hr; // ms
  const sd = sdnnTarget;
  const intervals = [];
  for (let i = 0; i < count; i++) {
    // Box-Muller normal random
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    intervals.push(Math.max(200, meanRR + z * sd));
  }
  return intervals;
}
