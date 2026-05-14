// src/components/Navbar.jsx
import { useState, useEffect, useRef } from 'react'

const CHIPS = ['tech','music','politics','health','love','bad']

export default function Navbar({ apiOnline, onSearch, onExportReport, onLiveRefresh, liveLoading }) {
  const [scrolled,      setScrolled]      = useState(false)
  const [activeSection, setActiveSection] = useState('hero')
  const [searchOpen,    setSearchOpen]    = useState(false)
  const [mobileOpen,    setMobileOpen]    = useState(false)
  const [searchVal,     setSearchVal]     = useState('')
  const searchRef = useRef(null)

  // Scroll: navbar shadow + active section
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40)
      const ids = ['hero','dashboard','insights','about']
      let current = 'hero'
      ids.forEach(id => {
        const el = document.getElementById(id)
        if (el && window.scrollY >= el.offsetTop - 100) current = id
      })
      setActiveSection(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Focus search input when bar opens
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 300)
  }, [searchOpen])

  const handleSearchSubmit = () => {
    onSearch(searchVal)
  }
  const handleClearSearch = () => {
    setSearchVal('')
    onSearch('')
  }
  const handleChip = q => {
    setSearchVal(q)
    onSearch(q)
    setSearchOpen(true)
  }

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`} id="navbar">
      <div className="nav-inner">
        <a href="#hero" className="nav-logo">
          <span className="logo-icon">◈</span>
          <span>Sentiment<strong>Scope</strong></span>
        </a>

        <ul className="nav-links">
          {['hero','dashboard','insights','about'].map(id => (
            <li key={id}>
              <a
                href={`#${id}`}
                className={`nav-link${activeSection === id ? ' active' : ''}`}
              >
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </a>
            </li>
          ))}
        </ul>

        <div className="nav-right">
          <button className="icon-btn" onClick={() => setSearchOpen(o => !o)} title="Search">⌕</button>

          <div className="api-status-pill" id="apiStatusPill">
            <span className={`api-dot${apiOnline ? ' online' : ' offline'}`} />
            <span>{apiOnline ? 'API live' : 'offline · mock data'}</span>
          </div>

          <button className="btn-export" onClick={onExportReport}>
            <i className="fas fa-file-lines" /> Export Report
          </button>

          <button
            className={`btn-live${liveLoading ? ' loading' : ''}`}
            onClick={onLiveRefresh}
          >
            {liveLoading
              ? '⏳ Refreshing…'
              : <><span className="live-dot" />Live Analysis</>
            }
          </button>
        </div>

        <button className="hamburger" onClick={() => setMobileOpen(o => !o)}>
          <span /><span /><span />
        </button>
      </div>

      {/* Search bar */}
      <div className={`nav-search-bar${searchOpen ? ' open' : ''}`}>
        <div className="nav-search-inner">
          <span className="search-icon-inline">⌕</span>
          <input
            ref={searchRef}
            type="text"
            className="global-search-input"
            placeholder="Search keyword, topic or phrase… e.g. 'love', 'tech', 'music'"
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearchSubmit()}
          />
          <button className="search-clear-btn" onClick={handleClearSearch}>✕</button>
          <button className="search-submit-btn" onClick={handleSearchSubmit}>Analyze</button>
        </div>
        <div className="search-chips">
          <span className="chip-label">Quick:</span>
          {CHIPS.map(q => (
            <button key={q} className="search-chip" onClick={() => handleChip(q)}>{q}</button>
          ))}
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`mobile-menu${mobileOpen ? ' open' : ''}`} id="mobileMenu">
        {['hero','dashboard','insights','about'].map(id => (
          <a key={id} href={`#${id}`} onClick={() => setMobileOpen(false)}>
            {id.charAt(0).toUpperCase() + id.slice(1)}
          </a>
        ))}
      </div>
    </nav>
  )
}