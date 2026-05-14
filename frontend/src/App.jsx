// src/App.jsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchDashboard, checkHealth } from './services/api'
import { initChartDefaults } from './utils/chartConfig'
import Navbar            from './components/Navbar'
import HeroSection       from './components/HeroSection'
import DashboardSection  from './components/DashboardSection'
import InsightsSection   from './components/InsightsSection'
import ReportModal       from './components/ReportModal'
import { AboutSection, Footer } from './components/StaticSections'
import { useToast }      from './hooks/useToast'

initChartDefaults()

const DEFAULT_FILTERS = {
  period:    'monthly',
  keyword:   'all',
  region:    'all',
  sentiment: 'all',
  q:         '',
}

export default function App() {
  // ── Data state ──────────────────────────────────────────────
  const [meta,      setMeta]      = useState(null)
  const [trends,    setTrends]    = useState(null)
  const [keywords,  setKeywords]  = useState(null)
  const [regions,   setRegions]   = useState(null)
  const [insights,  setInsights]  = useState(null)
  const [wordcloud, setWordcloud] = useState(null)
  const [anomalies, setAnomalies] = useState(null)

  // ── UI state ─────────────────────────────────────────────────
  const [filters,      setFilters]      = useState(DEFAULT_FILTERS)
  const [loading,      setLoading]      = useState(true)
  const [apiOnline,    setApiOnline]    = useState(false)
  const [liveLoading,  setLiveLoading]  = useState(false)
  const [reportOpen,   setReportOpen]   = useState(false)
  const [reportData,   setReportData]   = useState({})

  const showToast = useToast()
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  // ── Core fetch ───────────────────────────────────────────────
  const loadData = useCallback(async (activeFilters) => {
    setLoading(true)
    try {
      const result = await fetchDashboard(activeFilters)
      if (!isMounted.current) return

      setApiOnline(result.online)
      setMeta(result.meta)
      setTrends(result.trends)
      setKeywords(result.keywords)
      setRegions(result.regions)
      setInsights(result.insights)
      setWordcloud(result.wordcloud)
      setAnomalies(result.anomalies)

      // Store for report modal
      setReportData({
        meta:     result.meta,
        insights: result.insights,
        filters:  { ...activeFilters },
      })
    } finally {
      if (isMounted.current) setLoading(false)
    }
  }, [])

  // Initial load — check health then fetch
  useEffect(() => {
    checkHealth().then(ok => setApiOnline(ok))
    loadData(DEFAULT_FILTERS)
  }, [loadData])

  // ── Filter change ────────────────────────────────────────────
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters)
    loadData(newFilters)
  }, [loadData])

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    loadData(DEFAULT_FILTERS)
  }, [loadData])

  // ── Search ───────────────────────────────────────────────────
  const handleSearch = useCallback((q) => {
    const newFilters = { ...filters, q: q.trim() }
    setFilters(newFilters)
    loadData(newFilters)
  }, [filters, loadData])

  const handleClearSearch = useCallback(() => {
    const newFilters = { ...filters, q: '' }
    setFilters(newFilters)
    loadData(newFilters)
  }, [filters, loadData])

  // ── Live refresh ─────────────────────────────────────────────
  const handleLiveRefresh = useCallback(async () => {
    setLiveLoading(true)
    await loadData(filters)
    setLiveLoading(false)
    showToast('Dashboard refreshed ✓')
  }, [filters, loadData, showToast])

  // ── Report ───────────────────────────────────────────────────
  const handleOpenReport = useCallback(() => setReportOpen(true),  [])
  const handleCloseReport = useCallback(() => setReportOpen(false), [])

  return (
    <>
      <Navbar
        apiOnline={apiOnline}
        onSearch={handleSearch}
        onExportReport={handleOpenReport}
        onLiveRefresh={handleLiveRefresh}
        liveLoading={liveLoading}
      />

      <HeroSection meta={meta} trends={trends} />

      <DashboardSection
        meta={meta}
        trends={trends}
        keywords={keywords}
        regions={regions}
        wordcloud={wordcloud}
        anomalies={anomalies}
        loading={loading}
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        searchQuery={filters.q}
        onClearSearch={handleClearSearch}
      />

      <InsightsSection
        insightsData={insights}
        onExportReport={handleOpenReport}
      />

      <AboutSection />
      <Footer />

      <ReportModal
        isOpen={reportOpen}
        onClose={handleCloseReport}
        reportData={reportData}
      />
    </>
  )
}