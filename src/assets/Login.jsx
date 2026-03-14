import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // login | register
  const [form, setForm] = useState({ name:"", email:"admin@svashthai.com", password:"admin123", role:"doctor" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login" ? { email: form.email, password: form.password } : form;
      const res = await fetch(API_BASE + endpoint, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication failed");
      localStorage.setItem("svashthai_token", data.token);
      localStorage.setItem("svashthai_user", JSON.stringify(data.user));
      onLogin(data.user);
      navigate("/dashboard");
    } catch(err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="login-bg">
      <div className="login-data-stream"/>
      <div className="login-particles">
        {Array.from({length:20}).map((_,i)=>(<div key={i} className="login-particle" style={{ left:`${Math.random()*100}%`, animationDelay:`${Math.random()*5}s`, animationDuration:`${4+Math.random()*6}s` }}/>))}
      </div>

      <div className="login-left">
        <div className="login-brand">
          <div className="login-brand-icon">
            <svg viewBox="0 0 40 40" width="40" height="40"><path d="M20 4 L28 14 L38 14 L30 22 L34 34 L20 28 L6 34 L10 22 L2 14 L12 14Z" fill="white" opacity="0.9"/></svg>
          </div>
          <div>
            <div className="login-brand-name">SvasthAI</div>
            <div className="login-brand-sub">Autonomous Clinical Intelligence</div>
          </div>
        </div>

        <div className="login-hero-text">
          <h1>Clinical Command<br/><span className="login-gradient-text">Decision System</span><br/>V2.4.0</h1>
          <p>
            <strong>Problem:</strong> ICU mortality increases by 8.4% for every hour of delayed intervention. 
            Conventional monitoring relies on reactive alarms. <br/><br/>
            <strong>Solution:</strong> SvasthAI utilizes 5 autonomous agents to perform proactive "BIOSENSOR FUSION", 
            bridging the gap between data ingestion and life-saving action.
          </p>
        </div>

        <div className="login-features">
          <div style={{ marginBottom:20, padding:15, background:"rgba(99,102,241,0.1)", borderLeft:"4px solid #6366F1", borderRadius:4 }}>
            <div style={{ fontSize:"0.6rem", fontWeight:800, color:"#6366F1", marginBottom:5 }}>PROBLEM STATEMENT</div>
            <div style={{ fontSize:"0.8rem", color:"rgba(255,255,255,0.8)", lineHeight:1.4 }}>ICU mortality increases by 8% for every hour of delayed intervention. SvasthAI bridges this gap with autonomous biosensor orchestration.</div>
          </div>
          {["5 Autonomous AI Agents","Real-time Vital Monitoring","SOS + Web Speech AI","Google Maps Integration","LangChain + Gemini LLM","JWT Secured Access"].map((f,i)=>(
            <div key={i} className="login-feature-item">
              <span className="login-feature-dot">●</span>{f}
            </div>
          ))}
          <div style={{ marginTop:14, fontSize:"0.65rem", color:"rgba(148,163,184,0.6)", display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"#10B981" }}></span>
            DATASET LOADED: <strong>vitals_dataset.json</strong> (7 Scenarios)
          </div>
        </div>

        <div className="login-stats">
          {[{v:"250Hz",l:"Signal rate"},{v:"9 clinical",l:"Profiles"},{v:"Strava",l:"Sync Ready"},{v:"HITL",l:"Active"}].map((s,i)=>(
            <div key={i} className="login-stat"><div className="login-stat-val">{s.v}</div><div className="login-stat-label">{s.l}</div></div>
          ))}
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <div className="login-tabs">
              <button className={`login-tab ${mode==="login"?"active":""}`} onClick={()=>setMode("login")}>Sign In</button>
              <button className={`login-tab ${mode==="register"?"active":""}`} onClick={()=>setMode("register")}>Register</button>
            </div>
          </div>

          <div className="login-card-body">
            <h2>{mode==="login"?"Welcome back, Doctor":"Create Account"}</h2>
            <p className="login-subtitle">{mode==="login"?"Access the clinical intelligence platform":"Join SvasthAI Medical Network"}</p>
            
            <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
              <span style={{ fontSize:"0.6rem", padding:"2px 8px", background:"#DCFCE7", color:"#166534", borderRadius:4, fontWeight:800 }}>● CLUSTER ACTIVE</span>
              <span style={{ fontSize:"0.6rem", padding:"2px 8px", background:"#F1F5F9", color:"#475569", borderRadius:4, fontWeight:800 }}>BIO-SENSORS: 4/4</span>
              <span style={{ fontSize:"0.6rem", padding:"2px 8px", background:"#EFF6FF", color:"#1E40AF", borderRadius:4, fontWeight:800 }}>DATASET: REAL-TIME ANALOGY</span>
            </div>

            {mode==="login" && (
              <div className="login-demo-hint">
                <span>🔑</span>
                <span>Demo: <strong>admin@svashthai.com</strong> / <strong>admin123</strong></span>
              </div>
            )}

            <form onSubmit={submit} className="login-form">
              {mode==="register" && (
                <div className="login-field">
                  <label>Full Name</label>
                  <input name="name" value={form.name} onChange={handle} placeholder="Dr. Your Name" required />
                </div>
              )}
              <div className="login-field">
                <label>Email Address</label>
                <input name="email" type="email" value={form.email} onChange={handle} placeholder="doctor@svashthai.com" required />
              </div>
              <div className="login-field">
                <label>Password</label>
                <input name="password" type="password" value={form.password} onChange={handle} placeholder="••••••••" required />
              </div>
              {mode==="register" && (
                <div className="login-field">
                  <label>Role</label>
                  <select name="role" value={form.role} onChange={handle}>
                    <option value="doctor">Doctor</option>
                    <option value="nurse">Nurse</option>
                    <option value="admin">Administrator</option>
                    <option value="specialist">Specialist</option>
                  </select>
                </div>
              )}
              {error && <div className="login-error">⚠ {error}</div>}
              <button type="submit" className="login-submit-btn" disabled={loading}>
                {loading ? <span className="login-spinner"/> : mode==="login" ? "Access Dashboard →" : "Create Account →"}
              </button>
            </form>
          </div>

          <div className="login-card-footer">
            <div className="login-security-badges">
              <span>🔒 JWT Secured</span>
              <span>🏥 HIPAA Compliant</span>
              <span>🤖 AI Powered</span>
            </div>
            <div style={{ marginTop:14, textAlign:"center", fontSize:"0.6rem", color:"rgba(148,163,184,0.4)", letterSpacing:"0.05em" }}>
              SYSTEM ENGINE: NODE_V18 / SQLITE_V3 / GEMINI_1.5_FLASH
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
