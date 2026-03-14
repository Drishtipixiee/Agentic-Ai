import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar, { useVitals } from "./Navbar";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function MonitorAgent({ user, onLogout }) {
  const navigate = useNavigate();
  const { vitals, risk, scenario, agents, connected } = useVitals();
  const [vanguard, setVanguard] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const r = await fetch(`${API}/api/vanguard`);
        const d = await r.json();
        setVanguard(d);
        setHistory(d.history || []);
      } catch(e) {}
    };
    fetch_();
    const int = setInterval(fetch_, 2500);
    return () => clearInterval(int);
  }, []);

  const params = [
    { key:"respi",  label:"Respiration Rate", icon:"🌬", unit:"rpm", color:"#10B981", normal:[12,20] },
    { key:"spo2",   label:"SpO₂ Saturation",  icon:"💧", unit:"%",   color:"#06B6D4", normal:[95,100] },
    { key:"hrv",    label:"Heart Rate Var.",   icon:"📊", unit:"ms",  color:"#8B5CF6", normal:[40,70] },
    { key:"hr",     label:"Pulse Rate",        icon:"❤", unit:"bpm", color:"#6366F1", normal:[60,100] },
    { key:"temp",   label:"Temperature",       icon:"🌡", unit:"°C",  color:"#F59E0B", normal:[36.1,37.5] },
  ];

  const riskCol = { stable:"#10B981", medium:"#F59E0B", high:"#F97316", critical:"#EF4444" };

  return (
    <div className="page-layout">
      <Navbar user={user} onLogout={onLogout} risk={risk} />
      <div className="page-content" style={{ animation:"fadeIn 0.4s ease" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <button onClick={()=>navigate(-1)} style={{ background:"#F1F5F9", border:"1.5px solid #E2E8F0", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:"0.8rem", fontWeight:600, color:"#334155" }}>← Back</button>
              <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"1.5rem", fontWeight:800, color:"#0F172A" }}>
                <span style={{ color:"#3B82F6" }}>◉</span> MonitorAgent
              </h1>
            </div>
            <p style={{ color:"#64748B", fontSize:"0.85rem", marginTop:4, marginLeft:88 }}>
              Agent ID: monitor-v2.4.1 · Wearable Signal Ingestion · 250Hz BLE 5.2 · Real-time Telemetry
            </p>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <div style={{ padding:"8px 16px", borderRadius:99, fontSize:"0.75rem", fontWeight:700,
              background:`${riskCol[risk]||"#10B981"}15`, color:riskCol[risk]||"#10B981", border:`1.5px solid ${riskCol[risk]||"#10B981"}40` }}>
              ● RISK: {risk?.toUpperCase()||"STABLE"}
            </div>
            <div style={{ padding:"8px 16px", borderRadius:99, fontSize:"0.75rem", fontWeight:700,
              background: connected?"#DCFCE7":"#F1F5F9", color:connected?"#16A34A":"#94A3B8", border:"1.5px solid #E2E8F0" }}>
              {connected ? "● LIVE STREAM" : "○ OFFLINE"}
            </div>
          </div>
        </div>

        {/* Agent Info Cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
          {[
            { l:"Sampling Rate", v:"250 Hz", c:"#3B82F6", icon:"📡" },
            { l:"Protocol", v:"BLE 5.2", c:"#8B5CF6", icon:"🔵" },
            { l:"Packet Loss", v:"0.02%", c:"#10B981", icon:"📦" },
            { l:"Signal Quality", v:"EXCELLENT", c:"#F59E0B", icon:"📶" },
          ].map((m,i) => (
            <div key={i} className="card" style={{ padding:"16px 18px", borderTop:`3px solid ${m.c}` }}>
              <div style={{ fontSize:"1.2rem" }}>{m.icon}</div>
              <div style={{ fontSize:"0.68rem", color:"#94A3B8", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginTop:8 }}>{m.l}</div>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:"1.3rem", color:m.c, marginTop:4 }}>{m.v}</div>
            </div>
          ))}
        </div>

        {/* 5 Parameters Live + History Table */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          {/* Live Parameters */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">📊 Live Parameter Readings — 5 Signals</span>
              <span style={{ fontSize:"0.68rem", color:"#94A3B8", fontFamily:"'JetBrains Mono',monospace" }}>
                Updated every 2.5s
              </span>
            </div>
            <div style={{ padding:"16px", display:"flex", flexDirection:"column", gap:12 }}>
              {params.map(p => {
                const val = vitals?.[p.key] ?? 0;
                const inRange = val >= p.normal[0] && val <= p.normal[1];
                const pct = Math.min(100, Math.max(0, ((val-p.normal[0])/(p.normal[1]-p.normal[0]))*100));
                return (
                  <div key={p.key} style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <span style={{ fontSize:"1.1rem", width:28, textAlign:"center" }}>{p.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                        <span style={{ fontSize:"0.8rem", fontWeight:700, color:"#334155" }}>{p.label}</span>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:800, fontSize:"0.95rem", color:p.color }}>{typeof val==="number"?val.toFixed(val%1===0?0:1):"—"}</span>
                          <span style={{ fontSize:"0.68rem", color:"#94A3B8", fontWeight:600 }}>{p.unit}</span>
                          <span style={{ fontSize:"0.6rem", fontWeight:800, padding:"1px 7px", borderRadius:99,
                            background:inRange?"#DCFCE7":"#FEF2F2", color:inRange?"#166534":"#DC2626" }}>
                            {inRange?"NORMAL":"ALERT"}
                          </span>
                        </div>
                      </div>
                      <div style={{ background:"#F1F5F9", borderRadius:99, height:6, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${p.color}80,${p.color})`, borderRadius:99, transition:"width 0.6s ease" }}/>
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between", marginTop:3 }}>
                        <span style={{ fontSize:"0.6rem", color:"#CBD5E1", fontWeight:500 }}>Normal: {p.normal[0]}–{p.normal[1]} {p.unit}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Diagnosis parameter */}
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:"1.1rem", width:28, textAlign:"center" }}>🩺</span>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontSize:"0.8rem", fontWeight:700, color:"#334155" }}>Diagnosis Status</span>
                    <span style={{ fontSize:"0.75rem", fontWeight:800, padding:"3px 12px", borderRadius:99,
                      background: risk==="stable"?"#DCFCE7":risk==="critical"?"#FEF2F2":"#FFEDD5",
                      color: risk==="stable"?"#166534":risk==="critical"?"#DC2626":"#92400E" }}>
                      {risk?.toUpperCase()||"STABLE"}
                    </span>
                  </div>
                  <div style={{ fontSize:"0.7rem", color:"#94A3B8", marginTop:4 }}>Scenario: {scenario}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Signal History Table */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">📋 Recent Signal History</span>
              <span style={{ fontSize:"0.65rem", background:"#DCFCE7", color:"#166534", padding:"2px 8px", borderRadius:99, fontWeight:700 }}>Live</span>
            </div>
            <div style={{ overflowY:"auto", maxHeight:360 }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.72rem" }}>
                <thead>
                  <tr style={{ background:"#F8FAFC" }}>
                    {["Time","HR","SpO₂","Respi","HRV"].map(h=>(
                      <th key={h} style={{ padding:"8px 10px", textAlign:"left", fontSize:"0.62rem", textTransform:"uppercase", letterSpacing:"0.07em", color:"#94A3B8", fontWeight:800, borderBottom:"1.5px solid #E2E8F0" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...history].reverse().slice(0,12).map((row,i)=>(
                    <tr key={i} style={{ borderBottom:"1px solid #F8FAFC" }}
                      onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"}
                      onMouseLeave={e=>e.currentTarget.style.background=""}>
                      <td style={{ padding:"7px 10px", fontFamily:"'JetBrains Mono',monospace", color:"#94A3B8", fontSize:"0.65rem" }}>{new Date(row.ts||Date.now()).toLocaleTimeString()}</td>
                      <td style={{ padding:"7px 10px", fontWeight:700, color:"#6366F1", fontFamily:"'JetBrains Mono',monospace" }}>{row.hr?.toFixed(0)}</td>
                      <td style={{ padding:"7px 10px", fontWeight:700, color:"#06B6D4", fontFamily:"'JetBrains Mono',monospace" }}>{row.spo2?.toFixed(1)}</td>
                      <td style={{ padding:"7px 10px", fontWeight:600, color:"#10B981", fontFamily:"'JetBrains Mono',monospace" }}>{row.respi?.toFixed(0)}</td>
                      <td style={{ padding:"7px 10px", fontWeight:600, color:"#8B5CF6", fontFamily:"'JetBrains Mono',monospace" }}>{row.hrv?.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Anomaly Detection Log */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 400px", gap:16, marginTop:16 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">⚠ Live Anomaly Detection Log</span></div>
            <div style={{ padding:"16px", display:"flex", flexWrap:"wrap", gap:8 }}>
              {(vanguard?.anomalies||[]).length > 0 ? vanguard.anomalies.map((a,i)=>(
                <span key={i} style={{ padding:"5px 14px", borderRadius:99, background:"#FEF2F2", color:"#DC2626", fontSize:"0.78rem", fontWeight:700, border:"1px solid #FECACA" }}>
                  ⚡ {a}
                </span>
              )) : (
                <span style={{ padding:"5px 14px", borderRadius:99, background:"#DCFCE7", color:"#16A34A", fontSize:"0.78rem", fontWeight:700 }}>
                  ✓ All parameters within normal range — No anomalies detected
                </span>
              )}
            </div>
          </div>
          <div className="card" style={{ background:"#0F172A", border:"none" }}>
            <div className="card-header" style={{ background:"none", borderBottom:"1px solid rgba(255,255,255,0.1)" }}>
              <span className="card-title" style={{ color:"white" }}>🕵 Orchestration Feedback</span>
            </div>
            <div className="card-body" style={{ color:"#94A3B8", fontSize:"0.82rem", lineHeight:1.6, padding:"15px" }}>
              <div style={{ color:"#3B82F6", fontWeight:800, marginBottom:4, fontSize:"0.65rem", textTransform:"uppercase" }}>Vanguard Logic</div>
              <p style={{ fontStyle:"italic" }}>"{agents?.monitor?.lastLog || "Initiating stream sync..."}"</p>
              <div style={{ marginTop:12, paddingTop:12, borderTop:"1px solid rgba(255,255,255,0.05)" }}>
                 <p style={{ fontSize:"0.7rem" }}>Status: <span style={{ color:"#10B981" }}>Active Handover</span></p>
                 <p style={{ fontSize:"0.7rem" }}>Next Agent: <span style={{ color:"#F59E0B" }}>SentinelTriage</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
