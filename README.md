# SvasthAI: Autonomous Clinical Intelligence V4.2

**SvasthAI** is a high-fidelity, autonomous multi-agent ecosystem designed to eliminate the "latency gap" in critical care. 
---

##  System Architecture

```
📡 VanguardAgent  →  ◈ SentinelAgent  →  ◆ RiskAnalyzer  →  ◇ LogosAgent  →  ◎ GuardianAgent
      ↓                      ↓                    ↓                    ↓                      ↓
  D3 Oscillation        NEWS2 Logic           Entropy (Φ)          Gemini 1.5           RapidSOS/SMS
```

--- 

## Built with Node.js, React, Gemini 1.5, Socket.io, and SQLite.

## What it does

SvasthAI runs five agents in a pipeline. Each one has a specific job:

## VanguardAgent — reads incoming vitals and detects oscillation patterns
## SentinelAgent — applies NEWS2 scoring logic to flag deterioration
## RiskAnalyzer — calculates stability index from HR, SpO2, and HRV trends
## LogosAgent — calls Gemini 1.5 to generate a differential diagnosis when risk is high
## GuardianAgent — triggers emergency alerts (SMS / PSAP broadcast) on critical events
---

When vitals cross a threshold, the pipeline activates automatically — no manual input needed.
## Trigger logic
## Trigger
## Threshold
## Response
## Hypoxia
## SpO2 < 91%
## CODE BLUE protocol
## Tachycardia
## HR > 115 bpm
## Sympathetic Storm flag
## Sepsis risk
## Temp > 38.5°C + NEWS2 > 4
## Sepsis-6 pathway
---

## Multi-system
3+ vitals in warning zone
Gemini differential diagnosis
Manual SOS
User button
Immediate alert broadcast
---
## Tech stack
Frontend: React + Vite, D3.js for vitals visualization, CSS with glassmorphism panels
Backend: Node.js + Express + Socket.io for real-time updates
Database: SQLite via better-sqlite3 — stores vitals history, agent decision logs, user credentials
AI: Gemini 1.5 API for clinical reasoning
Auth: JWT
Deployment: Frontend on Vercel, backend on Render or Railway
Data
Uses data/vitals_dataset.json — 7 clinical scenarios including respiratory failure and cardiac stress — to simulate real patient inputs during demo.
---
## Local setup
Bash
Create a .env file:
Code
Run backend:
Bash
Run frontend:
Bash
---
## Deployment
Frontend deploys as a static site on Vercel. Set VITE_API_URL to your backend URL in Vercel environment variables.
Backend needs a persistent web service (Render or Railway) for Socket.io and SQLite to work correctly.
Status
Work in progress. Core agent pipeline and dashboard are functional. Emergency broadcast integration is partially simulated.
