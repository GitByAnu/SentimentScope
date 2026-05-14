// src/components/AnomalySection.jsx
export default function AnomalySection({ anomalies }) {
  if (!anomalies?.length) return null

  return (
    <div className="anomaly-section">
      <div className="anomaly-header">
        <span>🚨</span>
        <h3>Sentiment Spikes Detected</h3>
        <span className="anomaly-badge">{anomalies.length}</span>
      </div>
      <div className="anomaly-list">
        {anomalies.map(a => (
          <div className="anomaly-item" key={a.date}>
            <span className="anomaly-date">📅 {a.date}</span>
            <span className="anomaly-spike">{a.spike_factor}× spike</span>
            <span className="anomaly-detail">
              <span className="anomaly-neg">{a.negative_count}</span>
              {' '}negative posts out of <strong>{a.total || '—'}</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}