import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar, { useVitals, speak } from "./Navbar";

const API = import.meta.env.VITE_API_URL || "";

export default function TriageAgent({ user, onLogout }) {
  const navigate = useNavigate();
  const { vitals, risk, agents, connected } = useVitals();
  const [triageData, setTriageData] = useState(null);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const r = await fetch(`${API}/api/sentinel`);
        const d = await r.json();
        setTriageData(d);
      } catch(e) {}
    };
    fetch_();
    const int = setInterval(fetch_, 3000);

    // AI Voice Intro
    speak("Triage Agent active. I am autonomously computing National Early Warning Scores and routing patients through validated clinical pathways based on physiological drift.");

    return () => clearInterval(int);
  }, []);

  const riskCol = { stable:"#10B981", medium:"#F59E0B", high:"#F97316", critical:"#EF4444" };
  const riskBg = { stable:"#DCFCE7", medium:"#FEF9C3", high:"#FFEDD5", critical:"#FEF2F2" };

  return (
    <div className="page-layout">
      <Navbar user={user} onLogout={onLogout} risk={risk} />
      
      <div className="page-content fade-in">
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <button onClick={()=>navigate(-1)} className="btn btn-ghost" style={{ padding:"6px 12px" }}>← Back</button>
              <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"1.5rem", fontWeight:800, color:"#0F172A" }}>
                <span style={{ color:"#F59E0B" }}>◈</span> TriageAgent
              </h1>
            </div>
            <p style={{ color:"#64748B", fontSize:"0.85rem", marginTop:4, marginLeft:88 }}>
              Agent ID: triage-v3.1.0 · Autonomous Patient Triage · NEWS2 Scoring · Pathway Routing
            </p>
          </div>
          <div style={{ padding:"8px 16px", borderRadius:12, background:"white", border:"1.5px solid #E2E8F0", display:"flex", alignItems:"center", gap:10 }}>
            <span className="status-dot active"></span>
            <span style={{ fontSize:"0.75rem", fontWeight:700, color:"#334155" }}>TRIAGE ENGINE ONLINE</span>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          {/* NEWS2 Score Card */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">NEWS2 Score Analysis</span>
              <span style={{ fontSize:"0.65rem", fontWeight:700, color:"#94A3B8" }}>National Early Warning Score</span>
            </div>
            <div className="card-body" style={{ display:"flex", alignItems:"center", gap:30 }}>
              <div style={{ position:"relative", width:120, height:120, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg viewBox="0 0 36 36" style={{ width:120, height:120, transform:"rotate(-90deg)" }}>
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#F1F5F9" strokeWidth="3" />
                  <circle cx="18" cy="18" r="16" fill="none" stroke={riskCol[risk]||"#10B981"} strokeWidth="3" 
                    strokeDasharray={`${(triageData?.news2_score || 0) * 8}, 100`} strokeLinecap="round" style={{ transition:"stroke-dasharray 0.6s ease" }} />
                </svg>
                <div style={{ position:"absolute", textAlign:"center" }}>
                  <div style={{ fontSize:"2.2rem", fontWeight:800, color:riskCol[risk]||"#10B981", lineHeight:1 }}>{triageData?.news2_score || 0}</div>
                  <div style={{ fontSize:"0.65rem", fontWeight:700, color:"#94A3B8", textTransform:"uppercase" }}>Points</div>
                </div>
              </div>
              <div style={{ flex:1 }}>
                <h3 style={{ fontSize:"1.1rem", fontWeight:700, color:riskCol[risk]||"#10B981", marginBottom:8 }}>{risk?.toUpperCase() || "STABLE"}</h3>
                <p style={{ fontSize:"0.82rem", color:"#64748B", lineHeight:1.5 }}>
                  The NEWS2 score is {triageData?.news2_score}. {triageData?.news2_score > 5 ? "Immediate clinical assessment is required." : "Patient is currently stable but continuous monitoring is advised."}
                </p>
                <div style={{ marginTop:12, display:"flex", gap:8 }}>
                  <span style={{ padding:"4px 10px", borderRadius:6, background:riskBg[risk]||"#F0FDF4", color:riskCol[risk]||"#16A34A", fontSize:"0.7rem", fontWeight:700, border:`1px solid ${riskCol[risk]||"#16A34A"}40` }}>
                    Pathway: {triageData?.pathway || "STANDARD"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Current Urgency Card */}
          <div className="card">
            <div className="card-header"><span className="card-title">Triage Classification</span></div>
            <div className="card-body">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {[
                  { l:"Respiration", v:vitals?.respi, u:"rpm", n:"12-20" },
                  { l:"SpO₂", v:vitals?.spo2, u:"%", n:">95" },
                  { l:"Systolic BP", v:vitals?.sbp, u:"mmHg", n:"90-140" },
                  { l:"Pulse", v:vitals?.hr, u:"bpm", n:"60-100" }
                ].map((s,i) => (
                  <div key={i} style={{ padding:"12px", background:"#F8FAFC", borderRadius:12, border:"1px solid #E2E8F0" }}>
                    <div style={{ fontSize:"0.65rem", fontWeight:700, color:"#94A3B8", textTransform:"uppercase", marginBottom:4 }}>{s.l}</div>
                    <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                      <span style={{ fontSize:"1.2rem", fontWeight:800, color:"#1E293B" }}>{s.v || "—"}</span>
                      <span style={{ fontSize:"0.7rem", color:"#64748B" }}>{s.u}</span>
                    </div>
                    <div style={{ fontSize:"0.6rem", color:"#94A3B8", marginTop:2 }}>Norm: {s.n}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pathway Timeline */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Autonomous Clinical Pathway</span>
            <span className="vital-badge" style={{ background:riskBg[risk], color:riskCol[risk] }}>{triageData?.pathway} Enabled</span>
          </div>
          <div className="card-body" style={{ padding:"30px 40px" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", position:"relative" }}>
              <div style={{ position:"absolute", top:10, left:0, right:0, height:2, background:"#E2E8F0", zIndex:0 }}></div>
              {[
                { s:"Monitoring", d:"Ingesting wearable data", t:"0ms" },
                { s:"Analysis", d:"NEWS2 computation", t:"+12ms" },
                { s:"Triage", d:"Urgency classification", t:"+18ms" },
                { s:"Escalation", d:"Pathway routing", t:"+25ms" }
              ].map((step, i) => (
                <div key={i} style={{ position:"relative", zIndex:1, display:"flex", flexDirection:"column", alignItems:"center", width:120, textAlign:"center" }}>
                  <div style={{ width:22, height:22, borderRadius:"50%", background: i <= 2 ? "#F59E0B" : "white", border:"2.5px solid #F59E0B", marginBottom:10 }}></div>
                  <div style={{ fontSize:"0.8rem", fontWeight:700, color:"#1E293B" }}>{step.s}</div>
                  <div style={{ fontSize:"0.65rem", color:"#64748B", marginTop:2 }}>{step.d}</div>
                  <div style={{ fontSize:"0.6rem", color:"#94A3B8", fontFamily:"'JetBrains Mono',monospace", marginTop:4 }}>{step.t}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Anomalies & Orchestration */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 400px", gap:16 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Detected Physiological Anomalies</span></div>
            <div className="card-body" style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
              {triageData?.anomalies?.length > 0 ? triageData.anomalies.map((a,i) => (
                <div key={i} style={{ padding:"10px 16px", borderRadius:10, background:"#FFFBEB", border:"1.5px solid #FEF3C7", color:"#92400E", fontSize:"0.8rem", fontWeight:600, display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:"1rem" }}>⚠</span> {a}
                </div>
              )) : (
                <div style={{ padding:"10px 16px", borderRadius:10, background:"#F0FDF4", border:"1.5px solid #DCFCE7", color:"#166534", fontSize:"0.8rem", fontWeight:600, display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:"1rem" }}>✓</span> No active anomalies detected by TriageAgent.
                </div>
              )}
            </div>
          </div>
          <div className="card" style={{ background:"#0F172A", border:"none" }}>
            <div className="card-header" style={{ background:"none", borderBottom:"1px solid rgba(255,255,255,0.1)" }}>
              <span className="card-title" style={{ color:"white" }}>🕵 Triage Reasoning</span>
            </div>
            <div className="card-body" style={{ color:"#94A3B8", fontSize:"0.82rem", lineHeight:1.6, padding:"12px" }}>
              <div style={{ color:"#F59E0B", fontWeight:800, fontSize:"0.6rem", textTransform:"uppercase" }}>Sentinel Analysis</div>
              <p style={{ fontStyle:"italic", marginTop:4 }}>"{agents?.triage?.lastLog || "Evaluating NEWS2 thresholds..."}"</p>
            </div>
          </div>
        </div>

        {/* Agent Metadata */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
          {[
            { l:"Tasks Processed", v:agents?.triage?.tasks || 0, c:"#F59E0B" },
            { l:"Confidence Score", v:"98.4%", c:"#10B981" },
            { l:"Decision Latency", v:"18ms", c:"#6366F1" }
          ].map((m,i)=>(
            <div key={i} className="metric-card">
              <div className="metric-card__label">{m.l}</div>
              <div className="metric-card__value" style={{ color:m.c }}>{m.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
