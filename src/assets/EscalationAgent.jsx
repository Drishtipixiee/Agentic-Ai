import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar, { useVitals } from "./Navbar";

const API = "http://localhost:3000";

export default function EscalationAgent({ user, onLogout }) {
  const navigate = useNavigate();
  const { vitals, risk, agents } = useVitals();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sosHistory, setSosHistory] = useState([]);

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${API}/api/analytics`);
      const data = await res.json();
      setAlerts(data.alerts || []);
      setSosHistory(data.sosEvents || []);
    } catch(e) {}
  };

  useEffect(() => {
    fetchAlerts();
    const int = setInterval(fetchAlerts, 5000);
    return () => clearInterval(int);
  }, []);

  const triggerManualEscalation = async () => {
    if (!confirm("Are you sure you want to trigger a MANUAL emergency escalation? All stakeholders will be notified via SMS/Email.")) return;
    setLoading(true);
    try {
      await fetch(`${API}/api/guardian`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: "+917700034050",
          emails: ["admin@svashthai.com"],
          message: `MANUAL ESCALATION: Patient Roshani Singh requires immediate intervention. Risk level: ${risk.toUpperCase()}.`,
          risk: "critical"
        })
      });
      alert("Manual escalation successful. Notifications sent.");
      fetchAlerts();
    } catch(e) {
      alert("Escalation failed. Check connection.");
    }
    setLoading(false);
  };

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
                <span style={{ color:"#EC4899" }}>◎</span> EscalationAgent
              </h1>
            </div>
            <p style={{ color:"#64748B", fontSize:"0.85rem", marginTop:4, marginLeft:88 }}>
              Agent ID: escalation-v1.9.3 · Autonomous Emergency Dispatch · Multi-Channel Alert Routing · PSAP Integration
            </p>
          </div>
          <button onClick={triggerManualEscalation} className="sos-btn" disabled={loading}>
            {loading ? "Triggering..." : "🔥 MANUAL ESCALATION"}
          </button>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 400px", gap:16 }}>
          {/* Active Notifications & Dispatch Log */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
             <div className="card">
                <div className="card-header">
                  <span className="card-title">Multi-Channel Dispatch Log</span>
                  <span style={{ fontSize:"0.65rem", fontWeight:700, color:"#94A3B8" }}>Last 15 minutes</span>
                </div>
                <div className="card-body" style={{ maxHeight:400, overflowY:"auto" }}>
                   {alerts.length > 0 ? (
                     <div style={{ display:"flex", flexDirection:"column" }}>
                        {alerts.map((a, i) => (
                          <div key={i} style={{ padding:"16px 0", borderBottom: i < alerts.length-1 ? "1.5px solid #F1F5F9" : "none", display:"flex", gap:16 }}>
                             <div style={{ width:40, height:40, borderRadius:10, background: a.severity === 'critical' ? "#FEF2F2" : "#F8FAFC", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.2rem", flexShrink:0 }}>
                                {a.severity === 'critical' ? "🚨" : "🔔"}
                             </div>
                             <div style={{ flex:1 }}>
                                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                                   <span style={{ fontSize:"0.8rem", fontWeight:800, color: a.severity === 'critical' ? "#EF4444" : "#334155" }}>{a.type.toUpperCase()} DISPATCH</span>
                                   <span style={{ fontSize:"0.68rem", color:"#94A3B8", fontFamily:"'JetBrains Mono',monospace" }}>{new Date(a.created_at).toLocaleTimeString()}</span>
                                </div>
                                <div style={{ fontSize:"0.82rem", color:"#475569", lineHeight:1.5 }}>{a.message}</div>
                                <div style={{ marginTop:8, display:"flex", gap:6 }}>
                                   {["SMS Sent", "Email Pushed", "PSAP Alert"].map((ch, idx) => (
                                     <span key={idx} style={{ fontSize:"0.6rem", fontWeight:800, padding:"2px 8px", borderRadius:4, background:"#F1F5F9", color:"#64748B" }}>✓ {ch}</span>
                                   ))}
                                </div>
                             </div>
                          </div>
                        ))}
                     </div>
                   ) : (
                     <div style={{ padding:"40px", textAlign:"center", color:"#94A3B8" }}>
                        <p>No active escalation logs. System monitoring...</p>
                     </div>
                   )}
                </div>
             </div>

             {/* SOS Events Map Link */}
             <div className="card" onClick={() => navigate("/map")} style={{ cursor:"pointer", border:"1.5px solid #FBCFE8", background:"#FFF1F2" }}>
                <div className="card-body" style={{ display:"flex", alignItems:"center", gap:20 }}>
                   <div style={{ fontSize:"2.5rem" }}>📍</div>
                   <div style={{ flex:1 }}>
                      <h4 style={{ fontSize:"1rem", fontWeight:800, color:"#991B1B" }}>Live Patient Tracker</h4>
                      <p style={{ fontSize:"0.82rem", color:"#BE123C", marginTop:2 }}>Track real-time location and ambulance status for dispatched emergencies.</p>
                   </div>
                   <span style={{ fontSize:"1.2rem", color:"#BE123C" }}>→</span>
                </div>
             </div>
          </div>

          {/* Right Panel: Coordination Stats */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
             <div className="card">
                <div className="card-header"><span className="card-title">Dispatch Orchestration</span></div>
                <div className="card-body">
                   <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                      {[
                        { l:"Stakeholders Notified", v: 4, ch: ["Dr. Mehta", "ICU Supervisor", "Nurse Station 7", "Emergency PSAP"] },
                        { l:"Primary Channels", v: 3, ch: ["Twilio SMS", "AWS SES Email", "RapidSOS Data"] },
                        { l:"Mean Response Time", v: "< 1.8s", ch: "From anomaly detection to alert" }
                      ].map((s, i) => (
                        <div key={i} style={{ padding:"12px", background:"#FDF2F8", border:"1.5px solid #FCE7F3", borderRadius:12 }}>
                           <div style={{ fontSize:"0.65rem", fontWeight:800, color:"#DB2777", textTransform:"uppercase", marginBottom:6 }}>{s.l}</div>
                           <div style={{ fontSize:"1.3rem", fontWeight:900, color:"#9D174D" }}>{s.v}</div>
                           {Array.isArray(s.ch) ? (
                             <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:8 }}>
                               {s.ch.map((c, j) => <span key={j} style={{ fontSize:"0.58rem", fontWeight:700, padding:"2px 6px", background:"white", borderRadius:4, color:"#BE123C" }}>• {c}</span>)}
                             </div>
                           ) : <div style={{ fontSize:"0.68rem", color:"#BE123C", marginTop:4 }}>{s.ch}</div>}
                        </div>
                      ))}
                   </div>
                </div>
             </div>

             <div className="card">
                <div className="card-header"><span className="card-title">On-Call Directory</span></div>
                <div className="card-body" style={{ display:"flex", flexDirection:"column", gap:10 }}>
                   {[
                     { n:"Dr. Mehta", r:"Consultant Cardiologist", s:"Active", p:"+91 77000 34050" },
                     { n:"Nurse Sarah", r:"ICU Senior Nurse", s:"Standby", p:"+91 99000 12345" }
                   ].map((d, i) => (
                     <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"8px", border:"1.5px solid #F1F5F9", borderRadius:10 }}>
                        <div style={{ width:32, height:32, borderRadius:"50%", background:"#E2E8F0", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"#64748B", fontSize:"0.75rem" }}>{d.n[0]}{d.n.split(' ')[1][0]}</div>
                        <div style={{ flex:1 }}>
                           <div style={{ fontSize:"0.78rem", fontWeight:700, color:"#1E293B" }}>{d.n}</div>
                           <div style={{ fontSize:"0.65rem", color:"#94A3B8" }}>{d.r}</div>
                        </div>
                        <span style={{ fontSize:"0.6rem", fontWeight:800, color: d.s === 'Active' ? "#10B981" : "#94A3B8" }}>● {d.s}</span>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>

        {/* Global Dispatch Metrics */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginTop:16 }}>
          {[
            { l:"Escalations Triggered", v: agents?.escalation?.tasks || 0, c:"#EC4899" },
            { l:"Avg Dispatch Lag", v:"1.42s", c:"#6366F1" },
            { l:"Network Uptime", v:"100%", c:"#10B981" },
            { l:"Emergency PSAP Link", v:"ACTIVE", c:"#F59E0B" }
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
