// src/components/HeroSection.jsx
import GaugeChart    from './charts/GaugeChart'
import HeroMiniChart from './charts/HeroMiniChart'
import KpiStrip      from './KpiStrip'

export default function HeroSection({ meta, trends }) {
  return (
    <section className="hero" id="hero">
      <div className="container">
        <div className="hero-content">

          {/* Left: text */}
          <div className="hero-text">
            <div className="hero-badge">
              <span className="badge-dot" />
              10K+ Posts • Live Trend Monitoring
            </div>
            <h1>
              Track Public{' '}
              <span className="gradient-text">Sentiment &amp; Emerging Trends</span>{' '}
              Instantly
            </h1>
            <p className="hero-sub">
              Track sentiment patterns, trending discussions, and audience perception
              in real time through interactive analytics.
            </p>
            <div className="hero-actions">
              <a href="#dashboard" className="btn-primary">
                Explore Dashboard <span className="arrow">→</span>
              </a>
              <a href="#insights" className="btn-outline">View Insights</a>
            </div>
          </div>

          {/* Right: gauge + mini chart */}
          <div className="hero-visual">
            <GaugeChart avgScore={meta?.avg_score ?? 0} />
            <HeroMiniChart trends={trends} />
          </div>

        </div>
      </div>

      {/* KPI Strip */}
      <div className="container">
        <KpiStrip meta={meta} trends={trends} />
      </div>
    </section>
  )
}