# 🏥 Golden Hour — Multi-Agent Autonomous Clinical Escalation System

**Runtime Rebels** | 2026 Hackathon Entry

A fully software-based **clinical brain** — a self-managing multi-agent system for autonomous patient monitoring, risk assessment, and emergency escalation.

---

## Architecture

```
📡 MonitoringAgent  →  🔐 PrivacyAgent  →  🩺 TriageAgent  →  🔬 DiagnosticAgent  →  🚨 EscalationAgent
      ↓                      ↓                    ↓                    ↓                      ↓
  MongoDB              AES-256-GCM             NEWS2+HRV           PubMed RAG            RapidSOS/Twilio
                        Encryption           Chain-of-Dx          Evidence DB             (Stubs)
```

**Stack**: MongoDB · Express · React (Vite) · Node.js · Socket.io

---

## Quick Start

### Prerequisites
- Node.js 20+
- MongoDB running locally on `mongodb://127.0.0.1:27017`

### 1. Install Dependencies

```powershell
# Server
cd server
npm install

# Client
cd ../client
npm install
```

### 2. Start MongoDB
```powershell
mongod --dbpath ./data/db
```

### 3. Start the Backend
```powershell
cd server
node index.js
# → Server running on http://localhost:5000
```

### 4. Start the Dashboard
```powershell
cd client
npm run dev
# → Dashboard at http://localhost:5173
```

---

## Clinical Brain Features

| Feature | Implementation |
|---|---|
| Risk Scoring | NEWS2 (6 parameters) + HRV (SDNN/RMSSD/LF-HF) |
| AI Reasoning | Chain-of-Diagnosis + PubMed RAG evidence |
| Explainability | SHAP-proxy feature importance panel |
| Privacy | AES-256-GCM field-level PHI encryption |
| Safety | 95% confidence threshold + kill switch |
| Escalation | RapidSOS E911 + Twilio stubs |

## Scenarios

| Scenario | Description |
|---|---|
| `STABLE` | Baseline healthy patient |
| `DETERIORATING` | Sepsis progression over time |
| `CRITICAL` | Acute decompensation |

---

*Citing: Royal College of Physicians NEWS2 (2017) · PMID:28090692 · Singer et al. JAMA 2016*
