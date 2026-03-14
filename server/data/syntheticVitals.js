/**
 * Synthetic Patient Vitals Generator
 * Simulates 3 clinical scenarios with realistic Gaussian noise:
 * - STABLE: Normal homeostasis
 * - DETERIORATING: 6-hour sepsis progression (Golden Hour)
 * - CRITICAL: Acute decompensation
 */

let tick = 0; // Increments each call to simulate time progression

function gaussianRandom(mean, sd) {
  const u1 = Math.random() + 1e-10;
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * sd;
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

const SCENARIOS = {
  STABLE: {
    rr:     { base: 16, sd: 1.0, drift: 0 },
    spo2:   { base: 98, sd: 0.5, drift: 0 },
    sysBP:  { base: 120, sd: 4,  drift: 0 },
    hr:     { base: 72, sd: 4,   drift: 0 },
    temp:   { base: 36.6, sd: 0.1, drift: 0 },
    consciousness: 'Alert',
    sdnnBase: 90,
    sdnnDrift: 0,
  },
  DETERIORATING: {
    // Sepsis trajectory: over ~180 ticks (6 min at 2s each ≈ 6h simulated)
    rr:     { base: 16, sd: 1.2, drift: 0.05 },   // rising
    spo2:   { base: 98, sd: 0.8, drift: -0.04 },  // falling
    sysBP:  { base: 120, sd: 5,  drift: -0.15 },  // falling
    hr:     { base: 72, sd: 5,   drift: 0.12 },   // rising (tachycardia)
    temp:   { base: 36.6, sd: 0.15, drift: 0.008 }, // rising (fever)
    consciousness: 'Alert',
    sdnnBase: 85,
    sdnnDrift: -0.3, // HRV declining = autonomic failure
  },
  CRITICAL: {
    rr:     { base: 26, sd: 2,   drift: 0 },
    spo2:   { base: 90, sd: 1,   drift: 0 },
    sysBP:  { base: 85, sd: 5,   drift: 0 },
    hr:     { base: 130, sd: 6,  drift: 0 },
    temp:   { base: 39.2, sd: 0.2, drift: 0 },
    consciousness: 'CVPU',
    sdnnBase: 22,
    sdnnDrift: 0,
  },
};

let currentScenario = 'STABLE';
let scenarioTick = 0;

export function setScenario(name) {
  if (SCENARIOS[name]) {
    currentScenario = name;
    scenarioTick = 0;
    tick = 0;
  }
}

export function getScenario() {
  return currentScenario;
}

export function generateVitals() {
  scenarioTick++;
  const cfg = SCENARIOS[currentScenario];

  const rr = clamp(
    Math.round(gaussianRandom(cfg.rr.base + cfg.rr.drift * scenarioTick, cfg.rr.sd)),
    4, 40
  );
  const spo2 = clamp(
    Math.round(gaussianRandom(cfg.spo2.base + cfg.spo2.drift * scenarioTick, cfg.spo2.sd) * 10) / 10,
    80, 100
  );
  const sysBP = clamp(
    Math.round(gaussianRandom(cfg.sysBP.base + cfg.sysBP.drift * scenarioTick, cfg.sysBP.sd)),
    50, 250
  );
  const hr = clamp(
    Math.round(gaussianRandom(cfg.hr.base + cfg.hr.drift * scenarioTick, cfg.hr.sd)),
    30, 180
  );
  const temp = clamp(
    parseFloat(gaussianRandom(cfg.temp.base + cfg.temp.drift * scenarioTick, cfg.temp.sd).toFixed(1)),
    33.0, 42.0
  );
  const sdnn = clamp(
    cfg.sdnnBase + cfg.sdnnDrift * scenarioTick,
    5, 200
  );

  // Generate realistic RR intervals from hr + sdnn
  const meanRR = 60000 / hr;
  const rrIntervals = Array.from({ length: 60 }, () => {
    const u1 = Math.random() + 1e-10;
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return Math.max(200, meanRR + z * sdnn);
  });

  return {
    patientId: 'PT-001',
    name: 'Demo Patient',
    dob: '1975-06-15',
    scenario: currentScenario,
    rr,
    spo2,
    sysBP,
    hr,
    consciousness: cfg.consciousness,
    temp,
    rrIntervals,
    timestamp: new Date(),
  };
}
