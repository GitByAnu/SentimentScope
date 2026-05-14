// src/components/ReportModal.jsx
import { useEffect } from 'react'
import { fmt, fmtTime } from '../utils/chartConfig'

export default function ReportModal({ isOpen, onClose, reportData }) {
  const { meta = {}, insights = {}, filters = {} } = reportData || {}

  // Close on Escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const activeFilters = [
    filters.keyword !== 'all' ? `Topic: ${filters.keyword}` : null,
    filters.region  !== 'all' ? `Region: ${filters.region}`  : null,
    filters.q       ? `Search: "${filters.q}"`               : null,
  ].filter(Boolean).join(' · ') || 'All data'

  const now = new Date().toLocaleString()

  const handleDownload = () => {
    const lines = [
      '═══════════════════════════════════════════',
      '  SENTIMENTSCOPE — ANALYTICS REPORT',
      '═══════════════════════════════════════════',
      `  Generated : ${now}`,
      `  Filters   : ${activeFilters}`,
      '───────────────────────────────────────────',
      '',
      'KEY METRICS',
      `  Posts Analyzed : ${fmt(meta.total || 0)}`,
      `  Positive       : ${meta.pos_pct || 0}%`,
      `  Negative       : ${meta.neg_pct || 0}%`,
      `  Neutral        : ${meta.neu_pct || 0}%`,
      `  Compound Score : ${meta.avg_score !== undefined ? (meta.avg_score >= 0 ? '+' : '') + meta.avg_score.toFixed(3) : '—'}`,
      `  Trending Topic : ${meta.trending_topic || '—'}`,
      '',
      'ANALYSIS INSIGHTS',
      ...(insights.insights || []).map(i => `  ${i.icon} ${i.text}`),
      '',
      'RECOMMENDATIONS',
      ...(insights.recommendations || []).map(r => `  ${r.icon} ${r.text}`),
      '',
      '───────────────────────────────────────────',
      '  SentimentScope · NLP Analytics Platform',
      '  Confidential — Not for public distribution',
      '═══════════════════════════════════════════',
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const a    = document.createElement('a')
    a.href     = URL.createObjectURL(blob)
    a.download = `SentimentScope_Report_${new Date().toISOString().slice(0,10)}.txt`
    a.click()
  }

  return (
    <div
      className={`report-overlay${isOpen ? ' open' : ''}`}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="report-modal">
        <div className="report-modal-header">
          <div>
            <div className="report-modal-title">◈ SentimentScope Report</div>
            <div className="report-modal-meta">Generated: {now} · Filters: {activeFilters}</div>
          </div>
          <button className="report-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="report-section">
          <div className="report-section-title">Key Metrics</div>
          <div className="report-kpi-row">
            <div className="report-kpi"><div className="report-kpi-val cyan">{fmt(meta.total||0)}</div><div className="report-kpi-label">Posts Analyzed</div></div>
            <div className="report-kpi"><div className="report-kpi-val cyan">{meta.pos_pct||0}%</div><div className="report-kpi-label">Positive</div></div>
            <div className="report-kpi"><div className="report-kpi-val red">{meta.neg_pct||0}%</div><div className="report-kpi-label">Negative</div></div>
          </div>
          <div className="report-kpi-row" style={{ marginTop:10 }}>
            <div className="report-kpi"><div className="report-kpi-val muted">{meta.neu_pct||0}%</div><div className="report-kpi-label">Neutral</div></div>
            <div className="report-kpi">
              <div className="report-kpi-val cyan">
                {meta.avg_score !== undefined ? (meta.avg_score >= 0 ? '+' : '') + meta.avg_score.toFixed(3) : '—'}
              </div>
              <div className="report-kpi-label">Compound Score</div>
            </div>
            <div className="report-kpi"><div className="report-kpi-val yellow">{meta.trending_topic||'—'}</div><div className="report-kpi-label">Trending Topic</div></div>
          </div>
        </div>

        <div className="report-divider" />

        <div className="report-section">
          <div className="report-section-title">Analysis Insights</div>
          {(insights.insights||[]).map((ins, i) => (
            <div className="report-insight-row" key={i}>
              <span style={{ flexShrink:0 }}>{ins.icon}</span>
              <span>{ins.text}</span>
            </div>
          ))}
        </div>

        <div className="report-divider" />

        <div className="report-section">
          <div className="report-section-title">Recommendations</div>
          {(insights.recommendations||[]).map((rec, i) => (
            <div className="report-insight-row" key={i}>
              <span style={{ flexShrink:0 }}>{rec.icon}</span>
              <span>{rec.text}</span>
            </div>
          ))}
        </div>

        <div className="report-footer">
          SentimentScope · NLP Analytics Platform · Confidential
        </div>
        <button className="report-download-btn" onClick={handleDownload}>
          Download as Text Report
        </button>
      </div>
    </div>
  )
}