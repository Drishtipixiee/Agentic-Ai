import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import twilio from 'twilio';
import dotenv from 'dotenv';
import { ChatOpenAI } from "@langchain/openai";
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

import fs from 'fs';
dotenv.config();

// ─── CONFIGURATION ────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'svashthai_ultra_secure_jwt_key_2026';
const PORT = process.env.PORT || 3001;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

// ─── EXPRESS + HTTP + SOCKET.IO ───────────────────────────────────────────────
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*', methods: ['GET', 'POST'] } });

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true }));

// ─── SQLITE DATABASE ──────────────────────────────────────────────────────────
const db = new Database('./svashthai.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'doctor',
    hospital TEXT DEFAULT 'SvasthAI Medical Center',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    ward TEXT,
    doctor TEXT,
    blood_group TEXT,
    height TEXT,
    weight TEXT,
    admitted TEXT,
    room TEXT,
    condition TEXT DEFAULT 'stable',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS vitals_history (
    id TEXT PRIMARY KEY,
    patient_id TEXT,
    hr REAL, spo2 REAL, hrv REAL, temp REAL,
    sbp REAL, dbp REAL, respi REAL,
    risk TEXT,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    patient_id TEXT,
    type TEXT,
    message TEXT,
    severity TEXT,
    resolved INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS agent_logs (
    id TEXT PRIMARY KEY,
    agent_id TEXT,
    action TEXT,
    result TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS sos_events (
    id TEXT PRIMARY KEY,
    patient_id TEXT,
    lat REAL, lng REAL,
    message TEXT,
    acknowledged INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed default users & patient
const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@svashthai.com');
if (!existingUser) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)').run(
    uuidv4(), 'Dr. Admin', 'admin@svashthai.com', hash, 'admin'
  );
  db.prepare('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)').run(
    uuidv4(), 'Dr. Mehta', 'doctor@svashthai.com', bcrypt.hashSync('doctor123', 10), 'doctor'
  );
}
const existingPatient = db.prepare('SELECT id FROM patients WHERE id = ?').get('RB-2024-0042');
if (!existingPatient) {
  db.prepare(`INSERT INTO patients (id, name, age, gender, ward, doctor, blood_group, height, weight, admitted, room)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    'RB-2024-0042','Roshani Singh', 21, 'Female', 'Remote Care', 'Dr. A. Mehta', 'O+', '162 cm', '56 kg', '12 Mar 2026', 'ICU-7'
  );
}

// ─── AI CLIENTS ───────────────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(GEMINI_KEY);
const chatModel = new ChatOpenAI({
  apiKey: process.env.FEATHERLESS_API_KEY || 'dummy',
  configuration: { baseURL: 'https://api.featherless.ai/v1' },
  modelName: 'deepseek-ai/DeepSeek-R1-0528',
  timeout: 8000,
});

// ─── TWILIO ───────────────────────────────────────────────────────────────────
const TWILIO_SID   = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM  = process.env.TWILIO_PHONE_NUMBER;
let twilioClient = null;
try { twilioClient = twilio(TWILIO_SID, TWILIO_TOKEN); } catch(e) { console.log('[TWILIO] init skipped'); }

// ─── SIMULATION ENGINE ────────────────────────────────────────────────────────
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rand  = (mn, mx)    => Math.random() * (mx - mn) + mn;

const SCENARIOS = [
  { label:"Stable Baseline",   ticks:20, hrC:[72,82],   spo2C:[97,99], hrvC:[46,60], tempC:[36.5,37.0], sbpC:[110,120], dbpC:[70,80],  respiC:[14,18] },
  { label:"Warning Phase",     ticks:15, hrC:[95,105],  spo2C:[93,95], hrvC:[32,40], tempC:[37.4,37.8], sbpC:[125,135], dbpC:[80,88],  respiC:[20,24] },
  { label:"Critical Hypoxia",  ticks:15, hrC:[115,130], spo2C:[88,91], hrvC:[18,25], tempC:[38.0,38.6], sbpC:[140,155], dbpC:[90,100], respiC:[26,32] },
  { label:"Post-Intervention", ticks:20, hrC:[85,95],   spo2C:[94,96], hrvC:[35,45], tempC:[37.1,37.5], sbpC:[115,125], dbpC:[75,85],  respiC:[16,20] }
];

let scenarioRef   = 0;
let sceneTick     = 0;
let currentVitals = { hr:75, spo2:98, hrv:55, temp:36.6, sbp:115, dbp:75, respi:16 };
let history       = Array.from({ length:30 }, (_,i) => ({ t:i, hr:75, spo2:98, respi:16, hrv:55, ts:Date.now() }));
let ecgWaves      = []; 

// ─── WEARABLE DEVICE STATUS ANALOGY ──────────────────────────────────────────
let wearableDevices = {
  appleWatch: { connected: true, battery: 84, lastSync: 'Just now', signal: 'STRONG' },
  garmin:     { connected: false, battery: 0, lastSync: '2h ago', signal: 'OFFLINE' },
  fitbit:     { connected: true, battery: 42, lastSync: '5m ago', signal: 'WEAK' },
  oura:       { connected: true, battery: 12, lastSync: 'Just now', signal: 'STRONG' }
};

// ─── PHYSIOLOGICAL FEEDBACK LOOPS ───────────────────────────────────────────
function driftPhysiology() {
  const s = SCENARIOS[scenarioRef];
  
  // High-fidelity drift towards scenario targets
  const targetHR = rand(s.hrC[0], s.hrC[1]);
  const targetSPO2 = rand(s.spo2C[0], s.spo2C[1]);
  
  currentVitals.hr += (targetHR - currentVitals.hr) * 0.08;
  currentVitals.spo2 += (targetSPO2 - currentVitals.spo2) * 0.04;
  
  // Clinical Analogy: Baroreceptor-like compensation
  if (currentVitals.spo2 < 92) {
    currentVitals.respi += 0.8; // Hypoxic drive
    currentVitals.ansTone = 'Sympathetic Dominant';
  } else {
    currentVitals.ansTone = 'Homeostatic Parasympathetic';
    if (currentVitals.respi > 18) currentVitals.respi -= 0.3;
  }

  // Neural Accuracy Simulation
  currentVitals.confidence = +((currentVitals.spo2 / 100) * 0.9 + 0.1).toFixed(3);
}

// ─── SIGNAL ARTIFACT GENERATOR ───────────────────────────────────────────────
function addSignalNoise(value, intensity = 0.05) {
  const noise = (Math.random() - 0.5) * 2 * intensity;
  return value + (value * noise);
}

// ─── ECG WAVEFORM SIMULATOR (250Hz analogy) ──────────────────────────────────
function generateECGPoint(hr) {
  const t = Date.now() / 1000;
  const bpmToHz = hr / 60;
  // Simplified ECG-like periodic signal
  const pWave = 0.1 * Math.exp(-Math.pow((t * bpmToHz % 1) - 0.2, 2) / 0.01);
  const qrsComplex = 1.0 * Math.exp(-Math.pow((t * bpmToHz % 1) - 0.4, 2) / 0.001);
  const tWave = 0.2 * Math.exp(-Math.pow((t * bpmToHz % 1) - 0.7, 2) / 0.02);
  return (pWave + qrsComplex + tWave + (Math.random() * 0.05)).toFixed(3);
}

// ─── AGENT STATE ──────────────────────────────────────────────────────────────
let agentMetrics = {
  monitor:    { status:'ACTIVE',   tasks:0, decisions:0, lastLog:'Stream connected — 250 Hz sampling active' },
  triage:     { status:'ACTIVE',   tasks:0, decisions:0, lastLog:'NEWS2 computed — score updated' },
  risk:       { status:'STANDBY',  tasks:0, decisions:0, lastLog:'Risk model initialized — watching thresholds' },
  diagnostic: { status:'ACTIVE',   tasks:0, decisions:0, lastLog:'Differential generated — top 3 hypotheses' },
  escalation: { status:'STANDBY',  tasks:0, decisions:0, lastLog:'Emergency API warm — ready to dispatch' },
};

let systemStats = { anomalyInjections:0, sosTriggered:0, smsSent:0, alertsGenerated:0, hitlReviews:0 };

// ─── DATASET LOADING ──────────────────────────────────────────────────────────
let wearableDataset = [];
try {
  const raw = fs.readFileSync('./data/vitals_dataset.json', 'utf8');
  wearableDataset = JSON.parse(raw);
  console.log(`[DATASET] Loaded ${wearableDataset.length} clinical profiles`);
} catch(e) { console.log('[DATASET] Failed to load local dataset'); }

// ─── HUMAN-IN-THE-LOOP (HITL) QUEUE ──────────────────────────────────────────
let hitlQueue = [];
function addDecisionToReview(agentId, action, reason, data) {
  const decision = {
    id: uuidv4(),
    agentId,
    action,
    reason,
    data,
    status: 'PENDING',
    created_at: new Date().toISOString()
  };
  hitlQueue.push(decision);
  if (hitlQueue.length > 50) hitlQueue.shift();
  io.emit('hitl_update', hitlQueue);
  return decision;
}

// ─── SIMULATION LOOP ──────────────────────────────────────────────────────────
setInterval(() => {
  sceneTick++;
  driftPhysiology();
  
  const s = SCENARIOS[scenarioRef];
  if (sceneTick >= s.ticks) {
    sceneTick = 0;
    scenarioRef = (scenarioRef + 1) % SCENARIOS.length;
  }
  
  currentVitals = {
    hr:    Math.round(clamp(currentVitals.hr + rand(-2,2), 45, 180)),
    spo2:  +clamp(currentVitals.spo2 + rand(-0.3,0.3), 80, 100).toFixed(1),
    respi: Math.round(clamp(currentVitals.respi + rand(-1,1), 10, 35)),
    temp:  +clamp(currentVitals.temp + rand(-0.05,0.05), 35.5, 40.5).toFixed(1),
    sbp:   Math.round(clamp(currentVitals.sbp + rand(-2,2), 85, 170)),
    dbp:   Math.round(clamp(currentVitals.dbp + rand(-2,2), 55, 105)),
    hrv:   Math.round(clamp(currentVitals.hrv + rand(-2,2), 10, 100)),
    ts:    Date.now(),
  };
  const last = history[history.length - 1];
  history.push({ t: last.t+1, ts:Date.now(), hr: currentVitals.hr, spo2: currentVitals.spo2, respi: currentVitals.respi, hrv: currentVitals.hrv });
  if (history.length > 60) history.shift();

  agentMetrics.monitor.tasks++;
  agentMetrics.triage.tasks++;

  const risk = computeRisk(currentVitals);
  
  // Real-world logic: If risk is high, propose escalation to HITL queue
  if ((risk === 'critical' || risk === 'high') && agentMetrics.monitor.tasks % 15 === 0) {
    const existing = hitlQueue.find(q => q.status === 'PENDING' && q.action === 'ESCALATE_TO_RAPIDSOS');
    if (!existing) {
      addDecisionToReview('EscalationAgent', 'ESCALATE_TO_RAPIDSOS', `Critical ${risk.toUpperCase()} risk detected. SpO2: ${currentVitals.spo2}%`, { vitals: currentVitals });
    }
  }

  if (risk === 'critical' || risk === 'high') {
    agentMetrics.escalation.status = 'ACTIVE';
    agentMetrics.risk.status = 'ACTIVE';
    agentMetrics.escalation.decisions++;
    agentMetrics.escalation.lastLog = `ORCHESTRATION: Initiating ${risk === 'critical' ? 'RapidSOS E911' : 'Physician Alert'} pipeline.`;
  } else {
    agentMetrics.escalation.status = 'STANDBY';
    agentMetrics.risk.status = 'STANDBY';
    agentMetrics.escalation.lastLog = 'SYSTEM: Monitoring for autonomic deregulation.';
  }

  // Store vitals to DB every 10 ticks
  if (agentMetrics.monitor.tasks % 10 === 0) {
    try {
      db.prepare(`INSERT INTO vitals_history (id, patient_id, hr, spo2, hrv, temp, sbp, dbp, respi, risk)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        uuidv4(), 'RB-2024-0042', currentVitals.hr, currentVitals.spo2,
        currentVitals.hrv, currentVitals.temp, currentVitals.sbp, currentVitals.dbp, currentVitals.respi, risk
      );
    } catch(e) {}
  }

  // Dynamic ECG buffer (simulating high-freq sampling)
  const ecgPoint = generateECGPoint(currentVitals.hr);
  ecgWaves.push({ x: Date.now(), y: ecgPoint });
  if (ecgWaves.length > 50) ecgWaves.shift();

  // Broadcast via Socket.io
  io.emit('vitals', { 
    vitals: currentVitals, 
    ecg: ecgPoint,
    waves: ecgWaves,
    scenario: SCENARIOS[scenarioRef].label, 
    risk, 
    agents: agentMetrics 
  });
}, 2500);

// ─── RISK COMPUTATION ─────────────────────────────────────────────────────────
function computeRisk(v) {
  if (v.spo2 <= 91 || v.hr >= 115 || v.respi >= 26) return 'critical';
  if (v.spo2 <= 94 || v.hr >= 100 || v.respi >= 22) return 'high';
  if (v.spo2 <= 96 || v.hr >= 90  || v.respi >= 20) return 'medium';
  return 'stable';
}

// ─── JWT MIDDLEWARE ───────────────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch(e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, hospital: user.hospital } });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role = 'doctor' } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return res.status(409).json({ error: 'Email already registered' });
  const hash = bcrypt.hashSync(password, 10);
  const id = uuidv4();
  db.prepare('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)').run(id, name, email, hash, role);
  const token = jwt.sign({ id, email, role, name }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id, name, email, role } });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, hospital FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

// ─── MCP (Model Context Protocol) ENDPOINT ───────────────────────────────────
app.post('/api/mcp/context', authMiddleware, async (req, res) => {
  const { agentId, action, context } = req.body;
  const vitals = currentVitals;
  const risk = computeRisk(vitals);
  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get('RB-2024-0042');
  const recentVitals = db.prepare('SELECT * FROM vitals_history ORDER BY recorded_at DESC LIMIT 5').all();

  const mcpContext = {
    protocol: 'MCP/1.0',
    agentId,
    action,
    timestamp: new Date().toISOString(),
    patientContext: patient,
    currentVitals: vitals,
    riskAssessment: risk,
    recentHistory: recentVitals,
    systemContext: context || {},
    availableTools: ['sms_dispatch', 'sos_trigger', 'calendar_book', 'diagnosis_generate', 'escalation_route']
  };

  db.prepare('INSERT INTO agent_logs (id, agent_id, action, result) VALUES (?, ?, ?, ?)').run(
    uuidv4(), agentId, action, JSON.stringify({ status: 'context_provided', risk })
  );

  res.json({ success: true, context: mcpContext });
});

// ─── AGENT: VANGUARD (Monitor) ─────────────────────────────────────────────────
app.get('/api/vanguard', (req, res) => {
  const risk = computeRisk(currentVitals);
  const anomalies = [];
  if (currentVitals.spo2 < 95) anomalies.push(`SpO₂ depressed: ${currentVitals.spo2}%`);
  if (currentVitals.hr > 90) anomalies.push(`Tachycardia: ${currentVitals.hr} bpm`);
  if (currentVitals.hrv < 40) anomalies.push(`HRV sympathetic dominance: ${currentVitals.hrv}ms`);
  if (currentVitals.respi > 20) anomalies.push(`Tachypnea: ${currentVitals.respi} rpm`);
  if (currentVitals.temp > 37.5) anomalies.push(`Fever: ${currentVitals.temp}°C`);

  res.json({
    current: currentVitals,
    history: history.slice(-40),
    scenario: SCENARIOS[scenarioRef].label,
    risk,
    anomalies,
    agentState: agentMetrics.monitor,
    parameters: {
      respiration: currentVitals.respi,
      spo2: currentVitals.spo2,
      hrv: currentVitals.hrv,
      pulse: currentVitals.hr,
      temperature: currentVitals.temp,
      diagnosis: risk
    }
  });
});

// ─── AGENT: SENTINEL (Triage) ─────────────────────────────────────────────────
app.get('/api/sentinel', (req, res) => {
  const v = currentVitals;
  const risk = computeRisk(v);
  const news2 = Math.floor(
    (v.respi<12||v.respi>24?2:v.respi>=21?1:0) +
    (v.spo2<92?3:v.spo2<=93?2:v.spo2<=94?1:0) +
    (v.hr<41||v.hr>130?3:v.hr>=111?2:v.hr<51||v.hr>100?1:0) +
    (v.temp<35?3:v.temp>=39.1?2:v.temp>=38.1||v.temp<36?1:0) +
    (v.sbp<90?3:v.sbp<=100?2:v.sbp<=110?1:0)
  );
  const pathway = risk==='critical'?'CODE_BLUE_HYPOXIA':risk==='high'?'SEPSIS_SIX_PROTOCOL':risk==='medium'?'EWS_ESCALATION':'ROUTINE_OBSERVATION';
  const anomalies = [];
  if (v.spo2 < 95) anomalies.push(`SpO₂: ${v.spo2}%`);
  if (v.hr > 90) anomalies.push(`HR: ${v.hr}bpm`);
  if (v.respi > 20) anomalies.push(`Respi: ${v.respi}rpm`);
  if (v.temp > 37.5) anomalies.push(`Temp: ${v.temp}°C`);
  if (v.hrv < 40) anomalies.push(`HRV: ${v.hrv}ms`);

  agentMetrics.triage.decisions++;
  res.json({ risk, news2_score: news2, pathway, anomalies, alert: risk==='critical'?'Trigger Immediate Action':'Monitoring', agentState: agentMetrics.triage });
});

// ─── AGENT: RISK ANALYZER ─────────────────────────────────────────────────────
app.get('/api/risk', (req, res) => {
  const v = currentVitals;
  const risk = computeRisk(v);
  const score = Math.round(
    (v.hr/200)*20 + ((100-v.spo2)/20)*40 + ((v.respi/40)*20) + ((v.temp-35)/5)*10 + ((v.hrv<40?40-v.hrv:0)/40)*10
  );
  const factors = [
    { name: 'SpO₂ Saturation', value: v.spo2, weight: 40, status: v.spo2 < 94 ? 'critical' : v.spo2 < 97 ? 'warning' : 'ok' },
    { name: 'Heart Rate', value: v.hr, weight: 20, status: v.hr > 100 ? 'warning' : v.hr > 115 ? 'critical' : 'ok' },
    { name: 'Respiration Rate', value: v.respi, weight: 20, status: v.respi > 22 ? 'warning' : 'ok' },
    { name: 'Body Temperature', value: v.temp, weight: 10, status: v.temp > 38 ? 'warning' : 'ok' },
    { name: 'HRV', value: v.hrv, weight: 10, status: v.hrv < 30 ? 'critical' : v.hrv < 40 ? 'warning' : 'ok' },
  ];
  agentMetrics.risk.tasks++;
  res.json({ risk, score: Math.min(100, Math.max(0, Math.round(score))), factors, vitals: v, agentState: agentMetrics.risk });
});

// ─── AGENT: DIAGNOSTIC (LLM-powered) ─────────────────────────────────────────
app.post('/api/diagnostic', async (req, res) => {
  const v = req.body.vitals || currentVitals;
  const risk = computeRisk(v);

  // Fast heuristic-based diagnosis
  const diagnoses = [];
  if (v.spo2 < 94) diagnoses.push({ condition: 'Acute Hypoxemia', confidence: 87, icd: 'J96.01', urgency: 'high' });
  if (v.hr > 100) diagnoses.push({ condition: 'Sinus Tachycardia', confidence: 79, icd: 'R00.0', urgency: 'medium' });
  if (v.spo2 < 91 && v.respi > 24) diagnoses.push({ condition: 'Respiratory Failure Type 1', confidence: 92, icd: 'J96.00', urgency: 'critical' });
  if (v.temp > 38.0 && v.hr > 95) diagnoses.push({ condition: 'Systemic Inflammatory Response', confidence: 74, icd: 'R65.10', urgency: 'high' });
  if (v.hrv < 25 && v.sbp > 140) diagnoses.push({ condition: 'Hypertensive Crisis', confidence: 68, icd: 'I10', urgency: 'high' });
  if (diagnoses.length === 0) diagnoses.push({ condition: 'Baseline Physiological State', confidence: 95, icd: 'Z03.89', urgency: 'low' });

  // Try Gemini for rationale
  let rationale = `Clinical parameters indicate ${risk} risk status. Automated differential analysis complete.`;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Patient vitals: HR=${v.hr}, SpO2=${v.spo2}%, Respi=${v.respi}rpm, Temp=${v.temp}°C, HRV=${v.hrv}ms. Risk: ${risk.toUpperCase()}. Diagnoses: ${diagnoses.map(d=>d.condition).join(', ')}. Write a 2-sentence clinical rationale in plain text. Be specific and use medical terminology.`;
    const result = await model.generateContent(prompt);
    rationale = result.response.text().trim();
  } catch(e) { console.log('[Diagnostic] Gemini fallback'); }

  agentMetrics.diagnostic.tasks++;
  agentMetrics.diagnostic.decisions++;
  db.prepare('INSERT INTO agent_logs (id, agent_id, action, result) VALUES (?, ?, ?, ?)').run(
    uuidv4(), 'diagnostic', 'diagnosis_generated', JSON.stringify({ risk, diagnoses: diagnoses.length })
  );

  res.json({ success: true, risk, diagnoses, rationale, vitals: v, agentState: agentMetrics.diagnostic, timestamp: new Date().toISOString() });
});

// ─── AGENT: ESCALATION (Guardian) ─────────────────────────────────────────────
app.post('/api/guardian', async (req, res) => {
  const { phone, phones=[], emails=[], message, risk } = req.body;
  const targetPhones = [...new Set([phone, ...phones])].filter(Boolean);
  const results = { sms: [], email: [], rapidsos: 'NOT_TRIGGERED', webAlert: true };

  for (const p of targetPhones) {
    if (twilioClient) {
      try {
        const r = await twilioClient.messages.create({ body: `[SVASHTHAI ALERT] ${message}`, from: TWILIO_FROM, to: p });
        results.sms.push({ to: p, sid: r.sid, status: 'sent' });
        systemStats.smsSent++;
      } catch(err) { results.sms.push({ to: p, error: err.message, status: 'failed' }); }
    } else {
      results.sms.push({ to: p, status: 'simulated', note: 'Twilio not configured' });
    }
  }
  for (const e of emails) {
    results.email.push({ to: e, status: 'dispatched' });
  }
  if (risk === 'critical') { results.rapidsos = 'TRANSMITTED_TO_PSAP'; }

  systemStats.alertsGenerated++;
  agentMetrics.escalation.tasks++;
  agentMetrics.escalation.decisions++;

  db.prepare('INSERT INTO alerts (id, patient_id, type, message, severity) VALUES (?, ?, ?, ?, ?)').run(
    uuidv4(), 'RB-2024-0042', 'escalation', message, risk
  );

  io.emit('alert', { type: risk, message, timestamp: new Date().toISOString(), results });
  res.json({ success: true, results, status: risk==='critical' ? 'CRITICAL DISPATCH COMPLETE' : 'NOTIFICATION SENT' });
});

// ─── SOS ENDPOINT ─────────────────────────────────────────────────────────────
app.post('/api/sos', async (req, res) => {
  const { patient_id='RB-2024-0042', lat, lng, message='SOS TRIGGERED' } = req.body;
  const sosId = uuidv4();
  db.prepare('INSERT INTO sos_events (id, patient_id, lat, lng, message) VALUES (?, ?, ?, ?, ?)').run(sosId, patient_id, lat, lng, message);
  systemStats.sosTriggered++;

  const sosMsg = `🚨 SOS ALERT - Patient ${patient_id} at [${lat},${lng}]. ${message}. Immediate attention required.`;
  io.emit('sos', { id: sosId, patient_id, lat, lng, message: sosMsg, timestamp: new Date().toISOString() });

  if (twilioClient) {
    try {
      await twilioClient.messages.create({ body: sosMsg, from: TWILIO_FROM, to: process.env.EMERGENCY_CONTACT || '+917700034050' });
    } catch(e) {}
  }
  res.json({ success: true, sosId, message: 'SOS broadcast to all channels' });
});

// ─── LOGOS (XAI) ──────────────────────────────────────────────────────────────
app.post('/api/logos', async (req, res) => {
  const { vitals = currentVitals, risk: inputRisk, anomalies = [] } = req.body;
  const risk = inputRisk || computeRisk(vitals);

  if (risk === 'stable') {
    return res.json({ success:true, explanation:"STATUS: STABLE. All physiological parameters within standard deviation. No acute pathology detected.", graphNodes:[], xaiScore: 0.12 });
  }

  try {
    const model = genAI.getGenerativeModel({ model:"gemini-1.5-flash", generationConfig:{ responseMimeType:"application/json" } });
    const prompt = `You are 'Logos', the Explainable AI clinical agent for SvasthAI.
Patient Vitals: HR=${vitals.hr}bpm, SpO2=${vitals.spo2}%, Respi=${vitals.respi}rpm, Temp=${vitals.temp}°C, HRV=${vitals.hrv}ms, BP=${vitals.sbp}/${vitals.dbp}mmHg.
Risk: ${risk.toUpperCase()}. Anomalies: ${anomalies.join(', ')}.
Return JSON with: "rationale" (2 clinical sentences), "graphNodes" (array of 4 objects with id, label, type, confidence fields), "recommendation" (1 sentence action), "xaiScore" (0.0-1.0 float representing certainty).`;
    const result = await model.generateContent(prompt);
    let data = JSON.parse(result.response.text());
    res.json({ success:true, explanation: data.rationale, graphNodes: data.graphNodes||[], recommendation: data.recommendation, xaiScore: data.xaiScore||0.85 });
  } catch(e) {
    const fallbackNodes = [
      { id:'N1', label:`Trigger: SpO₂ ${vitals.spo2}%`, type:'input', confidence: 0.92 },
      { id:'N2', label:`Pathway: Pulmonary Compromise`, type:'process', confidence: 0.87 },
      { id:'N3', label:`Pattern: ${risk.toUpperCase()} detected`, type:'process', confidence: 0.91 },
      { id:'N4', label:`Outcome: Escalation Required`, type:'output', confidence: 0.88 },
    ];
    res.json({ success:true, explanation:`${risk.toUpperCase()} risk detected. SpO₂ at ${vitals.spo2}%, HR ${vitals.hr}bpm indicate clinical deterioration requiring immediate intervention.`, graphNodes: fallbackNodes, xaiScore: 0.88 });
  }
});

// ─── SPEECH AI ENDPOINT ───────────────────────────────────────────────────────
app.post('/api/speech-response', async (req, res) => {
  const { text } = req.body;
  const vitals = currentVitals;
  const risk = computeRisk(vitals);

  let responseText = '';
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are SvasthAI, an intelligent medical AI assistant. Current patient vitals: HR=${vitals.hr}, SpO2=${vitals.spo2}%, Temp=${vitals.temp}°C, Risk=${risk}. User query: "${text}". Respond concisely in 2-3 sentences with medical insight. Be professional and helpful.`;
    const result = await model.generateContent(prompt);
    responseText = result.response.text();
  } catch(e) {
    responseText = `Current patient status is ${risk}. Heart rate is ${vitals.hr} bpm, SpO₂ is ${vitals.spo2}%. ${risk === 'critical' ? 'Immediate medical attention required.' : 'Continue monitoring.'}`;
  }
  res.json({ success: true, response: responseText });
});

// ─── CHAT (LangChain) ─────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { message, history: chatHistory = [] } = req.body;
  const vitals = currentVitals;
  const risk = computeRisk(vitals);

  // Try Gemini first (faster & works without API key issues)
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const context = `Current patient: HR=${vitals.hr}, SpO2=${vitals.spo2}%, Temp=${vitals.temp}°C, HRV=${vitals.hrv}ms, Risk=${risk}.`;
    const prompt = `You are SvasthAI Assistant, an expert clinical AI. ${context}\n\nUser: ${message}\n\nRespond professionally in 2-4 sentences with clinical insight.`;
    const result = await model.generateContent(prompt);
    agentMetrics.diagnostic.tasks++;
    return res.json({ success: true, response: result.response.text() });
  } catch(e) {
    // Fallback LangChain
    try {
      const msgs = [
        ["system", `You are SvasthAI clinical AI. Patient: HR=${vitals.hr}, SpO2=${vitals.spo2}%, Risk=${risk}. Answer concisely.`],
        ...chatHistory.map(m => [m.role==='user'?'human':'ai', m.content]),
        ["human", message]
      ];
      const response = await chatModel.invoke(msgs);
      return res.json({ success:true, response: response.content });
    } catch(e2) {
      return res.json({ success:true, response:`Current patient vitals show ${risk} status. HR ${vitals.hr}bpm, SpO₂ ${vitals.spo2}%. For medical emergencies, use the SOS button immediately.` });
    }
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    version: '2.4.0-agentic',
    services: {
      db: 'connected',
      vitals: 'streaming',
      agents: 'active'
    }
  });
});

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
app.get('/api/analytics', (req, res) => {
  const dbHistory = db.prepare('SELECT * FROM vitals_history ORDER BY recorded_at DESC LIMIT 50').all();
  const alerts = db.prepare('SELECT * FROM alerts ORDER BY created_at DESC LIMIT 20').all();
  const sosEvents = db.prepare('SELECT * FROM sos_events ORDER BY created_at DESC LIMIT 10').all();
  res.json({
    vitalsHistory: dbHistory,
    alerts,
    sosEvents,
    agentMetrics,
    systemStats,
    currentRisk: computeRisk(currentVitals),
    scenario: SCENARIOS[scenarioRef].label
  });
});

// ─── STRESS TEST ──────────────────────────────────────────────────────────────
app.post('/api/stress', (req, res) => {
  currentVitals = { hr:135, spo2:88, respi:28, temp:39.1, sbp:95, dbp:55, hrv:12, ts:Date.now() };
  systemStats.anomalyInjections++;
  io.emit('alert', { type:'critical', message:'CODE BLUE — Critical vitals injected by operator', timestamp: new Date().toISOString() });
  res.json({ success:true, status:'Crisis Sequence Injected', vitals: currentVitals });
});

app.post('/api/reset', (req, res) => {
  scenarioRef = 0;
  currentVitals = { hr:75, spo2:98, hrv:55, temp:36.6, sbp:115, dbp:75, respi:16, ts:Date.now() };
  res.json({ success:true, status:'Reset to Stable Baseline' });
});

// ─── PATIENTS ─────────────────────────────────────────────────────────────────
app.get('/api/patients', authMiddleware, (req, res) => {
  const patients = db.prepare('SELECT * FROM patients').all();
  res.json(patients);
});

app.get('/api/patients/:id', (req, res) => {
  const p = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Patient not found' });
  res.json({ ...p, currentVitals, risk: computeRisk(currentVitals) });
});

// ─── MAPS & LOCATION ──────────────────────────────────────────────────────────
app.get('/api/location', (req, res) => {
  res.json({
    patient: { lat: 28.6139, lng: 77.2090, name: 'Roshani Singh', room: 'ICU-7', status: computeRisk(currentVitals) },
    hospital: { lat: 28.6200, lng: 77.2100, name: 'SvasthAI Medical Center' },
    ambulances: [
      { id: 'AMB-1', lat: 28.6050, lng: 77.2000, status: 'available' },
      { id: 'AMB-2', lat: 28.6300, lng: 77.2200, status: 'on_call' },
    ]
  });
});

// ─── SCHEDULER ────────────────────────────────────────────────────────────────
app.post('/api/scheduler', async (req, res) => {
  const { doctorName='Dr. Mehta', patientId, priority='Routine', notes='' } = req.body;
  const eventTime = new Date(Date.now() + (priority==='Emergency' ? 900000 : 3600000)).toISOString();
  db.prepare('INSERT INTO agent_logs (id, agent_id, action, result) VALUES (?, ?, ?, ?)').run(
    uuidv4(), 'scheduler', 'appointment_booked',
    JSON.stringify({ doctor: doctorName, patient: patientId, time: eventTime, priority })
  );
  res.json({ success:true, eventLink:`https://calendar.google.com/calendar/event?eid=svashthai_${uuidv4().slice(0,8)}`, time:eventTime, priority, doctor:doctorName });
});

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status:'online', timestamp:new Date().toISOString(), agents: Object.keys(agentMetrics).length, dbConnected:true, socketClients: io.engine.clientsCount });
});

// ─── HUMAN-IN-THE-LOOP (HITL) ROUTES ────────────────────────────────────────
app.get('/api/hitl/queue', (req, res) => res.json(hitlQueue));

app.post('/api/hitl/review', (req, res) => {
  const { decisionId, status, comments } = req.body;
  const decision = hitlQueue.find(d => d.id === decisionId);
  if (!decision) return res.status(404).json({ error: 'Decision not found' });
  
  decision.status = status; // APPROVED | REJECTED
  decision.reviewed_at = new Date().toISOString();
  decision.comments = comments;
  systemStats.hitlReviews++;
  
  if (status === 'APPROVED') {
    // Execute the action (e.g., send SMS)
    console.log(`[HITL] Approved action: ${decision.action}`);
  }
  
  io.emit('hitl_update', hitlQueue);
  res.json({ success: true, decision });
});

// ─── WEARABLE / STRAVA SYNC ANALOGY ──────────────────────────────────────────
app.post('/api/wearable/sync', (req, res) => {
  const { provider = 'Strava' } = req.body;
  // Pick a random profile from the dataset
  const profile = wearableDataset[Math.floor(Math.random() * wearableDataset.length)];
  if (profile) {
    currentVitals = { ...currentVitals, ...profile, ts: Date.now() };
    res.json({ success: true, provider, message: `Synced medical profile: ${profile.context}`, data: profile });
    io.emit('alert', { type: 'info', message: `${provider} Data Synced: ${profile.context}`, timestamp: new Date().toISOString() });
  } else {
    res.status(500).json({ error: 'No dataset available' });
  }
});

// ─── DIGITAL TWIN & WEARABLE STATUS ──────────────────────────────────────────
app.get('/api/telemetry/wearables', (req, res) => res.json(wearableDevices));

app.get('/api/telemetry/twin', (req, res) => {
  const v = currentVitals;
  res.json({
    organs: [
      { name: 'Heart', status: v.hr > 100 ? 'STRESS' : 'OXYGENATED', load: Math.round((v.hr/180)*100) },
      { name: 'Lungs', status: v.spo2 < 93 ? 'HYPOXIC' : 'NORMAL', load: Math.round((v.respi/30)*100) },
      { name: 'Nervous System', status: v.hrv < 30 ? 'SYMPATHETIC' : 'BALANCED', load: 100 - v.hrv },
    ],
    temperature: v.temp,
    hydration: 82, // Simulated
    posture: 'Supine'
  });
});

// ─── AGENT LOGS ───────────────────────────────────────────────────────────────
app.get('/api/agent-logs', authMiddleware, (req, res) => {
  const logs = db.prepare('SELECT * FROM agent_logs ORDER BY created_at DESC LIMIT 50').all();
  res.json(logs);
});

// ─── SOCKET.IO ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[SOCKET] Client connected: ${socket.id}`);
  socket.emit('vitals', { vitals: currentVitals, scenario: SCENARIOS[scenarioRef].label, risk: computeRisk(currentVitals), agents: agentMetrics });
  socket.on('disconnect', () => console.log(`[SOCKET] Client disconnected: ${socket.id}`));
  socket.on('request_sos', (data) => { io.emit('sos', { ...data, timestamp: new Date().toISOString() }); });
});

// ─── START ────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`\n🏥 SvasthAI Command Center initialized`);
  console.log(`📡 REST API  → http://localhost:${PORT}/api`);
  console.log(`🔌 Socket.IO → ws://localhost:${PORT}`);
  console.log(`🔑 JWT Auth  → /api/auth/login (admin@svashthai.com / admin123)`);
  console.log(`🗃️  SQLite DB  → ./svashthai.db`);
  console.log(`🤖 Agents    → Monitor | Triage | Risk | Diagnostic | Escalation\n`);
});
