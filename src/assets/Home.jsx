import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = ({ user }) => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      {/* Background Image Layer */}
      <div className="hero-bg-overlay"></div>
      
      {/* Navigation */}
      <nav className="home-nav">
        <div className="logo">
           <div className="logo-icon">Sv</div>
           <span>SvasthAI</span>
        </div>
        
        <div className="nav-actions">
           {user ? (
             <button className="start-btn" onClick={() => navigate('/dashboard')}>
               Go to Dashboard <span className="arrow">→</span>
             </button>
           ) : (
             <button className="start-btn" onClick={() => navigate('/login')}>
               Get Started <span className="arrow">→</span>
             </button>
           )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="hero-section">
        <div className="hero-content fade-in">
          <div className="badge-new">NEW: Model V4.2 Released with 5 Autonomous Agents</div>
          <p className="subtitle">THE NEXT FRONTIER IN CLINICAL SAFETY</p>
          <h1 className="hero-title">
            SELF-MANAGING <br />
            <span className="accent-text">PATIENT CARE.</span>
          </h1>
          
          <div className="hero-description-row">
            <p className="description-text">
              An autonomous multi-agent ecosystem that monitors 6 vital parameters in real-time, 
              detects critical anomalies with LLM reasoning, and independently coordinates 
              emergency services — before you even look at the screen.
            </p>
          </div>

          <div className="hero-cta">
             <button className="dashboard-btn" onClick={() => navigate('/dashboard')}>
               Launch Command Center <span className="arrow">→</span>
             </button>
             <button className="secondary-btn" onClick={() => navigate('/login')}>
               Clinical Documentation
             </button>
          </div>

          <div className="home-trust-badges">
             <div className="trust-item">
                <span className="trust-val">250Hz</span>
                <span className="trust-lab">Live Sampling</span>
             </div>
             <div className="trust-sep"></div>
             <div className="trust-item">
                <span className="trust-val">18ms</span>
                <span className="trust-lab">Inference Lag</span>
             </div>
             <div className="trust-sep"></div>
             <div className="trust-item">
                <span className="trust-val">XAI</span>
                <span className="trust-lab">Explainable AI</span>
             </div>
          </div>
        </div>

        {/* Floating Features */}
        <div className="floating-features">
           {[
             { i:"🤖", t:"5 Agents", d:"Autonomous clinical pipeline" },
             { i:"🛰", t:"SOS Ready", d:"Direct dispatch to PSAP" },
             { i:"🎙", t:"Speech AI", d:"Voice-activated consultation" }
           ].map((f, i) => (
             <div key={i} className="feature-bubble" style={{ animationDelay: `${i*1.5}s` }}>
                <span className="f-icon">{f.i}</span>
                <div>
                   <div className="f-title">{f.t}</div>
                   <div className="f-desc">{f.d}</div>
                </div>
             </div>
           ))}
        </div>
      </main>

      {/* Footer Info */}
      <div className="home-footer-info">
         <div style={{ display:"flex", gap:40 }}>
            <div>
               <div className="f-footer-title">MONITORED PARAMETERS</div>
               <div className="f-footer-list">Heart Rate • SpO2 • HRV • Resp • Temp • Blood Pressure</div>
            </div>
            <div>
               <div className="f-footer-title">SECURITY & STANDARDS</div>
               <div className="f-footer-list">JWT Secured • HIPAA Compliance • 256-bit AES • LLM Verified</div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Home;