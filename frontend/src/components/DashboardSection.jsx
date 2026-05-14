// src/components/DashboardSection.jsx
import PieChart      from './charts/PieChart'
import LineChart     from './charts/LineChart'
import BarChart      from './charts/BarChart'
import WordCloud     from './charts/WordCloud'
import RegionGrid    from './RegionGrid'
import AnomalySection from './AnomalySection'
import { fmt, fmtTime } from '../utils/chartConfig'

const REGIONS = ['North America','Europe','Asia Pacific','Latin America','Middle East','South Asia']

export default function DashboardSection({
  meta, trends, keywords, regions, wordcloud, anomalies,
  loading, filters, onFilterChange, onReset,
  searchQuery, onClearSearch,
}) {
  const { period, keyword, region, sentiment } = filters

  const handleChange = (key, val) => onFilterChange({ ...filters, [key]: val })

  return (
    <section className="section dashboard-section" id="dashboard">

      {/* Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">Analytics Dashboard</h2>
          <p className="section-sub">
            Real-time analysis across <span>{meta ? fmt(meta.total) : '—'}</span> posts
          </p>
        </div>
        <div className="section-header-right">
          <span className="last-updated-tag">Updated: {fmtTime()}</span>
          <span className="section-badge" id="dashBadge">
            {meta ? `Live · ${fmt(meta.total)}` : 'Live'}
          </span>
        </div>
      </div>

      {/* Loader */}
      {loading && (
        <div className="loading-overlay">
          <div className="loader-ring" />
          <p className="loader-text">Fetching from NLP backend…</p>
        </div>
      )}

      {/* Filters */}
      <div className="filters-row glass-card">
        <div className="filter-group">
          <span className="filter-icon">📅</span>
          <div className="filter-info">
            <label className="filter-label">Period</label>
            <select className="filter-select" value={period} onChange={e => handleChange('period', e.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
        <div className="filter-divider" />
        <div className="filter-group">
          <span className="filter-icon">#</span>
          <div className="filter-info">
            <label className="filter-label">Topic</label>
            <select className="filter-select" value={keyword} onChange={e => handleChange('keyword', e.target.value)}>
              <option value="all">All Topics</option>
              {keywords?.map(k => (
                <option key={k.keyword} value={k.keyword}>
                  {k.keyword.charAt(0).toUpperCase() + k.keyword.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="filter-divider" />
        <div className="filter-group">
          <span className="filter-icon">🌐</span>
          <div className="filter-info">
            <label className="filter-label">Region</label>
            <select className="filter-select" value={region} onChange={e => handleChange('region', e.target.value)}>
              <option value="all">All Regions</option>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="filter-divider" />
        <div className="filter-group">
          <span className="filter-icon">🎭</span>
          <div className="filter-info">
            <label className="filter-label">Sentiment</label>
            <select className="filter-select" value={sentiment} onChange={e => handleChange('sentiment', e.target.value)}>
              <option value="all">All</option>
              <option value="Positive">Positive</option>
              <option value="Negative">Negative</option>
              <option value="Neutral">Neutral</option>
            </select>
          </div>
        </div>
        <button className="btn-reset" onClick={onReset}>↺ Reset</button>
      </div>

      {/* Search result banner */}
      {searchQuery && (
        <div className="search-result-banner">
          <span>🔍 Results for "<strong>{searchQuery}</strong>"</span>
          <button className="banner-clear" onClick={onClearSearch}>✕ Clear</button>
        </div>
      )}

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Pie chart */}
        <div className="chart-card glass-card span-1">
          <div className="chart-card-header">
            <h3 className="chart-title">Sentiment Split</h3>
            <span className="chart-badge">{meta ? fmt(meta.total) : '—'}</span>
          </div>
          <PieChart meta={meta} loading={loading} />
        </div>

        {/* Line chart */}
        <LineChart
          trends={trends}
          loading={loading}
          keyword={keyword}
          region={region}
        />

        {/* Bar chart */}
        <BarChart keywords={keywords} loading={loading} />

        {/* Word cloud */}
        <WordCloud words={wordcloud} loading={loading} />
      </div>

      {/* Regions */}
      <RegionGrid regions={regions} />

      {/* Anomalies */}
      <AnomalySection anomalies={anomalies} />

    </section>
  )
}