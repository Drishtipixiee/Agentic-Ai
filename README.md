# 🏥 SvasthAI: Autonomous Clinical Intelligence V4.2

**SvasthAI** is a high-fidelity, autonomous multi-agent ecosystem designed to eliminate the "latency gap" in critical care. It transforms reactive monitoring into proactive clinical action by fusing 250Hz biosensor telemetry with Large Language Model (LLM) reasoning.

---

## 🤖 System Architecture

```
📡 VanguardAgent  →  ◈ SentinelAgent  →  ◆ RiskAnalyzer  →  ◇ LogosAgent  →  ◎ GuardianAgent
      ↓                      ↓                    ↓                    ↓                      ↓
  D3 Oscillation        NEWS2 Logic           Entropy (Φ)          Gemini 1.5           RapidSOS/SMS
```

---

## 🌟 Wondrous V4.2 Enhancements

### **1. Digital Twin Pro (Holo-Scan Edition)**
A high-fidelity anatomical digital twin that visualizes neural load, cardiovascular stress, and pulmonary oxygenation in real-time. Features a custom **Holo-Scanner** animation that simulates deep-tissue neural mapping.

### **2. Clinical Stability Index (Φ)**
Autonomous analysis of "Digital Entropy" (Φ) — calculating the chaotic drift in physiological parameters. It distinguishes between **Sympathetic Dominant** (Stress) and **Parasympathetic Recovery** (Rest) states using HRV-fusion logic.

### **3. Immersive Command Center**
The dashboard now features an **Immersive Scan-Line Design System**, replicating the high-stakes environment of a modern ICU Command Center. This includes glass-morphism panels, real-time D3 oscillation waves, and neural confidence tracking.

### **4. Autonomous ANS Tracking**
The simulation engine now models the Autonomic Nervous System (ANS). It dynamically adjusts "Hypoxic Drive" and "Neural Accuracy" based on SpO2 and HR trends, providing a true clinical analogy for physiological compensation.

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
- **Speed**: We use `better-sqlite3` for ultra-low latency reads/writes.
- **What's Stored?**: 
  - `users`: Doctor/Admin credentials (JWT secured).
  - `vitals_history`: Time-series logs of heart rate, SpO2, and HRV.
  - `agent_logs`: Audit trail of every decision made by the AI agents.

### **Clinical Datasets**
The system uses `data/vitals_dataset.json`, a curated collection of **7 real-world clinical scenarios** (e.g., Respiratory Failure, Cardiac Stress).

---

## ☁️ Deployment Guide

### **1. Frontend (Vercel)**
Deploy as a static site. Set `VITE_API_URL` to your Backend URL.

### **2. Backend (Render / Railway)**
Requires a persistent "Web Service" for Socket.io and SQLite. Add `.env` keys to service variables.

---

**Developed by Antigravity AI — Bridging the gap between Data and Life.**
