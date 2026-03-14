import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar, { useVitals, speak } from "./Navbar";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function MapPage({ user, onLogout }) {
  const navigate = useNavigate();
  const { vitals, risk } = useVitals();
  const [locations, setLocations] = useState(null);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    const fetchLoc = async () => {
      try {
        const res = await fetch(`${API}/api/location`);
        setLocations(await res.json());
      } catch(e) {}
    };
    fetchLoc();
  }, []);

  useEffect(() => {
    if (!mapInstance.current && window.L) {
      mapInstance.current = window.L.map(mapRef.current).setView([28.6139, 77.2090], 13);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(mapInstance.current);

      // Red Circles for Critical zones
      window.L.circle([28.6139, 77.2090], { color: 'red', fillColor: '#f03', fillOpacity: 0.5, radius: 500 }).addTo(mapInstance.current)
        .bindPopup("SvasthAI Medical Center - ICU Deployment Site");

      window.L.circle([28.62, 77.19], { color: risk === 'critical' ? 'red' : 'blue', fillColor: risk === 'critical' ? '#f03' : '#30f', fillOpacity: 0.3, radius: 300 }).addTo(mapInstance.current)
        .bindPopup("Patient Last Known Location");
    }
    
    speak("Geographical tracking initialized. Visualizing secure patient coordinates and emergency dispatch routes focused on clinical deployment zones in India.");
  }, [risk]);

  const riskCol = { stable:"#10B981", medium:"#F59E0B", high:"#F97316", critical:"#EF4444" };

  return (
    <div className="page-layout">
      <Navbar user={user} onLogout={onLogout} risk={risk} />
      
      <div className="page-content fade-in" style={{ height:"calc(100vh - 100px)", display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <button onClick={()=>navigate(-1)} className="btn btn-ghost" style={{ padding:"6px 12px" }}>← Back</button>
              <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:"1.5rem", fontWeight:800, color:"#0F172A" }}>
                📍 Geolocation Center
              </h1>
            </div>
          </div>
          <div style={{ display:"flex", gap:12 }}>
             <div style={{ padding:"8px 16px", borderRadius:12, background:"white", border:"1.5px solid #E2E8F0", fontSize:"0.75rem", fontWeight:700 }}>
                Patient: <span style={{ color:riskCol[risk]||"#10B981" }}>{risk?.toUpperCase()}</span>
             </div>
          </div>
        </div>

        <div style={{ flex:1, display:"grid", gridTemplateColumns:"1fr 320px", gap:16, minHeight:0 }}>
           <div className="card" style={{ position:"relative", overflow:"hidden", border:"none" }}>
              <div ref={mapRef} style={{ height:"100%", width:"100%", borderRadius:16 }} />
              
              <div style={{ position:"absolute", left:16, bottom:16, background:"rgba(255,255,255,0.9)", padding:"12px 18px", borderRadius:12, boxShadow:"0 4px 12px rgba(0,0,0,0.1)", maxWidth:400, backdropFilter:"blur(8px)", zIndex:1000 }}>
                 <h4 style={{ fontSize:"0.85rem", fontWeight:800, color:"#1F2937", marginBottom:4 }}>Emergency Dispatch Active</h4>
                 <p style={{ fontSize:"0.72rem", color:"#4B5563", lineHeight:1.4 }}>Tracking ETA to nearest Trauma Center in South Delhi. {risk === 'critical' ? 'Ambulance AMB-1 dispatched.' : 'Monitoring patient vector.'}</p>
                 <div style={{ marginTop:8, display:"flex", gap:10 }}>
                    <div style={{ flex:1, height:4, background:"#E5E7EB", borderRadius:2, overflow:"hidden" }}>
                       <div style={{ height:"100%", width:risk==='critical'?'100%':'40%', background:riskCol[risk], transition:'width 2s' }}></div>
                    </div>
                    <span style={{ fontSize:"0.6rem", fontWeight:800, color:riskCol[risk] }}>{risk==='critical'?'DISPATCHED':'IDLE'}</span>
                 </div>
              </div>
           </div>

           <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div className="card">
                 <div className="card-header"><span className="card-title">Live Telemetry</span></div>
                 <div className="card-body">
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                       {[
                         { l:"Network", v:"Jio 5G", c:"#10B981" },
                         { l:"Battery", v:"88%", c:"#10B981" },
                         { l:"Lat", v:"28.6139", c:"#64748B" },
                         { l:"Lng", v:"77.2090", c:"#64748B" }
                       ].map((m,i)=>(
                         <div key={i} style={{ padding:"8px 12px", background:"#F9FAFB", borderRadius:8, border:"1px solid #E2E8F0" }}>
                           <div style={{ fontSize:"0.6rem", fontWeight:700, color:"#94A3B8", textTransform:"uppercase" }}>{m.l}</div>
                           <div style={{ fontSize:"0.85rem", fontWeight:800, color:m.c, marginTop:2 }}>{m.v}</div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="card" style={{ background:"#111827", color:"white" }}>
                 <div className="card-body" style={{ textAlign:"center", padding:"30px" }}>
                    <div style={{ fontSize:"2rem", marginBottom:12 }}>🛸</div>
                    <h4 style={{ fontSize:"0.9rem", fontWeight:800 }}>Autonomous Fleet</h4>
                    <p style={{ fontSize:"0.7rem", color:"#94A3B8", marginTop:8 }}>Drone dispatch units are on standby at Medical Center Alpha.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
