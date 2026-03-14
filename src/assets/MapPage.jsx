import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar, { useVitals } from "./Navbar";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function MapPage({ user, onLogout }) {
  const navigate = useNavigate();
  const { vitals, risk } = useVitals();
  const [locations, setLocations] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLoc = async () => {
      try {
        const res = await fetch(`${API}/api/location`);
        setLocations(await res.json());
      } catch(e) {}
      setLoading(false);
    };
    fetchLoc();
  }, []);

  const riskCol = { stable:"#10B981", medium:"#F59E0B", high:"#F97316", critical:"#EF4444" };

  return (
    <div className="page-layout">
      <Navbar user={user} onLogout={onLogout} risk={risk} />
      
      <div className="page-content fade-in" style={{ height:"calc(100vh - 100px)", display:"flex", flexDirection:"column" }}>
        {/* Header */}
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
             <button className="btn btn-primary" style={{ fontSize:"0.8rem" }}>Request Update</button>
          </div>
        </div>

        {/* Map Container */}
        <div style={{ flex:1, display:"grid", gridTemplateColumns:"1fr 320px", gap:16, minHeight:0 }}>
           {/* Mock Map View (Interactive-looking) */}
           <div className="card" style={{ position:"relative", overflow:"hidden", background:"#E5E7EB" }}>
              <div style={{ position:"absolute", inset:0, background:"url('https://maps.googleapis.com/maps/api/staticmap?center=28.6139,77.2090&zoom=14&size=1200x800&key=YOUR_API_KEY') center/cover no-repeat", opacity:0.8 }}>
                 {/* Fallback pattern if no API key */}
                 <div style={{ position:"absolute", inset:0, background:"linear-gradient(45deg, #f3f4f6 25%, transparent 25%, transparent 75%, #f3f4f6 75%, #f3f4f6), linear-gradient(45deg, #f3f4f6 25%, transparent 25%, transparent 75%, #f3f4f6 75%, #f3f4f6)", backgroundSize:"60px 60px", backgroundPosition:"0 0, 30px 30px", opacity:0.5 }}></div>
              </div>

              {/* Patient Marker */}
              <div style={{ position:"absolute", top:"45%", left:"48%", transform:"translate(-50%, -100%)", display:"flex", flexDirection:"column", alignItems:"center", zIndex:10 }}>
                 <div style={{ padding:"4px 10px", background:"white", borderRadius:8, boxShadow:"0 4px 12px rgba(0,0,0,0.15)", border:"1px solid #E2E8F0", marginBottom:6, fontSize:"0.7rem", fontWeight:800, whiteSpace:"nowrap" }}>
                    🚑 {locations?.patient?.name || "Roshani Singh"} (ICU-7)
                 </div>
                 <div style={{ width:24, height:24, borderRadius:"50%", background:riskCol[risk]||"#10B981", border:"4px solid white", boxShadow:"0 0 0 6px "+(riskCol[risk]||"#10B981")+"40", animation:"pulse 1.5s infinite" }}></div>
                 <div style={{ width:2, height:10, background:riskCol[risk]||"#10B981" }}></div>
              </div>

              {/* Hospital Marker */}
              <div style={{ position:"absolute", top:"35%", left:"55%", transform:"translate(-50%, -100%)", display:"flex", flexDirection:"column", alignItems:"center", zIndex:5 }}>
                 <div style={{ padding:"4px 10px", background:"#111827", borderRadius:8, boxShadow:"0 4px 12px rgba(0,0,0,0.15)", color:"white", marginBottom:6, fontSize:"0.65rem", fontWeight:700, whiteSpace:"nowrap" }}>
                    🏥 SvasthAI Medical Center
                 </div>
                 <div style={{ width:18, height:18, borderRadius:"50%", background:"#111827", border:"3px solid white" }}></div>
              </div>

              {/* Ambulance 1 */}
              <div style={{ position:"absolute", top:"60%", left:"40%", transform:"translate(-50%, -100%)", display:"flex", flexDirection:"column", alignItems:"center", opacity:0.8 }}>
                 <div style={{ width:10, height:10, borderRadius:"50%", background:"#6366F1", border:"2px solid white" }}></div>
                 <div style={{ fontSize:"0.6rem", fontWeight:700, color:"#4338CA", marginTop:4 }}>AMB-1</div>
              </div>

              {/* Map UI Elements */}
              <div style={{ position:"absolute", right:16, top:16, display:"flex", flexDirection:"column", gap:8 }}>
                 <div style={{ background:"white", padding:8, borderRadius:8, boxShadow:"0 2px 8px rgba(0,0,0,0.1)", display:"flex", flexDirection:"column", gap:4 }}>
                    <button style={{ border:"none", background:"#F1F5F9", width:28, height:28, borderRadius:4, fontWeight:800, cursor:"pointer" }}>+</button>
                    <button style={{ border:"none", background:"#F1F5F9", width:28, height:28, borderRadius:4, fontWeight:800, cursor:"pointer" }}>-</button>
                 </div>
                 <button style={{ background:"white", border:"none", width:34, height:34, borderRadius:8, boxShadow:"0 2px 8px rgba(0,0,0,0.1)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>🧭</button>
              </div>

              <div style={{ position:"absolute", left:16, bottom:16, background:"rgba(255,255,255,0.9)", padding:"12px 18px", borderRadius:12, boxShadow:"0 4px 12px rgba(0,0,0,0.1)", maxWidth:400, backdropFilter:"blur(8px)" }}>
                 <h4 style={{ fontSize:"0.85rem", fontWeight:800, color:"#1F2937", marginBottom:4 }}>Emergency Dispatch Protocol Active</h4>
                 <p style={{ fontSize:"0.72rem", color:"#4B5563", lineHeight:1.4 }}>Tracking ETA to nearest Trauma Center. Lat: 28.6139, Lng: 77.2090. {risk === 'critical' ? 'Ambulance AMB-1 dispatched in 14s.' : 'Standby monitoring.'}</p>
                 <div style={{ marginTop:8, display:"flex", gap:10 }}>
                    <div style={{ flex:1, height:4, background:"#E5E7EB", borderRadius:2, overflow:"hidden" }}>
                       <div style={{ height:"100%", width:"65%", background:"#10B981" }}></div>
                    </div>
                    <span style={{ fontSize:"0.6rem", fontWeight:800, color:"#10B981" }}>ETA: 4 MIN</span>
                 </div>
              </div>
           </div>

           {/* Sidebar Info */}
           <div style={{ display:"flex", flexDirection:"column", gap:16, minWidth:0, overflowY:"auto" }}>
              <div className="card">
                 <div className="card-header"><span className="card-title">Live Telemetry (Mobile)</span></div>
                 <div className="card-body">
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                       {[
                         { l:"Signal", v:"4G LTE", c:"#10B981" },
                         { l:"Battery", v:"82%", c:"#10B981" },
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

              <div className="card">
                 <div className="card-header"><span className="card-title">Nearby Facilities</span></div>
                 <div className="card-body" style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {[
                      { n:"City Trauma Center", d:"1.2 km", t:"3 min" },
                      { n:"Apollo Medical", d:"2.4 km", t:"6 min" },
                      { n:"SvasthAI HQ", d:"0.8 km", t:"2 min" }
                    ].map((f, i) => (
                      <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px", border:"1px solid #F3F4F6", borderRadius:8 }}>
                         <div>
                            <div style={{ fontSize:"0.75rem", fontWeight:700, color:"#374151" }}>{f.n}</div>
                            <div style={{ fontSize:"0.65rem", color:"#9CA3AF" }}>{f.d} • Emergency Ready</div>
                         </div>
                         <div style={{ fontSize:"0.7rem", fontWeight:800, color:"#10B981" }}>{f.t}</div>
                      </div>
                    ))}
                 </div>
              </div>

              <div style={{ padding:"16px", background:"#111827", borderRadius:16, color:"white" }}>
                 <div style={{ fontSize:"0.65rem", fontWeight:800, color:"#9CA3AF", textTransform:"uppercase", marginBottom:10 }}>RapidSOS Integration</div>
                 <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:40, height:40, borderRadius:8, background:"#EF4444", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.2rem" }}>🛰</div>
                    <div>
                       <div style={{ fontSize:"0.85rem", fontWeight:800 }}>PSAP Connected</div>
                       <div style={{ fontSize:"0.65rem", color:"#9CA3AF" }}>Direct link to Emergency Services</div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
