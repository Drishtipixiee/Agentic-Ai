import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar, { useVitals } from "./Navbar";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function DiagnosticAgent({ user, onLogout }) {
  const navigate = useNavigate();
  const { vitals, risk, agents } = useVitals();
  const [diagData, setDiagData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [xaiData, setXaiData] = useState(null);

  const fetchDiagnosis = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/diagnostic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vitals })
      });
      const data = await res.json();
      setDiagData(data);
      
      const resXai = await fetch(`${API}/api/logos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vitals, risk })
      });
      setXaiData(await resXai.json());
    } catch(e) {}
    setLoading(false);
  };

  useEffect(() => {
    if (vitals && !diagData) fetchDiagnosis();
    const int = setInterval(fetchDiagnosis, 15000); // Update every 15s or manually
    return () => clearInterval(int);
  }, [vitals]);

  const riskCol = { stable:"#10B981", medium:"#F59E0B", high:"#F97316", critical:"#EF4444" };

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
                <span style={{ color:"#8B5CF6" }}>◇</span> DiagnosticAgent
              </h1>
            </div>
            <p style={{ color:"#64748B", fontSize:"0.85rem", marginTop:4, marginLeft:88 }}>
              Agent ID: diagnostic-v2.0.5 · LLM-Powered Differential Diagnosis · Evidence Reconstruction · ICD-10 Mapping
            </p>
          </div>
          <button onClick={fetchDiagnosis} className="btn btn-primary" disabled={loading} style={{ fontSize:"0.8rem" }}>
            {loading ? "Analyzing..." : "🔄 Refresh Diagnosis"}
          </button>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 400px", gap:16 }}>
          {/* Main Diagnosis Card */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
             <div className="card">
                <div className="card-header">
                  <span className="card-title">Differential Diagnosis Report</span>
                  <span style={{ fontSize:"0.65rem", fontWeight:700, color:"#94A3B8" }}>Powered by Google Gemini + DeepSeek</span>
                </div>
                <div className="card-body">
                   {diagData ? (
                     <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:12 }}>
                           {diagData.diagnoses.map((d, i) => (
                             <div key={i} style={{ padding:"16px", background: i===0 ? "#F5F3FF" : "#F8FAFC", border: i===0 ? "1.5px solid #DDD6FE" : "1.5px solid #E2E8F0", borderRadius:14 }}>
                               <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                                 <span style={{ fontSize:"0.65rem", fontWeight:800, color: i===0 ? "#7C3AED" : "#94A3B8", textTransform:"uppercase" }}>Hypothesis {i+1}</span>
                                 <span style={{ fontSize:"0.72rem", fontWeight:800, color: d.urgency === 'critical' ? "#EF4444" : d.urgency === 'high' ? "#F97316" : "#10B981" }}>{d.confidence}% Conf.</span>
                               </div>
                               <h3 style={{ fontSize:"1.1rem", fontWeight:800, color:"#1E293B", marginBottom:6 }}>{d.condition}</h3>
                               <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                                  <span style={{ fontSize:"0.7rem", color:"#64748B", fontWeight:600 }}>ICD-10: {d.icd}</span>
                                  <span style={{ width:4, height:4, borderRadius:"50%", background:"#CBD5E1" }}></span>
                                  <span style={{ fontSize:"0.7rem", fontWeight:700, color: d.urgency === 'critical' ? "#EF4444" : "#64748B" }}>{d.urgency.toUpperCase()} URGENCY</span>
                               </div>
                             </div>
                           ))}
                        </div>
                        <div style={{ borderTop:"1.5px solid #F1F5F9", paddingTop:16 }}>
                           <h4 style={{ fontSize:"0.85rem", fontWeight:700, color:"#1E293B", marginBottom:8 }}>Clinical Rationale (XAI)</h4>
                           <p style={{ fontSize:"0.88rem", color:"#475569", lineHeight:1.6, background:"#F8FAFC", padding:"16px", borderRadius:12, borderLeft:"4px solid #8B5CF6" }}>
                             {diagData.rationale}
                           </p>
                        </div>
                     </div>
                   ) : (
                     <div style={{ padding:"40px", textAlign:"center", color:"#94A3B8" }}>
                        <span className="spinner" style={{ marginBottom:12 }}></span>
                        <p>Generating clinical differential diagnosis...</p>
                     </div>
                   )}
                </div>
             </div>

             {/* Web Speech Prompt */}
             <div className="card" style={{ background:"linear-gradient(135deg, #F5F3FF, #EDE9FE)" }}>
                <div className="card-body" style={{ display:"flex", alignItems:"center", gap:20 }}>
                   <div style={{ width:50, height:50, borderRadius:"50%", background:"#8B5CF6", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.5rem" }}>🎙</div>
                   <div>
                      <h4 style={{ fontSize:"0.95rem", fontWeight:700, color:"#2E1065" }}>Voice Consultation Enabled</h4>
                      <p style={{ fontSize:"0.82rem", color:"#5B21B6", marginTop:2 }}>Ask SvasthAI: "Explain the diagnosis for Roshani Singh" or "What is the recommended treatment?"</p>
                   </div>
                   <button className="btn btn-primary" style={{ marginLeft:"auto", background:"#8B5CF6" }}>Open Voice Assistant</button>
                </div>
             </div>
          </div>

          {/* Right Panel: XAI Flow */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
             <div className="card">
                <div className="card-header"><span className="card-title">Reasoning Graph</span></div>
                <div className="card-body" style={{ padding:"24px 16px" }}>
                   {xaiData?.graphNodes?.length > 0 ? (
                     <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
                        {xaiData.graphNodes.map((n, i) => (
                          <React.Fragment key={n.id}>
                            <div style={{ padding:"12px", background:"white", border:"1.5px solid #E2E8F0", borderRadius:10, boxShadow:"0 2px 4px rgba(0,0,0,0.02)", position:"relative", zIndex:1 }}>
                              <div style={{ fontSize:"0.6rem", fontWeight:800, color:"#94A3B8", textTransform:"uppercase", marginBottom:4 }}>{n.type}</div>
                              <div style={{ fontSize:"0.8rem", fontWeight:700, color:"#334155" }}>{n.label}</div>
                              {n.confidence && <div style={{ fontSize:"0.65rem", color:"#10B981", fontWeight:700, marginTop:4 }}>Confidence: {(n.confidence * 100).toFixed(0)}%</div>}
                            </div>
                            {i < xaiData.graphNodes.length - 1 && (
                              <div style={{ height:20, width:1.5, background:"#8B5CF6", marginLeft:20, opacity:0.4 }}></div>
                            )}
                          </React.Fragment>
                        ))}
                     </div>
                   ) : (
                     <div style={{ color:"#94A3B8", fontSize:"0.8rem", textAlign:"center", padding:"20px" }}>Awaiting reasoning cycle...</div>
                   )}
                </div>
             </div>

             <div className="card">
                <div className="card-header"><span className="card-title">Clinical Recommendation</span></div>
                <div className="card-body">
                   <p style={{ fontSize:"0.82rem", color:"#475569", lineHeight:1.5, marginBottom:12 }}>
                     {xaiData?.recommendation || "Maintain current observation protocol until differential confirmation."}
                   </p>
                   <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:"0.7rem", fontWeight:700, color:"#94A3B8" }}>XAI Certainty</span>
                      <span style={{ fontSize:"0.8rem", fontWeight:800, color:"#8B5CF6" }}>{(xaiData?.xaiScore * 100)?.toFixed(0) || 0}%</span>
                   </div>
                   <div style={{ height:5, background:"#F1F5F9", borderRadius:99, marginTop:8, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${(xaiData?.xaiScore * 100) || 0}%`, background:"#8B5CF6" }}></div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Diagnostic Metadata */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginTop:16 }}>
          {[
            { l:"Inference Cycles", v: agents?.diagnostic?.tasks || 0, c:"#8B5CF6" },
            { l:"Reasoning Engine", v:"DeepSeek-R1", c:"#6366F1" },
            { l:"Rationale Confidence", v:"High", c:"#10B981" },
            { l:"Knowledge Base", v:"ICD-10-CM", c:"#F59E0B" }
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
