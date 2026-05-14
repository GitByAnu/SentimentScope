// src/components/KpiStrip.jsx
import KpiSparkline from './charts/KpiSparkline'
import KpiRing      from './charts/KpiRing'
import { fmt, fmtTime } from '../utils/chartConfig'
import { C } from '../utils/chartConfig'

export default function KpiStrip({ meta, trends }) {
  if (!meta) return (
    <div className="kpi-strip">
      {[1,2,3,4].map(i => (
        <div key={i} className="kpi-card">
          <div className="kpi-body">
            <div className="kpi-label">Loading…</div>
            <div className="kpi-value">—</div>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="kpi-strip">

      <div className="kpi-card">
        <div className="kpi-icon-wrap teal"><i className="fas fa-comments" /></div>
        <div className="kpi-body">
          <div className="kpi-label">Total Posts</div>
          <div className="kpi-value">{fmt(meta.total)}</div>
          <div className="kpi-sub">Live data</div>
        </div>
        {trends && <KpiSparkline trends={trends} />}
      </div>

      <div className="kpi-card">
        <div className="kpi-icon-wrap green"><i className="fas fa-arrow-trend-up" /></div>
        <div className="kpi-body">
          <div className="kpi-label">Positive</div>
          <div className="kpi-value cyan">{meta.pos_pct}%</div>
          <div className="kpi-sub">Positive engagement</div>
        </div>
        <KpiRing pct={meta.pos_pct} color={C.cyan} />
      </div>

      <div className="kpi-card">
        <div className="kpi-icon-wrap red"><i className="fas fa-arrow-trend-down" /></div>
        <div className="kpi-body">
          <div className="kpi-label">Negative</div>
          <div className="kpi-value red">{meta.neg_pct}%</div>
          <div className="kpi-sub">Negative feedback</div>
        </div>
        <KpiRing pct={meta.neg_pct} color={C.red} />
      </div>

      <div className="kpi-card">
        <div className="kpi-icon-wrap yellow"><i className="fas fa-fire" /></div>
        <div className="kpi-body">
          <div className="kpi-label">Trending Topic</div>
          <div className="kpi-value yellow">{meta.trending_topic || '#General'}</div>
          <div className="kpi-sub">Updated {fmtTime()}</div>
        </div>
      </div>

    </div>
  )
}