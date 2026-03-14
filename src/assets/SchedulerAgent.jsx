import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar, { useVitals } from "./Navbar";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function SchedulerAgent({ user, onLogout }) {
  const navigate = useNavigate();
  const { vitals, risk, agents } = useVitals();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const r = await fetch(`${API}/api/scheduler`);
        const d = await r.json();
        setAppointments(d.appointments || []);
      } catch(e) {}
    };
    fetchSchedules();
    const int = setInterval(fetchSchedules, 5000);
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
                <span style={{ color:"#10B981" }}>📅</span> SchedulerAgent
              </h1>
            </div>
            <p style={{ color:"#64748B", fontSize:"0.85rem", marginTop:4, marginLeft:88 }}>
              Agent ID: scheduler-v1.0.4 · Autonomous Logistics · Appointment Orchestration · Calendar Sync
            </p>
          </div>
          <div style={{ padding:"8px 16px", borderRadius:12, background:"white", border:"1.5px solid #E2E8F0", display:"flex", alignItems:"center", gap:10 }}>
            <span className="status-dot active"></span>
            <span style={{ fontSize:"0.75rem", fontWeight:700, color:"#334155" }}>CALENDAR SYNC ACTIVE</span>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 380px", gap:16 }}>
          {/* Appointment List */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Autonomous Appointment Queue</span>
              <span style={{ fontSize:"0.65rem", fontWeight:700, color:"#94A3B8" }}>Proactive Care Scheduling</span>
            </div>
            <div className="card-body">
               <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {appointments.map((apt) => (
                    <div key={apt.id} style={{ padding:"16px", border:"1.5px solid #F1F5F9", borderRadius:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                       <div>
                          <div style={{ fontSize:"0.65rem", fontWeight:800, color:"#6366F1", textTransform:"uppercase", marginBottom:4 }}>{apt.type}</div>
                          <div style={{ fontSize:"1rem", fontWeight:700, color:"#1E293B" }}>{apt.doctor}</div>
                          <div style={{ fontSize:"0.75rem", color:"#64748B", marginTop:2 }}>{apt.time}</div>
                       </div>
                       <div style={{ textAlign:"right" }}>
                          <span style={{ fontSize:"0.65rem", fontWeight:800, padding:"3px 8px", borderRadius:6, background: apt.status === 'CONFIRMED' ? '#DCFCE7' : '#F1F5F9', color: apt.status === 'CONFIRMED' ? '#166534' : '#475569' }}>
                            {apt.status}
                          </span>
                          <div style={{ fontSize:"0.6rem", color:"#94A3B8", marginTop:6 }}>via {apt.method}</div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          {/* Sync Status */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
             <div className="card">
                <div className="card-header"><span className="card-title">Calendar Integration</span></div>
                <div className="card-body" style={{ display:"flex", flexDirection:"column", gap:10 }}>
                   {[
                     { n:"Google Calendar", s:"Connected", c:"#10B981" },
                     { n:"Outlook / Office365", s:"Syncing", c:"#F59E0B" },
                     { n:"Apple iCal", s:"Standby", c:"#94A3B8" }
                   ].map((sys, i) => (
                     <div key={sys.n} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", background:"#F8FAFC", borderRadius:8 }}>
                        <span style={{ fontSize:"0.8rem", fontWeight:600, color:"#334155" }}>{sys.n}</span>
                        <span style={{ fontSize:"0.65rem", fontWeight:800, color:sys.c }}>{sys.s}</span>
                     </div>
                   ))}
                </div>
             </div>

             <div className="card" style={{ background:"linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)", border:"1px solid #BBF7D0" }}>
                <div className="card-body">
                   <h4 style={{ fontSize:"0.85rem", fontWeight:700, color:"#166534", marginBottom:8 }}>Predictive Scheduling</h4>
                   <p style={{ fontSize:"0.78rem", color:"#166534", lineHeight:1.4 }}>
                     System autonomously pre-booked a slot when NEWS2 trend reached 3. This saves an average of 42 minutes in clinical intervention.
                   </p>
                </div>
             </div>
             <div className="card" style={{ background:"#0F172A", border:"none" }}>
                <div className="card-body" style={{ color:"#94A3B8", fontSize:"0.8rem", padding:"12px" }}>
                   <div style={{ color:"#10B981", fontWeight:800, fontSize:"0.6rem", textTransform:"uppercase" }}>Logistics Logic</div>
                   <p style={{ fontStyle:"italic", marginTop:4 }}>"{agents?.scheduler?.lastLog || "Syncing calendar availability..."}"</p>
                </div>
             </div>
          </div>
        </div>

        {/* Scheduler Metrics */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginTop:16 }}>
          {[
            { l:"Ops Handled", v: agents?.scheduler?.tasks || 0, c:"#10B981" },
            { l:"Precision", v:"99.4%", c:"#3B82F6" },
            { l:"Optimization", v:"+3.2h", c:"#8B5CF6" },
            { l:"API Uptime", v:"99.9%", c:"#F59E0B" }
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
