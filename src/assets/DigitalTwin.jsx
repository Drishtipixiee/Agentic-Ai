import React, { useState } from 'react';
import { Activity, Thermometer, Brain, Wind } from 'lucide-react';

export default function DigitalTwin({ twinData }) {
  const [hoveredOrgan, setHoveredOrgan] = useState(null);

  if (!twinData) return (
    <div className="card" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner"></div>
    </div>
  );

  const getOrganColor = (status) => {
    if (status === 'STRESS' || status === 'HYPOXIC') return '#EF4444';
    if (status === 'NORMAL' || status === 'OXYGENATED') return '#10B981';
    return '#6366F1';
  };

  return (
    <div className="card" style={{ background: '#0F172A', color: 'white', border: '1px solid #1E293B' }}>
      <div className="card-header" style={{ borderBottom: '1px solid #1E293B', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '1px', background: 'linear-gradient(90deg, transparent, #6366F1, transparent)', animation: 'scan-line 3s linear infinite' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Brain size={18} color="#8B5CF6" className="animate-pulse" />
          <span className="card-title" style={{ color: 'white', letterSpacing: '1px' }}>DIGITAL TWIN PRO <span style={{ color: '#6366F1' }}>V4.2</span></span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontSize: '0.55rem', padding: '2px 6px', border: '1px solid #10B981', borderRadius: 4, color: '#10B981', fontWeight: 700 }}>LIVE SYNC</span>
          <span style={{ fontSize: '0.55rem', padding: '3px 8px', background: '#1E293B', borderRadius: 99, color: '#94A3B8', fontWeight: 700 }}>NEURAL MAPPING ACTIVE</span>
        </div>
      </div>
      
      <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
        {/* Anatomical Model */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)' }}>
          <svg viewBox="0 0 100 200" width="140" height="280">
            <defs>
              <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1E293B" />
                <stop offset="50%" stopColor="#334155" />
                <stop offset="100%" stopColor="#1E293B" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Scanning Ring */}
            <g transform="translate(50, 100)">
               <ellipse rx="45" ry="15" fill="none" stroke="#6366F1" strokeWidth="0.5" opacity="0.3">
                  <animate attributeName="ry" values="10;20;10" dur="4s" repeatCount="indefinite" />
                  <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="10s" repeatCount="indefinite" />
               </ellipse>
            </g>

            {/* Body Outline */}
            <path d="M50,15 L65,35 L62,70 L65,110 L60,160 L40,160 L35,110 L38,70 L35,35 Z" fill="url(#bodyGradient)" opacity="0.8" stroke="#334155" strokeWidth="0.5" />
            
            {/* Neural System */}
            <line x1="50" y1="35" x2="50" y2="160" stroke="#6366F1" strokeWidth="0.5" strokeDasharray="1 3" opacity="0.5" />

            {/* Brain */}
            <g transform="translate(50, 25)">
              <circle r="6" fill="#8B5CF6" filter="url(#glow)">
                <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
              </circle>
            </g>

            {/* Heart */}
            <g onMouseEnter={() => setHoveredOrgan('Heart')} onMouseLeave={() => setHoveredOrgan(null)}>
              <circle cx="53" cy="85" r="5" fill={getOrganColor(twinData.organs[0].status)} filter="url(#glow)" style={{ cursor: 'pointer' }}>
                <animate attributeName="r" values="4;6;4" dur={`${60/twinData.temperature}s`} repeatCount="indefinite" />
              </circle>
              {/* Pulse waves */}
              <circle cx="53" cy="85" r="5" fill="none" stroke={getOrganColor(twinData.organs[0].status)} strokeWidth="0.5" opacity="0">
                 <animate attributeName="r" values="5;15" dur="1.5s" repeatCount="indefinite" />
                 <animate attributeName="opacity" values="0.6;0" dur="1.5s" repeatCount="indefinite" />
              </circle>
            </g>

            {/* Lungs */}
            <g onMouseEnter={() => setHoveredOrgan('Lungs')} onMouseLeave={() => setHoveredOrgan(null)}>
              <path d="M42,85 Q50,75 58,85 L58,105 Q50,115 42,105 Z" fill={`${getOrganColor(twinData.organs[1].status)}22`} stroke={getOrganColor(twinData.organs[1].status)} strokeWidth="1" style={{ cursor: 'pointer' }}>
                <animate attributeName="opacity" values="0.3;0.7;0.3" dur="4s" repeatCount="indefinite" />
              </path>
            </g>
          </svg>
          
          {/* Overlay Stats */}
          <div style={{ position: 'absolute', bottom: 0, left: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.65rem' }}>
                <Thermometer size={12} color="#F59E0B" /> {twinData.temperature}°C
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.65rem' }}>
                <Wind size={12} color="#06B6D4" /> 82% SpO2
             </div>
          </div>
        </div>

        {/* Metabolic Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {twinData.organs.map((o, i) => (
            <div key={i} style={{ background: '#1E293B', padding: 10, borderRadius: 12, border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {o.name === 'Heart' ? <Activity size={14} color="#EF4444" /> : o.name === 'Lungs' ? <Wind size={14} color="#06B6D4" /> : <Brain size={14} color="#8B5CF6" />}
                  <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{o.name.toUpperCase()}</span>
                </div>
                <span style={{ fontSize: '0.6rem', color: getOrganColor(o.status), fontWeight: 800 }}>{o.status}</span>
              </div>
              <div style={{ height: 4, background: '#0F172A', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${o.load}%`, background: getOrganColor(o.status), borderRadius: 99, transition: 'width 0.8s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                 <span style={{ fontSize: '0.55rem', color: '#64748B' }}>Load Analysis</span>
                 <span style={{ fontSize: '0.55rem', color: '#94A3B8' }}>{o.load}%</span>
              </div>
            </div>
          ))}
          
          <div style={{ padding: 10, background: 'rgba(99,102,241,0.1)', border: '1px dashed rgba(99,102,241,0.3)', borderRadius: 12 }}>
            <div style={{ fontSize: '0.6rem', color: '#6366F1', fontWeight: 800, marginBottom: 4 }}>CLINICAL INSIGHT</div>
            <div style={{ fontSize: '0.7rem', color: '#CBD5E1', lineHeight: 1.4 }}>
              Digital biomarker analysis suggests {twinData.organs[0].status === 'STRESS' ? 'compensatory tachycardia' : 'hemodynamic stability'}.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
