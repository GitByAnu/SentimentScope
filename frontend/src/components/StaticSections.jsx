// src/components/AboutSection.jsx
export function AboutSection() {
  return (
    <section className="section about-section" id="about">
      <div className="section-header">
        <h2 className="section-title">About SentimentScope</h2>
      </div>
      <div className="about-grid">
        <div className="glass-card about-card">
          <div className="about-icon">🌐</div>
          <h4>Project Overview</h4>
          <p>
            SentimentScope transforms large volumes of social data into clear, actionable insights.
            It analyzes thousands of conversations to uncover sentiment patterns, trends, and emerging
            topics across time and regions.
          </p>
        </div>
        <div className="glass-card about-card">
          <div className="about-icon">🗄️</div>
          <h4>Data Processing</h4>
          <p>
            Raw data is cleaned, structured, and enriched to ensure consistent and reliable analysis.
            The system identifies sentiment, extracts key terms, and tracks changes in discussion
            patterns over time.
          </p>
        </div>
        <div className="glass-card about-card">
          <div className="about-icon">⚙️</div>
          <h4>Platform Capabilities</h4>
          <ol className="how-steps">
            <li>Real-time sentiment tracking</li>
            <li>Keyword and trend analysis</li>
            <li>Region-based filtering</li>
            <li>Time-series insights and pattern detection</li>
          </ol>
        </div>
      </div>
    </section>
  )
}

// src/components/Footer.jsx
export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <a href="#hero" className="nav-logo">
          <span className="logo-icon">◈</span>
          <span>Sentiment<strong>Scope</strong></span>
        </a>
        <p className="footer-copy">© 2026 SentimentScope</p>
        <div className="footer-socials">
          <a
            href="https://www.linkedin.com/in/anupama-bain-36b263282/"
            target="_blank"
            rel="noreferrer"
            className="social-icon"
          >
            <i className="fab fa-linkedin-in" />
          </a>
          <a
            href="https://github.com/GitByAnu"
            target="_blank"
            rel="noreferrer"
            className="social-icon"
          >
            <i className="fab fa-github" />
          </a>
        </div>
      </div>
    </footer>
  )
}