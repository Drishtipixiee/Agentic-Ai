import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(10, 22, 40, 0.95)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: 12,
    }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function RiskTimeline({ data }) {
  return (
    <div className="card" style={{ flex: 1 }}>
      <div className="card__header">
        <span className="card__title">Risk Timeline (24h Simulation)</span>
        <span className="card__badge" style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--accent-blue)' }}>
          Live
        </span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="time"
            tick={{ fill: '#3d5a73', fontSize: 10 }}
            interval="preserveStartEnd"
            tickLine={false}
          />
          <YAxis tick={{ fill: '#3d5a73', fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
          <ReferenceLine y={5} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Action', fill: '#f59e0b', fontSize: 10 }} />
          <ReferenceLine y={7} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Urgent', fill: '#ef4444', fontSize: 10 }} />
          <Line
            type="monotone"
            dataKey="news2"
            stroke="#38bdf8"
            strokeWidth={2}
            dot={false}
            name="NEWS2 Score"
            activeDot={{ r: 4, fill: '#38bdf8' }}
          />
          <Line
            type="monotone"
            dataKey="spo2"
            stroke="#14b8a6"
            strokeWidth={1.5}
            dot={false}
            name="SpO₂"
            activeDot={{ r: 3, fill: '#14b8a6' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
