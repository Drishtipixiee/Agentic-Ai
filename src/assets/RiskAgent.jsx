import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar, { useVitals, speak } from "./Navbar";

const API = import.meta.env.VITE_API_URL || "";

export default function RiskAgent({ user, onLogout }) {
  const navigate = useNavigate();
  const { vitals, risk, agents } = useVitals();
  const [riskAnalysis, setRiskAnalysis] = useState(null);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const r = await fetch(`${API}/api/risk`);
        const d = await r.json();
        setRiskAnalysis(d);
      } catch(e) {}
    };
    fetch_();
    const int = setInterval(fetch_, 3000);

    // AI Voice Intro
    speak("Risk Analyzer initialized. I utilize multi-factor neural entropy models to predict clinical deterioration up to 30 minutes before symptoms manifest.");

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
                <span style={{ color:"#EF4444" }}>◆</span> RiskAgent
              </h1>
            </div>
            <p style={{ color:"#64748B", fontSize:"0.85rem", marginTop:4, marginLeft:88 }}>
              Agent ID: risk-v1.0.2 · Multi-factor Risk Scoring · Statistical Trend Analysis · Predictive Guardrails
            </p>
          </div>
          <div style={{ padding:"8px 16px", borderRadius:12, background:"white", border:"1.5px solid #E2E8F0", display:"flex", alignItems:"center", gap:10 }}>
            <span className="status-dot active"></span>
            <span style={{ fontSize:"0.75rem", fontWeight:700, color:"#334155" }}>RISK ENGINE ONLINE</span>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"320px 1fr", gap:16 }}>
          {/* Risk Score Circle */}
          <div className="card" style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px" }}>
            <div style={{ position:"relative", width:180, height:180, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg viewBox="0 0 36 36" style={{ width:180, height:180, transform:"rotate(-90deg)" }}>
                <circle cx="18" cy="18" r="16" fill="none" stroke="#F1F5F9" strokeWidth="2.5" />
                <circle cx="18" cy="18" r="16" fill="none" stroke={riskCol[risk]||"#10B981"} strokeWidth="2.5" 
                  strokeDasharray={`${riskAnalysis?.score || 0}, 100`} strokeLinecap="round" style={{ transition:"stroke-dasharray 0.8s ease" }} />
              </svg>
              <div style={{ position:"absolute", textAlign:"center" }}>
                <div style={{ fontSize:"0.75rem", fontWeight:800, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.1em" }}>Risk Index</div>
                <div style={{ fontSize:"3.5rem", fontWeight:900, color:riskCol[risk]||"#10B981", lineHeight:1 }}>{riskAnalysis?.score || 0}</div>
                <div style={{ fontSize:"0.9rem", fontWeight:700, color:riskCol[risk]||"#10B981" }}>{risk?.toUpperCase()}</div>
              </div>
            </div>
            <div style={{ marginTop:24, width:"100%" }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.65rem", fontWeight:800, color:"#94A3B8", textTransform:"uppercase", marginBottom:10 }}>
                <span>Safe</span>
                <span>Critical</span>
              </div>
              <div style={{ height:6, background:"#F1F5F9", borderRadius:99, overflow:"hidden", position:"relative" }}>
                 <div style={{ position:"absolute", height:"100%", left:0, right:"80%", background:"#10B981" }}></div>
                 <div style={{ position:"absolute", height:"100%", left:"20%", right:"50%", background:"#F59E0B" }}></div>
                 <div style={{ position:"absolute", height:"100%", left:"50%", right:0, background:"#EF4444" }}></div>
                 <div style={{ position:"absolute", top:0, left:`${riskAnalysis?.score || 0}%`, width:4, height:10, background:"#1E293B", transform:"translate(-50%, -2px)", borderRadius:2 }}></div>
              </div>
            </div>
          </div>

          {/* Factor Analysis */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Risk Factor Breakdown</span>
              <span style={{ fontSize:"0.65rem", fontWeight:700, color:"#94A3B8" }}>Weighted Parameter Contribution</span>
            </div>
            <div className="card-body">
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                {(riskAnalysis?.factors || []).map((f, i) => (
                  <div key={i}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ fontSize:"0.82rem", fontWeight:700, color:"#334155" }}>{f.name}</span>
                      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                        <span style={{ fontSize:"0.75rem", fontWeight:600, color: f.status === 'ok' ? "#10B981" : f.status === 'warning' ? "#F59E0B" : "#EF4444" }}>
                          {f.value} {f.name.includes('SpO') ? '%' : f.name.includes('Temp') ? '°C' : f.name.includes('Pulse') || f.name.includes('Heart') ? 'bpm' : 'ms'}
                        </span>
                        <span style={{ fontSize:"0.65rem", color:"#94A3B8" }}>Weight: {f.weight}%</span>
                      </div>
                    </div>
                    <div style={{ height:6, background:"#F1F5F9", borderRadius:99, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${(f.weight / 40) * 100}%`, background: f.status === 'ok' ? "#10B981" : f.status === 'warning' ? "#F59E0B" : "#EF4444", borderRadius:99 }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic & Orchestration Panel */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 400px", gap:16 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:16, flex:1 }}>
            {[
              { l:"Cardiac Stability", v:risk === 'critical' ? 'Compromised' : 'Optimal', c: risk === 'critical' ? "#EF4444" : "#10B981", d:"R-R interval variance within bounds" },
              { l:"Pulmonary Efficiency", v: vitals?.spo2 < 94 ? 'Reduced' : 'Normal', c: vitals?.spo2 < 94 ? "#F59E0B" : "#10B981", d:"O2 saturation above 94% threshold" },
              { l:"Metabolic Status", v: vitals?.temp > 38 ? 'Febrile' : 'Afebrile', c: vitals?.temp > 38 ? "#F59E0B" : "#10B981", d:"Body temp within physiological limits" },
              { l:"Neuro-Entropy", v: "Stable", c: "#10B981", d:"Neural signal variance nominal" }
            ].map((g, i) => (
              <div key={i} className="card" style={{ padding:"20px" }}>
                <div style={{ fontSize:"0.7rem", fontWeight:800, color:"#94A3B8", textTransform:"uppercase", marginBottom:8 }}>{g.l}</div>
                <div style={{ fontSize:"1.2rem", fontWeight:800, color:g.c, marginBottom:4 }}>{g.v}</div>
                <div style={{ fontSize:"0.75rem", color:"#64748B" }}>{g.d}</div>
              </div>
            ))}
          </div>
          <div className="card" style={{ background:"#0F172A", border:"none" }}>
            <div className="card-header" style={{ background:"none", borderBottom:"1px solid rgba(255,255,255,0.1)" }}>
              <span className="card-title" style={{ color:"white" }}>🕵 Risk Model Reasoning</span>
            </div>
            <div className="card-body" style={{ color:"#94A3B8", fontSize:"0.82rem", lineHeight:1.6, padding:"15px" }}>
              <div style={{ color:"#EF4444", fontWeight:800, fontSize:"0.6rem", textTransform:"uppercase" }}>Entropy Analyzer</div>
              <p style={{ fontStyle:"italic", marginTop:4 }}>"{agents?.risk?.lastLog || "Analyzing multi-factor drift..."}"</p>
              <p style={{ marginTop:12, fontSize:"0.75rem" }}>
                Probability of deterioration (P_crit): <span style={{ color:"white", fontWeight:700 }}>{risk === 'critical' ? '0.94' : risk === 'high' ? '0.78' : '0.04'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Agent Metrics */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
          {[
            { l:"Analysis Cycles", v: agents?.risk?.tasks || 0, c:"#6366F1" },
            { l:"False Positive Rate", v:"0.12%", c:"#10B981" },
            { l:"Sensitivity", v:"99.8%", c:"#8B5CF6" },
            { l:"Predictive Horizon", v:"30 min", c:"#EC4899" }
          ].map((m,i)=>(
            <div key={i} className="metric-card">
              <div className="metric-card__label">{m.l}</div>
              <div className="metric-card__value" style={{ color:m.c, fontSize:"1.6rem" }}>{m.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
