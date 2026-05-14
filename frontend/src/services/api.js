// src/services/api.js
// All backend communication in one place.
// Vite proxies /api → http://127.0.0.1:5000/api

const BASE = '/api'

async function apiFetch(path) {
  const res = await fetch(BASE + path, { signal: AbortSignal.timeout(6000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// ─── Mock fallbacks (shown when Flask is offline) ────────────
export const mock = {
  overview: () => ({
    total: 10000, positive: 2297, negative: 2105, neutral: 5598,
    pos_pct: 23.0, neg_pct: 21.1, neu_pct: 56.0,
    trending_topic: '#Finance', avg_score: 0.026,
  }),
  trends: () => {
    const labels = [], pos = [], neg = [], neu = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      labels.push(d.toISOString().slice(0, 10))
      pos.push(Math.round(50 + Math.random() * 80))
      neg.push(Math.round(30 + Math.random() * 60))
      neu.push(Math.round(120 + Math.random() * 100))
    }
    return { labels, positive: pos, negative: neg, neutral: neu }
  },
  keywords: () =>
    ['general','finance','gaming','music','politics','entertainment','travel','food','education','health']
      .map(k => ({
        keyword: k,
        count: Math.round(400 + Math.random() * 800),
        Positive: Math.round(80 + Math.random() * 200),
        Negative: Math.round(60 + Math.random() * 180),
        Neutral: Math.round(200 + Math.random() * 400),
      })),
  regions: () => [
    { region: 'North America', total: 3500, Positive: 840, Negative: 780, Neutral: 1880 },
    { region: 'Europe',        total: 2500, Positive: 600, Negative: 550, Neutral: 1350 },
    { region: 'Asia Pacific',  total: 1800, Positive: 420, Negative: 410, Neutral: 970  },
    { region: 'Latin America', total: 1000, Positive: 240, Negative: 220, Neutral: 540  },
    { region: 'Middle East',   total: 700,  Positive: 168, Negative: 154, Neutral: 378  },
    { region: 'South Asia',    total: 500,  Positive: 100, Negative: 115, Neutral: 285  },
  ],
  insights: () => ({
    insights: [
      { type: 'neutral',  icon: '📊', text: 'Neutral posts dominate at 56.0% — low emotional engagement overall.' },
      { type: 'positive', icon: '✅', text: 'Positive signal driven by: great, love, better, happy.' },
      { type: 'alert',    icon: '⚠️', text: 'Negative signal tied to: bad, wrong, terrible, horrible.' },
      { type: 'trend',    icon: '🔥', text: "Top term: 'good' — use it in campaign copy." },
    ],
    recommendations: [
      { icon: '🎯', text: 'Alert on negative spikes above 25% — set daily monitoring.' },
      { icon: '💬', text: 'Engage negative threads within 2 hours to limit sentiment spread.' },
      { icon: '📈', text: 'Amplify top positive keywords in campaign messaging.' },
    ],
    confidence: 71,
    sample_posts: [
      { cleaned_text: 'feeling really good today everything is going well', sentiment_label: 'Positive', sentiment_score: 0.45, keyword: 'general' },
      { cleaned_text: 'this is terrible cannot deal with it anymore so frustrated', sentiment_label: 'Negative', sentiment_score: -0.62, keyword: 'general' },
      { cleaned_text: 'just finished the meeting nothing special to report today', sentiment_label: 'Neutral', sentiment_score: 0.01, keyword: 'general' },
    ],
  }),
  wordcloud: () => {
    const w = ['love','good','great','bad','happy','sad','excited','disappointed','amazing',
               'terrible','awesome','frustrated','beautiful','angry','wonderful','worried',
               'enjoy','hate','hope','fear','glad','upset','nice','awful','bright']
    return w.map(word => ({ word, count: Math.round(20 + Math.random() * 280) }))
  },
  anomalies: () => [
    { date: '2024-03-15', negative_count: 48, spike_factor: 2.3, total: 120 },
    { date: '2024-07-22', negative_count: 42, spike_factor: 2.0, total: 108 },
  ],
  analyze: () => ({
    meta: mock.overview(), trends: mock.trends(), wordcloud: mock.wordcloud(),
    insights: mock.insights(), regions: mock.regions(), anomalies: mock.anomalies(),
  }),
}

// ─── Safe fetch: falls back to mock on any error ─────────────
export async function safe(path, fallback) {
  try {
    const data = await apiFetch(path)
    return { data, online: true }
  } catch {
    return { data: fallback(), online: false }
  }
}

// ─── Fetch all dashboard data in parallel ────────────────────
export async function fetchDashboard(filters) {
  const qs = new URLSearchParams({
    period:    filters.period,
    keyword:   filters.keyword,
    region:    filters.region,
    sentiment: filters.sentiment,
  }).toString()

  if (filters.q) {
    const { data, online } = await safe(
      `/analyze?q=${encodeURIComponent(filters.q)}&region=${filters.region}`,
      mock.analyze
    )
    const kwResult = await safe(`/keywords?${qs}`, mock.keywords)
    return {
      online,
      meta:         data.meta,
      trends:       data.trends,
      keywords:     kwResult.data,
      regions:      data.regions?.length ? data.regions : mock.regions(),
      insights:     data.insights,
      wordcloud:    data.wordcloud,
      anomalies:    data.anomalies || [],
    }
  }

  const results = await Promise.all([
    safe(`/overview?${qs}`,  mock.overview),
    safe(`/trends?${qs}`,    mock.trends),
    safe(`/keywords?${qs}`,  mock.keywords),
    safe(`/regions?${qs}`,   mock.regions),
    safe(`/insights?${qs}`,  mock.insights),
    safe(`/wordcloud?${qs}`, mock.wordcloud),
    safe(`/anomalies?${qs}`, mock.anomalies),
  ])

  const online = results.some(r => r.online)
  const [meta, trends, keywords, regions, insights, wordcloud, anomalies] = results.map(r => r.data)

  return { online, meta, trends, keywords, regions, insights, wordcloud, anomalies }
}

export async function fetchTrends(period, keyword, region) {
  const { data } = await safe(
    `/trends?period=${period}&keyword=${keyword}&region=${region}`,
    mock.trends
  )
  return data
}

export async function checkHealth() {
  try {
    const data = await apiFetch('/health')
    return data.status === 'ok'
  } catch {
    return false
  }
}