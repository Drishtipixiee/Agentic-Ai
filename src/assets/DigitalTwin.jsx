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
      <div className="card-header" style={{ borderBottom: '1px solid #1E293B' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Brain size={18} color="#8B5CF6" />
          <span className="card-title" style={{ color: 'white' }}>Digital Twin Pro — V2.4</span>
        </div>
        <span style={{ fontSize: '0.6rem', padding: '3px 8px', background: '#1E293B', borderRadius: 99, color: '#94A3B8', fontWeight: 700 }}>HIGH FIDELITY</span>
      </div>
      
      <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
        {/* Anatomical Model */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <svg viewBox="0 0 100 200" width="120" height="240">
            {/* Body Outline */}
            <path d="M50,15 L65,35 L62,70 L38,70 L35,35 Z" fill="#1E293B" opacity="0.6" />
            <rect x="35" y="70" width="30" height="90" rx="10" fill="#1E293B" opacity="0.6" />
            
            {/* Skeletal Structure Analogy */}
            <line x1="50" y1="35" x2="50" y2="160" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" />

            {/* Heart */}
            <g onMouseEnter={() => setHoveredOrgan('Heart')} onMouseLeave={() => setHoveredOrgan(null)}>
              <circle cx="55" cy="85" r="7" fill={getOrganColor(twinData.organs[0].status)} style={{ cursor: 'pointer', filter: 'blur(1px)' }}>
                <animate attributeName="r" values="6;8;6" dur={`${60/twinData.temperature}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.7;1;0.7" dur="0.8s" repeatCount="indefinite" />
              </circle>
              {hoveredOrgan === 'Heart' && (
                <rect x="65" y="75" width="40" height="20" rx="4" fill="white" />
              )}
            </g>

            {/* Lungs */}
            <g onMouseEnter={() => setHoveredOrgan('Lungs')} onMouseLeave={() => setHoveredOrgan(null)}>
              <path d="M42,80 Q50,70 58,80" fill="none" stroke={getOrganColor(twinData.organs[1].status)} strokeWidth="5" strokeLinecap="round" style={{ cursor: 'pointer' }}>
                <animate attributeName="stroke-width" values="4;6;4" dur="2s" repeatCount="indefinite" />
              </path>
            </g>

            {/* Brain/Neural */}
            <circle cx="50" cy="25" r="8" fill="#8B5CF6" opacity="0.4">
               <animate attributeName="opacity" values="0.2;0.5;0.2" dur="4s" repeatCount="indefinite" />
            </circle>
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
