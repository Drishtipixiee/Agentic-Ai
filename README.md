# 🏥 SvasthAI: Autonomous Clinical Intelligence V2.4

**SvasthAI** is a high-fidelity, autonomous multi-agent ecosystem designed to eliminate the "latency gap" in critical care. It transforms reactive monitoring into proactive clinical action by fusing 250Hz biosensor telemetry with Large Language Model (LLM) reasoning.

---

## 🔍 The "What" and "Why"
### **The Problem (The "Why")**
Studies show that ICU mortality increases by **~8% for every unit hour of delayed clinical intervention**. In traditional settings, monitors are passive; they only alarm when a vital sign crosses a static threshold. By then, the patient is already in crisis.

### **The Solution (The "What")**
**SvasthAI** is a proactive system. It doesn't just watch vitals; it *orchestrates* survival. It uses a 5-agent pipeline to ingest data, calculate risk, generate differential diagnoses, and coordinate emergency services autonomously — with **Human-in-the-Loop (HITL)** oversight for final authorization.

---

## 🤖 How It Works: The Agent Lifecycle

The system operates as a **Sequential Multi-Agent Pipeline**:

1.  **◉ Vanguard (Monitor Agent)**: 
    - **Data Ingestion**: Samples physiological streams (HR, SpO2, Temp, etc.) at high frequency.
    - **Logic**: Filters sensor noise and maintains a "moving average" of patient stability.
2.  **◈ Sentinel (Triage Agent)**:
    - **Risk Scoring**: Implements the **NEWS2 (National Early Warning Score)** algorithm.
    - **Analogy**: Acts as the first-response nurse, categorizing the patient into Stable, Medium, or Critical pathways.
3.  **◆ Risk Analyzer (Predictive Agent)**:
    - **Deep Analysis**: Analyzes physiological drift. It doesn't just look at the value; it looks at the **velocity of deterioration**.
    - **Trigger**: Activates if the risk score exceeds 5 or if a single vital (like SpO2) drops below 92%.
4.  **◇ Logos (Diagnostic Agent)**:
    - **Intelligence**: Utilizes **Google Gemini 1.5 Flash** to generate medical rationales.
    - **Output**: Produces ICD-10 differential hypotheses based on the last 5 minutes of telemetry.
5.  **◎ Guardian (Escalation Agent)**:
    - **Action**: Coordinates with **Twilio** for SMS alerts and **Google Maps API** for ambulance dispatch.
    - **HITL Verification**: Critical actions are queued for physician approval on the Dashboard.

---

## ⚙️ Trigger Mechanisms: The "When"

The system moves from "Monitoring" to "Active Intervention" when specific **Clinical Triggers** are met:

| Trigger Event | Threshold | Agent Action |
|---|---|---|
| **Hypoxia Alert** | SpO2 < 91% | Sentinel triggers "CODE BLUE" Protocol |
| **Tachycardia** | HR > 115 bpm | Vanguard flags "Sympathetic Storm" pattern |
| **Sepsis Prodrome** | Temp > 38.5°C + NEWS2 > 4 | Risk Analyzer initiates "Sepsis-6" Pathway |
| **Systemic Failure** | 3+ vitals in warning zone | Logos generates Differential Diagnosis |
| **Manual Override** | User clicks "SOS" | Guardian initiates Immediate PSAP Broadcast |

---

## 💾 Data & Architecture

### **Database (The "Where")**
- **Persistence**: Powered by **SQLite** (`svasthai.db`), located in the project root.
- **Speed**: We use `better-sqlite3` for ultra-low latency reads/writes of vital history.
- **What's Stored?**: 
  - `users`: Doctor/Admin credentials (JWT secured).
  - `patients`: Clinical profiles (Age, Ward, Blood Group).
  - `vitals_history`: Time-series logs of every heart rate, SpO2, and HRV data point.
  - `agent_logs`: Audit trail of every decision made by the AI agents.

### **Clinical Datasets**
The system uses `data/vitals_dataset.json`, a curated collection of **7 real-world clinical scenarios** (e.g., Sepsis, Respiratory Failure, Stable Recovery). This ensures the AI is tested against diverse, realistic physiological patterns.

---

## 🛠 Tech Stack Overview

- **Frontend**: React 18, Vite, D3-inspired SVG waves, Framer Motion animations.
- **Backend**: Node.js, Socket.IO (Real-time Vitual Streaming), Express.
- **AI**: Google Gemini API (Reasoning), LangChain (Memory), DeepSeek (Specialized Clinical Tasks).
- **Communication**: Twilio SMS (Dispatching), Google Maps (GIS Location).

---

## ☁️ Deployment Guide

### **1. Frontend (Vercel)**
The SvasthAI UI can be deployed as a static site:
1.  Connect your GitHub repo to **Vercel**.
2.  Set the **Build Command**: `npm run build`.
3.  Set the **Output Directory**: `dist`.
4.  **CRITICAL**: Add the Environment Variable `VITE_API_URL` and point it to your deployed Backend URL.

### **2. Backend (Render / Railway)**
Since the backend uses **Socket.io** and **SQLite**, it requires a "Web Service" (not serverless):
1.  Deploy to **Render.com** or **Railway.app**.
2.  Set the **Start Command**: `node server.js`.
3.  Add all keys from `.env` to the service environment variables.
4.  For Render, add a **Disk Space** mount at `/svashthai.db` if you want persistent data between restarts.

---

**Developed by Antigravity AI — Bridging the gap between Data and Life.**
