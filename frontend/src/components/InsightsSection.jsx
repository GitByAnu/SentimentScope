// src/components/InsightsSection.jsx

function EvidenceCard({ post }) {
  const lbl   = post.sentiment_label
  const score = post.sentiment_score || 0
  const cls   = lbl.toLowerCase()
  const scoreStr   = (score >= 0 ? '+' : '') + score.toFixed(3)
  const scoreClass = lbl === 'Positive' ? 'pos' : lbl === 'Negative' ? 'neg' : 'neu'

  return (
    <div className={`evidence-card ev-${cls}`}>
      <div className="evidence-card-top">
        <span className={`evidence-pill ev-${cls}`}>{lbl}</span>
        <span className={`evidence-score ${scoreClass}`}>{scoreStr}</span>
        <span className="evidence-topic">{post.keyword || 'general'}</span>
      </div>
      <div className="evidence-text">
        "{(post.cleaned_text || '').slice(0, 110)}{(post.cleaned_text || '').length > 110 ? '…' : ''}"
      </div>
    </div>
  )
}

export default function InsightsSection({ insightsData, onExportReport }) {
  const {
    insights      = [],
    recommendations = [],
    confidence    = 70,
    sample_posts  = [],
  } = insightsData || {}

  // Pick one of each label for evidence
  const ORDER = ['Negative', 'Positive', 'Neutral']
  const picked = []
  for (const label of ORDER) {
    const found = sample_posts.find(p => p.sentiment_label === label)
    if (found) picked.push(found)
    if (picked.length >= 3) break
  }

  const isLoading = !insightsData

  return (
    <section className="section insights-section" id="insights">
      <div className="section-header">
        <div>
          <h2 className="section-title">Key Insights &amp; Recommendations</h2>
          <p className="section-sub">Real-time updates across filtered results</p>
        </div>
        <div className="section-header-right">
          <button className="btn-export-report" onClick={onExportReport}>
            <i className="fas fa-file-lines" /> Export Report
          </button>
        </div>
      </div>

      {/* Row 1: Insights + Recommendations */}
      <div className="insights-grid">

        {/* Analysis Insights */}
        <div className="glass-card insights-card">
          <div className="insights-card-header">
            <span className="insights-icon">📊</span>
            <h3>Analysis Insights</h3>
          </div>
          <ul className="insights-list">
            {isLoading ? (
              <>
                <li className="insight-item skeleton-insight"><div className="skeleton-line" /></li>
                <li className="insight-item skeleton-insight"><div className="skeleton-line short" /></li>
                <li className="insight-item skeleton-insight"><div className="skeleton-line" /></li>
              </>
            ) : insights.slice(0, 5).map((ins, i) => (
              <li
                key={i}
                className={`insight-item type-${ins.type || 'info'}`}
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <span className="insight-icon-sm">{ins.icon}</span>
                <span>{ins.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recommendations */}
        <div className="glass-card insights-card">
          <div className="insights-card-header">
            <span className="insights-icon">🎯</span>
            <h3>Recommendations</h3>
          </div>
          <ul className="recs-list">
            {isLoading ? (
              <>
                <li className="rec-item skeleton-insight"><div className="skeleton-line" /></li>
                <li className="rec-item skeleton-insight"><div className="skeleton-line short" /></li>
                <li className="rec-item skeleton-insight"><div className="skeleton-line" /></li>
              </>
            ) : recommendations.slice(0, 4).map((rec, i) => (
              <li
                key={i}
                className="rec-item"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <span className="rec-icon">{rec.icon}</span>
                <span>{rec.text}</span>
              </li>
            ))}
          </ul>
          <div className="conf-band-wrap">
            <span className="conf-band-label">Model Confidence</span>
            <div className="conf-band-track">
              <div className="conf-band-fill" style={{ width: `${confidence}%` }} />
            </div>
            <span className="conf-band-pct">{confidence}%</span>
          </div>
        </div>
      </div>

      {/* Row 2: Evidence cards — full width */}
      {picked.length > 0 && (
        <div className="glass-card evidence-standalone">
          <div className="evidence-standalone-header">
            <span className="evidence-label">Signal Evidence</span>
            <span className="evidence-hint">Representative posts from the dataset</span>
          </div>
          <div className="evidence-cards-row">
            {picked.map((p, i) => <EvidenceCard key={i} post={p} />)}
          </div>
        </div>
      )}
    </section>
  )
}