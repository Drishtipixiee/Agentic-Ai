export default function KillSwitch({ active, confidence }) {
  const handleToggle = async () => {
    try {
      await fetch('/api/escalation/toggle', { method: 'POST' });
    } catch (err) {
      console.error('Kill switch toggle failed:', err);
    }
  };

  const pct = confidence !== undefined ? (confidence * 100).toFixed(1) : null;
  const aboveThreshold = confidence >= 0.95;

  return (
    <div className="killswitch-wrapper">
      <div>
        <div className="killswitch__label">Kill Switch</div>
        {pct && (
          <div style={{ fontSize: 10, color: aboveThreshold ? 'var(--risk-high)' : 'var(--text-muted)' }}>
            {pct}% conf.
          </div>
        )}
      </div>
      <label className="killswitch__toggle" title="Toggle escalation kill switch">
        <input
          id="kill-switch-toggle"
          type="checkbox"
          checked={active}
          onChange={handleToggle}
        />
        <span className="killswitch__slider" />
      </label>
      <span
        className="killswitch__status"
        style={{ color: active ? 'var(--risk-high)' : 'var(--risk-stable)' }}
      >
        {active ? 'BLOCKED' : 'ARMED'}
      </span>
    </div>
  );
}
