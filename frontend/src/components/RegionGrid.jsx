// src/components/RegionGrid.jsx
import { fmt } from '../utils/chartConfig'

function RegionCard({ r }) {
  const total = r.total || (r.Positive + r.Negative + r.Neutral)
  const pp = total ? +(r.Positive / total * 100).toFixed(1) : 0
  const np = total ? +(r.Negative / total * 100).toFixed(1) : 0
  const nu = total ? +(r.Neutral  / total * 100).toFixed(1) : 0

  return (
    <div className="region-card">
      <div className="region-card-header">
        <span className="region-name">{r.region}</span>
        <span className="region-total">{fmt(total)} posts</span>
      </div>
      <div className="region-bars">
        {[
          { label:'Positive', pct:pp, color:'var(--cyan)' },
          { label:'Negative', pct:np, color:'var(--red)' },
          { label:'Neutral',  pct:nu, color:'#6b7a99' },
        ].map(({ label, pct, color }) => (
          <div className="region-bar-row" key={label}>
            <span className="region-bar-label" style={{ color }}>{label}</span>
            <div className="region-bar-track">
              <div className="region-bar-fill" style={{ width:`${pct}%`, background:color }} />
            </div>
            <span className="region-bar-pct" style={{ color }}>{pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function RegionGrid({ regions }) {
  if (!regions?.length) return null
  return (
    <div className="region-section">
      <div className="region-section-header">
        <h3 className="region-title">Regional Breakdown</h3>
        <span className="region-subtitle">Sentiment across 6 geographic regions</span>
      </div>
      <div className="region-grid">
        {regions.map(r => <RegionCard key={r.region} r={r} />)}
      </div>
    </div>
  )
}