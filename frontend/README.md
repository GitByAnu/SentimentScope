# SentimentScope — React Frontend

Migrated from vanilla HTML/CSS/JS to React + Vite.
Backend (Python Flask) is unchanged.

## Project Structure

```
sentimentscope-react/          ← React frontend (this folder)
│
├── index.html                 ← Vite entry point
├── vite.config.js             ← Vite config (proxies /api → Flask :5000)
├── package.json
│
└── src/
    ├── main.jsx               ← React root
    ├── App.jsx                ← Root component, all state & data fetching
    │
    ├── styles/
    │   └── global.css         ← All CSS (exact same as before)
    │
    ├── services/
    │   └── api.js             ← All API calls + mock fallbacks
    │
    ├── utils/
    │   └── chartConfig.js     ← Chart.js registration, colors, helpers
    │
    ├── hooks/
    │   └── useToast.js        ← Toast notification hook
    │
    └── components/
        ├── Navbar.jsx
        ├── HeroSection.jsx
        ├── KpiStrip.jsx
        ├── DashboardSection.jsx
        ├── RegionGrid.jsx
        ├── AnomalySection.jsx
        ├── InsightsSection.jsx
        ├── ReportModal.jsx
        ├── StaticSections.jsx   ← AboutSection + Footer
        │
        └── charts/
            ├── GaugeChart.jsx
            ├── HeroMiniChart.jsx
            ├── KpiSparkline.jsx
            ├── KpiRing.jsx
            ├── PieChart.jsx
            ├── LineChart.jsx
            ├── BarChart.jsx
            └── WordCloud.jsx

backend/                       ← Flask backend (unchanged)
├── app.py
├── process_data.py
├── requirements.txt
└── data/
    ├── raw_data.csv
    └── processed_data.json
```

---

## Setup Instructions (step by step)

### Step 1 — Folder layout on your machine

Create this layout:

```
sentimentscope/
├── sentimentscope-react/    ← paste the entire React folder here
└── backend/                 ← your existing Flask backend
```

### Step 2 — Install Node.js (if not installed)

Download from https://nodejs.org — install the LTS version.
Verify: `node -v` should print v18 or higher.

### Step 3 — Install React dependencies

```bash
cd sentimentscope/sentimentscope-react
npm install
```

This reads package.json and installs React, Vite, Chart.js.

### Step 4 — Start the Flask backend (Terminal 1)

```bash
cd sentimentscope/backend
pip install flask flask-cors
python app.py
```

Flask runs at: http://127.0.0.1:5000
Keep this terminal open.

### Step 5 — Start the React frontend (Terminal 2)

```bash
cd sentimentscope/sentimentscope-react
npm run dev
```

Vite runs at: http://localhost:5173
Open this URL in your browser.

### Step 6 — Verify it works

- You should see the SentimentScope dashboard
- The API status pill should show green "API live"
- All charts should populate with real data from Flask

---

## How the proxy works

In `vite.config.js`:

```js
proxy: {
  '/api': {
    target: 'http://127.0.0.1:5000',
    changeOrigin: true,
  }
}
```

Every request from React to `/api/overview` is automatically
forwarded to `http://127.0.0.1:5000/api/overview` by Vite.
No CORS issues. No hardcoded ports in the frontend code.

---

## Building for production (Vercel deployment)

```bash
npm run build
```

This creates a `dist/` folder — deploy that to Vercel.

For the backend, deploy `backend/` to Render or Railway.
Then update the proxy target in vite.config.js to your
production backend URL before building.

---

## Component responsibility map

| Component | What it does |
|---|---|
| App.jsx | All state, all data fetching, passes props down |
| Navbar.jsx | Scroll detection, search bar, mobile menu |
| HeroSection.jsx | Gauge + mini chart + KPI strip |
| DashboardSection.jsx | Filters + all 4 charts + regions + anomalies |
| InsightsSection.jsx | Insights list + recommendations + evidence cards |
| ReportModal.jsx | Overlay modal + text file download |
| api.js | All fetch calls + mock data fallbacks |
| chartConfig.js | Chart.js registration + shared color constants |