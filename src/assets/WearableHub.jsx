import React from 'react';
import { Watch, Smartphone, Activity, Battery, Wifi } from 'lucide-react';

export default function WearableHub({ wearables }) {
  if (!wearables) return null;
  
  const devices = [
    { id: 'appleWatch', label: 'Apple Watch Ultra', icon: <Watch size={18} /> },
    { id: 'oura',       label: 'Oura Ring Gen3',    icon: <Activity size={18} /> },
    { id: 'fitbit',     label: 'Fitbit Charge 6',   icon: <Activity size={18} /> },
    { id: 'garmin',     label: 'Garmin Fenix 7',    icon: <Wifi size={18} /> }
  ];

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">⌚ Wearable Control Hub</span>
        <button className="btn btn-ghost" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>Manage Devices</button>
      </div>
      <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {devices.map(d => {
          const stats = wearables[d.id];
          const isOff = stats.signal === 'OFFLINE';
          
          return (
            <div key={d.id} style={{ padding: 12, borderRadius: 12, border: '1px solid #E2E8F0', background: isOff ? '#F8FAFC' : 'white', opacity: isOff ? 0.6 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ color: isOff ? '#94A3B8' : '#6366F1' }}>{d.icon}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F172A' }}>{d.label}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', color: '#64748B', fontWeight: 600 }}>
                  <Battery size={12} /> {stats.battery}%
                </div>
                <div style={{ fontSize: '0.6rem', padding: '2px 6px', borderRadius: 4, background: isOff ? '#CBD5E1' : '#DCFCE7', color: isOff ? '#475569' : '#166534', fontWeight: 800 }}>
                  {stats.signal}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
