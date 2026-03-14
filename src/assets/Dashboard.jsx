import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar, { useVitals } from "./Navbar";
import DigitalTwin from "./DigitalTwin";
import WearableHub from "./WearableHub";
import StabilityAnalysis from "./StabilityAnalysis";
import "../App.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

const PARAM_CONFIG = [
  { key:"hr",   label:"Heart Rate",     icon:"❤", unit:"bpm",  color:"#6366F1", min:60,  max:100,  critical:[0,50,121,999] },
  { key:"spo2", label:"SpO₂",           icon:"💧", unit:"%",    color:"#06B6D4", min:95,  max:100,  critical:[0,88,null,null] },
  { key:"hrv",  label:"HRV",            icon:"📊", unit:"ms",   color:"#8B5CF6", min:40,  max:70,   critical:[0,20,null,null] },
  { key:"respi",label:"Respiration",    icon:"🌬", unit:"rpm",  color:"#10B981", min:12,  max:20,   critical:[0,8,25,999] },
  { key:"temp", label:"Temperature",    icon:"🌡", unit:"°C",   color:"#F59E0B", min:36.1,max:37.5, critical:[0,35,39,999] },
  { key:"sbp",  label:"Systolic BP",    icon:"🩺", unit:"mmHg", color:"#EF4444", min:90,  max:140,  critical:[0,80,160,999] },
];

const AGENT_CARDS = [
  { id:"monitor",    name:"MonitorAgent",    role:"Wearable Ingestion",     icon:"◉", color:"#3B82F6", route:"/monitor",    desc:"250Hz signal sampling, noise filtering, BLE 5.2" },
  { id:"triage",     name:"TriageAgent",     role:"NEWS2 Triage",           icon:"◈", color:"#F59E0B", route:"/triage",     desc:"NEWS2 scoring, anomaly detection, priority routing" },
  { id:"risk",       name:"RiskAgent",       role:"Risk Analysis",          icon:"◆", color:"#EF4444", route:"/risk",       desc:"Multi-factor risk scoring, trend analysis" },
  { id:"diagnostic", name:"DiagnosticAgent", role:"Clinical Diagnosis",     icon:"◇", color:"#8B5CF6", route:"/diagnosis",  desc:"LLM differential diagnosis, ICD-10 mapping" },
  { id:"escalation", name:"EscalationAgent", role:"Emergency Coordination", icon:"◎", color:"#EC4899", route:"/escalation", desc:"Auto-dispatch, SMS/SOS, RapidSOS integration" },
  { id:"scheduler",  name:"SchedulerAgent",  role:"Logistics & Booking",    icon:"📅", color:"#10B981", route:"/scheduler",  desc:"Auto-GCal booking, physician scheduling via API" },
];

function VitalCard({ param, value }) {
  const inRange = value >= param.min && value <= param.max;
  const isCritical = param.critical.some((c,i) => i%2===0 && c!==null && value<=c && param.critical[i+1]!==null) ||
                     (value >= (param.critical[2]||999));
  const status = isCritical ? "critical" : !inRange ? "warning" : "normal";
  const colors = { critical:"#EF4444", warning:"#F59E0B", normal: param.color };
  const col = colors[status];
  const pct = Math.min(100, Math.max(0, ((value - param.min) / (param.max - param.min)) * 100));

  return (
    <div style={{ background:"white", border:`1.5px solid ${col}30`, borderRadius:16, padding:"16px 18px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)", transition:"all 0.3s", cursor:"default" }}
      onMouseEnter={e=>e.currentTarget.style.boxShadow=`0 4px 20px ${col}25`}
      onMouseLeave={e=>e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.05)"}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <span style={{ fontSize:"1.1rem" }}>{param.icon}</span>
          <span style={{ fontSize:"0.72rem", fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:"0.06em" }}>{param.label}</span>
        </div>
        <span style={{ fontSize:"0.65rem", fontWeight:800, padding:"2px 8px", borderRadius:99,
          background: status==="critical"?"#FEF2F2":status==="warning"?"#FEF9C3":"#F0FDF4",
          color: status==="critical"?"#DC2626":status==="warning"?"#B45309":"#16A34A" }}>
          {status.toUpperCase()}
        </span>
      </div>
      <div style={{ display:"flex", alignItems:"flex-end", gap:4, marginBottom:10 }}>
        <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"2.4rem", fontWeight:800, color:col, lineHeight:1, transition:"color 0.3s" }}>
          {typeof value==="number" ? value.toFixed(value%1===0?0:1) : "—"}
        </span>
        <span style={{ fontSize:"0.8rem", color:"#94A3B8", marginBottom:5, fontWeight:600 }}>{param.unit}</span>
      </div>
      <div style={{ background:"#F1F5F9", borderRadius:99, height:5, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg, ${col}88, ${col})`, borderRadius:99, transition:"width 0.6s ease" }}/>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:5 }}>
        <span style={{ fontSize:"0.62rem", color:"#94A3B8", fontWeight:500 }}>Normal: {param.min}–{param.max}</span>
      </div>
    </div>
  );
}

function MiniChart({ history, color }) {
  const W=200, H=50;
  if (!history || history.length < 2) return null;
  const vals = history.slice(-20).map(h=>h.hr);
  const lo = Math.min(...vals), hi = Math.max(...vals), range = hi-lo||1;
  const toX = i => (i/(vals.length-1))*W;
  const toY = v => H - ((v-lo)/range)*(H-4) - 2;
  const path = vals.map((v,i) => `${i===0?"M":"L"}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");
  const area = `${path} L${W},${H} L0,${H}Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height:H }}>
      <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.25"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <path d={area} fill="url(#cg)"/>
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const { vitals, risk, scenario, agents, connected, waves, hitlQueue } = useVitals();
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [stressLoading, setStressLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [telemetry, setTelemetry] = useState({ twin: null, wearables: null });

  // 1. Fetch history
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const r = await fetch(`${API}/api/vanguard`);
        const d = await r.json();
        setHistory(d.history || []);
      } catch(e) {}
    };
    loadHistory();
    const int = setInterval(loadHistory, 5000);
    return () => clearInterval(int);
  }, []);

  // 2. Fetch Telemetry
  useEffect(() => {
    const loadTelemetry = async () => {
      try {
        const [r1, r2] = await Promise.all([
          fetch(`${API}/api/telemetry/twin`),
          fetch(`${API}/api/telemetry/wearables`)
        ]);
        setTelemetry({ twin: await r1.json(), wearables: await r2.json() });
      } catch(e) {}
    };
    loadTelemetry();
    const int = setInterval(loadTelemetry, 5000);
    return () => clearInterval(int);
  }, []);

  // 3. Fetch Analytics
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const r = await fetch(`${API}/api/analytics`);
        setAnalytics(await r.json());
      } catch(e) {}
    };
    loadAnalytics();
    const int = setInterval(loadAnalytics, 10000);
    return () => clearInterval(int);
  }, []);

  const sendStress = async () => {
    setStressLoading(true);
    try { await fetch(`${API}/api/stress`, { method:"POST" }); }
    catch(e) {}
    setTimeout(() => setStressLoading(false), 1500);
  };

  const sendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatLoading(true);
    const newHistory = [...chatHistory, { role:"user", content:msg }];
    setChatHistory(newHistory);
    try {
      const token = localStorage.getItem("svashthai_token") || "";
      const res = await fetch(`${API}/api/chat`, {
        method:"POST",
        headers:{ "Content-Type":"application/json", "Authorization":`Bearer ${token}` },
        body: JSON.stringify({ message: msg, history: chatHistory })
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { role:"ai", content: data.response || "Processing..." }]);
    } catch(e) { setChatHistory(prev => [...prev, { role:"ai", content:"Connection error. Please ensure backend is running." }]); }
    setChatLoading(false);
  };

  const rcMap = { stable:"#16a34a", medium:"#ca8a04", high:"#ea580c", critical:"#dc2626" };
  const rcBg  = { stable:"#DCFCE7", medium:"#FEF9C3", high:"#FFEDD5", critical:"#FEF2F2" };

  return (
    <div className="page-layout">
      <Navbar user={user} onLogout={onLogout} risk={risk} />
      <div style={{ background: "white", borderBottom:"1px solid #E2E8F0", padding:"12px 24px", display:"flex", alignItems:"center", gap:16, justifyContent:"space-between", boxShadow:"0 4px 6px -1px rgba(0,0,0,0.02)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:20 }}>
          <div style={{ width:48, height:48, borderRadius:12, background:"#F1F5F9", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.5rem", border:"1.5px solid #E2E8F0" }}>👩</div>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <h2 style={{ fontSize:"1.1rem", fontWeight:800, color:"#1E293B" }}>Roshani Singh</h2>
              <span style={{ fontSize:"0.65rem", fontWeight:800, padding:"2px 8px", borderRadius:6, background:"#F1F5F9", color:"#64748B", border:"1px solid #E2E8F0" }}>RB-2024-0042</span>
            </div>
            <div style={{ fontSize:"0.75rem", color:"#64748B", marginTop:2, display:"flex", gap:12 }}>
              <span><strong>Age:</strong> 21y</span>
              <span><strong>Ward:</strong> ICU-7 (Critical Care)</span>
              <span><strong>Dr:</strong> A. Mehta</span>
            </div>
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:24 }}>
          <div style={{ textAlign:"right" }}>
             <div style={{ fontSize:"0.6rem", fontWeight:800, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.05em" }}>Current Deployment</div>
             <div style={{ fontSize:"0.8rem", fontWeight:700, color: rcMap[risk]||"#166534" }}>● {scenario}</div>
          </div>
          <div className="navbar-sep" style={{ height:30 }} />
          <div style={{ display:"flex", gap:8 }}>
            <button className="btn btn-primary" style={{ fontSize:"0.78rem", padding:"6px 14px", background:"#6366F1" }} 
              onClick={() => fetch(`${API}/api/wearable/sync`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({provider:'Apple Watch Ultra'})})}>
              🔄 Sync Wearable
            </button>
            <button className="btn btn-danger" style={{ fontSize:"0.78rem", padding:"6px 14px" }} onClick={sendStress} disabled={stressLoading}>
              {stressLoading ? "⚡ Injecting Crisis..." : "⚡ Inject Crisis"}
            </button>
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* 6 Vital Parameters */}
        <div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"1.1rem", fontWeight:700, color:"#0F172A" }}>Live Vital Parameters</h2>
            <span style={{ fontSize:"0.7rem", color:"#64748B", fontWeight:600, display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ width:7,height:7,borderRadius:"50%",background:connected?"#16a34a":"#94A3B8",display:"inline-block",animation:connected?"pulse 1.5s infinite":"none" }}/>
              {connected?"Live Data":"Connecting..."}
            </span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:12 }}>
            {PARAM_CONFIG.map(p => (
              <VitalCard key={p.key} param={p} value={vitals?.[p.key] ?? 0} />
            ))}
          </div>
        </div>

        {/* Chart + Chat */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 380px", gap:16 }}>
          {/* HR Timeline Chart */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">📈 Real-time Heart Rate Timeline</span>
              <span style={{ fontSize:"0.7rem", color:"#64748B", fontFamily:"'JetBrains Mono',monospace" }}>
                {vitals ? `${vitals.hr} bpm` : "—"}
              </span>
            </div>
            <div style={{ padding:"16px" }}>
              {/* Main Cardiac Rhythm Oscillator */}
              <div style={{ background:"#0F172A", borderRadius:12, padding:12, marginBottom:16, border:"1px solid #1E293B", position:"relative" }}>
                 <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                    <span style={{ fontSize:"0.65rem", fontWeight:800, color:"#10B981", letterSpacing:"0.1em" }}>ECG (LEAD II) - 250 HZ</span>
                    <span style={{ fontSize:"0.65rem", fontWeight:700, color:"#94A3B8" }}>SWEEP: 25mm/s</span>
                 </div>
                 <div style={{ height:80, position:"relative" }}>
                    <svg viewBox="0 0 500 80" style={{ width:"100%", height:80 }}>
                       <defs>
                          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                             <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1E293B" strokeWidth="0.5"/>
                          </pattern>
                       </defs>
                       <rect width="100%" height="100%" fill="url(#grid)" />
                       {waves.length > 2 && (
                         <path 
                           d={waves.map((w,i) => `${i===0?"M":"L"} ${i * (500/waves.length)}, ${40 - (w.y * 30)}`).join(" ")} 
                           fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                         />
                       )}
                       <div className="ecg-glow" style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", boxShadow:"inset 0 0 20px rgba(16,185,129,0.1)", pointerEvents:"none" }}></div>
                    </svg>
                 </div>
              </div>

              {history.length > 5 ? (() => {
                const W=700, H=160, PAD={t:12,r:12,b:24,l:40};
                const iW=W-PAD.l-PAD.r, iH=H-PAD.t-PAD.b;
                const vals=history.map(d=>d.hr);
                const lo=Math.min(...vals)-3, hi=Math.max(...vals)+3, range=hi-lo||1;
                const toX=i=>PAD.l+(i/(history.length-1))*iW;
                const toY=v=>PAD.t+iH-((v-lo)/range)*iH;
                const path=history.map((d,i)=>`${i===0?"M":"L"}${toX(i).toFixed(1)},${toY(d.hr).toFixed(1)}`).join(" ");
                const area=`${path} L${toX(history.length-1)},${PAD.t+iH} L${PAD.l},${PAD.t+iH}Z`;
                const col = risk==="critical"?"#EF4444":risk==="high"?"#F97316":"#6366F1";
                return (
                  <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height:H }}>
                    <defs><linearGradient id="hrg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={col} stopOpacity="0.18"/><stop offset="100%" stopColor={col} stopOpacity="0"/></linearGradient></defs>
                    {[0,0.25,0.5,0.75,1].map((f,i) => {
                      const v=Math.round(lo+range*f);
                      return (<g key={i}>
                        <line x1={PAD.l} y1={toY(v)} x2={W-PAD.r} y2={toY(v)} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 4"/>
                        <text x={PAD.l-6} y={toY(v)+4} fontSize="9" fill="#94A3B8" textAnchor="end">{v}</text>
                      </g>);
                    })}
                    <path d={area} fill="url(#hrg)"/>
                    <path d={path} fill="none" stroke={col} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx={toX(history.length-1)} cy={toY(history[history.length-1]?.hr||75)} r="5" fill={col} stroke="white" strokeWidth="2.5"/>
                  </svg>
                );
              })() : (
                <div style={{ height:160, display:"flex", alignItems:"center", justifyContent:"center", color:"#94A3B8", fontSize:"0.85rem" }}>
                  <span className="spinner" style={{ marginRight:8 }}/> Loading live data...
                </div>
              )}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0, borderTop:"1px solid #F1F5F9" }}>
              {[{key:"spo2",label:"SpO₂",color:"#06B6D4"},{key:"hrv",label:"HRV",color:"#8B5CF6"}].map(m => (
                <div key={m.key} style={{ padding:"12px 16px", borderRight:m.key==="spo2"?"1px solid #F1F5F9":"none" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ fontSize:"0.7rem", fontWeight:700, color:"#64748B", textTransform:"uppercase" }}>{m.label}</span>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"0.78rem", fontWeight:700, color:m.color }}>{vitals?.[m.key]?.toFixed(1)||"—"}</span>
                  </div>
                  <MiniChart history={history} color={m.color}/>
                </div>
              ))}
            </div>
            {/* Status Log */}
               <div className="card" style={{ background:"#0F172A", border:"none" }}>
                 <div className="card-header" style={{ background:"none", borderBottom:"1px solid rgba(255,255,255,0.1)" }}>
                   <span className="card-title" style={{ color:"white", fontSize:"0.78rem" }}>🕵 Autonomous Orchestration Feed</span>
                 </div>
                 <div style={{ padding:16, display:"flex", flexDirection:"column", gap:14, maxHeight:320, overflowY:"auto" }}>
                   {Object.entries(agents).map(([id, ag]) => (
                     <div key={id} style={{ display:"flex", gap:12 }}>
                        <div style={{ width:24, height:24, borderRadius:6, background: ag.status==='ACTIVE'?'rgba(16,185,129,0.1)':'rgba(148,163,184,0.1)', display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.8rem", flexShrink:0 }}>
                           {id==='monitor'?'◉':id==='triage'?'◈':id==='risk'?'◆':id==='diagnostic'?'◇':id==='escalation'?'◎':'📅'}
                        </div>
                        <div style={{ flex:1 }}>
                           <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
                              <span style={{ fontSize:"0.68rem", fontWeight:800, color: ag.status==='ACTIVE'?'#10B981':'#94A3B8', textTransform:"uppercase" }}>{id}Agent</span>
                              <span style={{ fontSize:"0.6rem", color:"rgba(255,255,255,0.3)" }}>SECURE_LINK</span>
                           </div>
                           <p style={{ fontSize:"0.78rem", color:"#CBD5E1", lineHeight:1.4 }}>{ag.lastLog || 'Initializing...'}</p>
                        </div>
                     </div>
                   ))}
                 </div>
               </div>
          </div>

          <div className="card" style={{ display:"flex", flexDirection:"column" }}>
            <div className="card-header">
              <span className="card-title">🤖 SvasthAI Clinical Assistant</span>
              <span style={{ fontSize:"0.65rem", padding:"2px 8px", background:"#EEF2FF", color:"#4338CA", borderRadius:99, fontWeight:700 }}>Gemini + LangChain</span>
            </div>
            <div style={{ flex:1, overflowY:"auto", padding:"12px 14px", display:"flex", flexDirection:"column", gap:8, maxHeight:280, minHeight:200 }}>
              {chatHistory.length === 0 && (
                <div style={{ color:"#94A3B8", fontSize:"0.8rem", textAlign:"center", marginTop:30 }}>
                  💬 Ask me about patient vitals, diagnosis, or medications...
                </div>
              )}
              {chatHistory.map((m,i) => (
                <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
                  <div style={{ maxWidth:"85%", padding:"8px 12px", borderRadius:m.role==="user"?"12px 12px 4px 12px":"12px 12px 12px 4px",
                    background:m.role==="user"?"#6366F1":"#F8FAFC",
                    color:m.role==="user"?"white":"#334155",
                    fontSize:"0.8rem", lineHeight:1.5, border:m.role==="user"?"none":"1px solid #E2E8F0" }}>
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoading && <div style={{ display:"flex", gap:4, padding:"8px 12px" }}>
                {[0,1,2].map(i=><span key={i} style={{ width:7,height:7,borderRadius:"50%",background:"#CBD5E1",animation:`pulse 1.2s ${i*0.2}s infinite`}}/>)}
              </div>}
            </div>
            <form onSubmit={sendChat} style={{ padding:"10px 14px", borderTop:"1px solid #F1F5F9", display:"flex", gap:6 }}>
              <input value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="Ask clinical question..."
                style={{ flex:1, border:"1.5px solid #E2E8F0", borderRadius:9, padding:"8px 12px", fontSize:"0.82rem", outline:"none", fontFamily:"'Inter',sans-serif" }}
                onFocus={e=>e.target.style.borderColor="#6366F1"} onBlur={e=>e.target.style.borderColor="#E2E8F0"} />
              <button type="submit" className="btn btn-primary" style={{ padding:"8px 14px", fontSize:"0.8rem" }} disabled={chatLoading || !chatInput.trim()}>→</button>
            </form>
          </div>
        </div>

        {/* Analytic Row 2: Digital Twin & Stability hub */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 180px 1fr", gap:16, marginBottom: 24 }}>
           <DigitalTwin twinData={telemetry.twin} />
           <div style={{ display:"flex", flexDirection:"column", gap:16, justifyContent: "center" }}>
              <div style={{ padding: 12, background: "rgba(99,102,241,0.05)", border: "1px dashed rgba(99,102,241,0.2)", borderRadius: 12, textAlign: "center" }}>
                 <div style={{ fontSize: "0.55rem", color: "#6366F1", fontWeight: 800 }}>ANALYSIS ACTIVE</div>
                 <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1E293B" }}>98.4%</div>
                 <div style={{ fontSize: "0.5rem", color: "#64748B" }}>Neural Confidence</div>
              </div>
           </div>
           <StabilityAnalysis history={history} risk={risk} />
        </div>
        <div className="card" style={{ marginBottom: 24 }}>
           <WearableHub wearables={telemetry.wearables} />
        </div>

        {/* 5 Agent Cards */}
        <div>
          <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"1.1rem", fontWeight:700, color:"#0F172A", marginBottom:12 }}>AI Agent Pipeline</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:12 }}>
            {AGENT_CARDS.map(a => {
              const agState = agents?.[a.id];
              const status = agState?.status || "STANDBY";
              const statusCol = status==="ACTIVE"?"#16a34a":status==="STANDBY"?"#94A3B8":"#F59E0B";
              return (
                <div key={a.id} onClick={()=>navigate(a.route)}
                  style={{ background:"white", border:`1.5px solid ${a.color}25`, borderRadius:16, padding:"16px", cursor:"pointer",
                    transition:"all 0.2s", boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}
                  onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow=`0 8px 24px ${a.color}20`; e.currentTarget.style.borderColor=`${a.color}55`; }}
                  onMouseLeave={e=>{ e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor=`${a.color}25`; }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                    <span style={{ fontSize:"1.4rem", color:a.color }}>{a.icon}</span>
                    <span style={{ fontSize:"0.62rem", fontWeight:800, padding:"2px 8px", borderRadius:99,
                      background:`${statusCol}15`, color:statusCol, border:`1px solid ${statusCol}30` }}>
                      ● {status}
                    </span>
                  </div>
                  <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:"0.88rem", color:"#0F172A", marginBottom:4 }}>{a.name}</div>
                  <div style={{ fontSize:"0.72rem", color:"#64748B", fontWeight:600, marginBottom:8 }}>{a.role}</div>
                  <div style={{ fontSize:"0.68rem", color:"#94A3B8", lineHeight:1.5 }}>{a.desc}</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginTop:10 }}>
                    {[{l:"Tasks",v:agState?.tasks||0},{l:"Decisions",v:agState?.decisions||0}].map((m,i)=>(
                      <div key={i} style={{ background:"#F8FAFC", borderRadius:8, padding:"5px 8px" }}>
                        <div style={{ fontSize:"0.58rem", color:"#94A3B8", fontWeight:700, textTransform:"uppercase" }}>{m.l}</div>
                        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"0.9rem", fontWeight:800, color:a.color }}>{m.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop:10, fontSize:"0.68rem", color:a.color, fontWeight:600 }}>Open Agent →</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Analytics Row */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:16 }}>
          {/* System Stats */}
          <div className="card">
            <div className="card-header"><span className="card-title">📊 System Statistics</span></div>
            <div className="card-body">
              {analytics ? [
                { l:"Alerts Generated", v:analytics.systemStats?.alertsGenerated||0, c:"#EF4444" },
                { l:"SOS Triggered",    v:analytics.systemStats?.sosTriggered||0,    c:"#DC2626" },
                { l:"SMS Sent",         v:analytics.systemStats?.smsSent||0,          c:"#6366F1" },
                { l:"HITL Reviews",     v:analytics.systemStats?.hitlReviews||0,    c:"#10B981" },
              ].map((s,i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:i<3?"1px solid #F1F5F9":"none" }}>
                  <span style={{ fontSize:"0.8rem", color:"#334155", fontWeight:500 }}>{s.l}</span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:800, color:s.c }}>{s.v}</span>
                </div>
              )) : <div className="spinner"/>}
            </div>
          </div>


          <div className="card">
            <div className="card-header"><span className="card-title">🔔 Recent Alerts</span></div>
            <div className="card-body" style={{ maxHeight:200, overflowY:"auto" }}>
              {analytics?.alerts?.slice(0,5).map((a,i) => (
                <div key={i} style={{ display:"flex", gap:8, padding:"6px 0", borderBottom:i<4?"1px solid #F8FAFC":"none" }}>
                  <span style={{ fontSize:"0.7rem" }}>{a.severity==="critical"?"🔴":"🟠"}</span>
                  <div>
                    <div style={{ fontSize:"0.75rem", fontWeight:600, color:"#334155" }}>{a.message?.slice(0,50)||"Alert"}</div>
                  </div>
                </div>
              )) || <div style={{ color:"#94A3B8", fontSize:"0.8rem" }}>No alerts yet</div>}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">⚡ Actions</span></div>
            <div className="card-body" style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <button onClick={()=>navigate("/map")} className="btn btn-ghost" style={{ justifyContent:"flex-start", fontSize:"0.8rem", padding:"4px 8px" }}>📍 Patient Map</button>
              <button onClick={()=>navigate("/diagnosis")} className="btn btn-ghost" style={{ justifyContent:"flex-start", fontSize:"0.8rem", padding:"4px 8px" }}>🩺 Diagnostics</button>
              <button onClick={()=>fetch(`${API}/api/wearable/sync`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({provider:'Fitbit'})})} className="btn btn-ghost" style={{ justifyContent:"flex-start", fontSize:"0.8rem", padding:"4px 8px" }}>🔄 Sync Fitbit</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}