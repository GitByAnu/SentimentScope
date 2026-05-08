/**
 * SentimentScope — script.js (v3)
 * - Gauge chart (compound score −1 to +1)
 * - Skeleton loaders on every chart card
 * - Posts table with score bars + CSV export
 * - Dynamic insights AND dynamic recommendations (both from API)
 * - Confidence band score
 * - Minimal, sharp, to-the-point
 */
"use strict";

const API_BASE = "http://127.0.0.1:5000/api";
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const fmt = n => n >= 1000 ? (n / 1000).toFixed(1) + "K" : String(n);
const fmtTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

let state = { period: "monthly", keyword: "all", region: "all", sentiment: "all", q: "" };
let charts = {};
let reportData = {}; // stores latest data for report generation

// ── Colors ──────────────────────────────────────────────────
const C = {
  cyan: "#00e5ff", red: "#ff4d6d", neutral: "#6b7a99",
  purple: "#7c4dff", green: "#00e676", yellow: "#ffd740",
  grid: "rgba(255,255,255,0.06)", text: "#94a3b8",
  font: "'DM Sans', sans-serif",
};

// ── API ─────────────────────────────────────────────────────
function setApiStatus(online) {
  const dot = $("#apiDot"), txt = $("#apiStatusText");
  if (!dot) return;
  dot.className = "api-dot " + (online ? "online" : "offline");
  txt.textContent = online ? "API live" : "offline · mock data";
}

async function apiFetch(path) {
  const res = await fetch(API_BASE + path, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function safe(path, fallback) {
  try {
    const d = await apiFetch(path);
    setApiStatus(true);
    return d;
  } catch {
    setApiStatus(false);
    return fallback();
  }
}

// ── Mock fallbacks ───────────────────────────────────────────
const mock = {
  overview: () => ({ total:10000,positive:2368,negative:2289,neutral:5343,pos_pct:23.7,neg_pct:22.9,neu_pct:53.4,trending_topic:"#Finance",avg_score:0.04 }),
  trends: () => {
    const labels=[],pos=[],neg=[],neu=[];
    for(let i=29;i>=0;i--){
      const d=new Date();d.setDate(d.getDate()-i);
      labels.push(d.toISOString().slice(0,10));
      pos.push(Math.round(50+Math.random()*80));
      neg.push(Math.round(30+Math.random()*60));
      neu.push(Math.round(120+Math.random()*100));
    }
    return {labels,positive:pos,negative:neg,neutral:neu};
  },
  keywords: () => ["general","finance","gaming","music","politics","entertainment","travel","food","education","health"].map(k=>({keyword:k,count:Math.round(400+Math.random()*800),Positive:Math.round(80+Math.random()*200),Negative:Math.round(60+Math.random()*180),Neutral:Math.round(200+Math.random()*400)})),
  regions: () => [
    {region:"North America",total:3500,Positive:840,Negative:780,Neutral:1880},
    {region:"Europe",total:2500,Positive:600,Negative:550,Neutral:1350},
    {region:"Asia Pacific",total:1800,Positive:420,Negative:410,Neutral:970},
    {region:"Latin America",total:1000,Positive:240,Negative:220,Neutral:540},
    {region:"Middle East",total:700,Positive:168,Negative:154,Neutral:378},
    {region:"South Asia",total:500,Positive:100,Negative:115,Neutral:285},
  ],
  insights: () => ({
    insights:[
      {type:"neutral",icon:"📊",text:"Neutral posts dominate at 53.4% — low emotional engagement overall."},
      {type:"positive",icon:"✅",text:"Positive signal driven by: good, love, great, amazing."},
      {type:"alert",icon:"⚠️",text:"Negative sentiment tied to: bad, fail, issue, loss."},
      {type:"trend",icon:"🔥",text:"Top term: 'good' (342 mentions) — use it in copy."},
    ],
    recommendations:[
      {icon:"🎯",text:"Alert on negative spikes above 25% — set daily monitoring."},
      {icon:"💬",text:"Engage negative threads within 2 hours to limit sentiment spread."},
      {icon:"📈",text:"Amplify top positive keywords in campaign messaging."},
    ],
    confidence:71,
    sample_posts:[
      {cleaned_text:"feeling really good today everything is going well", sentiment_label:"Positive", sentiment_score:0.45, keyword:"general"},
      {cleaned_text:"this is terrible cannot deal with it anymore so frustrated", sentiment_label:"Negative", sentiment_score:-0.62, keyword:"general"},
      {cleaned_text:"just finished the meeting nothing special to report today", sentiment_label:"Neutral", sentiment_score:0.01, keyword:"general"},
    ],
  }),
  wordcloud: () => {
    const w=["love","good","great","bad","happy","sad","excited","disappointed","amazing","terrible","awesome","frustrated","beautiful","angry","wonderful","worried","enjoy","hate","hope","fear","glad","upset","nice","awful","bright"];
    return w.map(word=>({word,count:Math.round(20+Math.random()*280)}));
  },
  anomalies: () => [
    {date:"2024-03-15",negative_count:48,spike_factor:2.3,total:120},
    {date:"2024-07-22",negative_count:42,spike_factor:2.0,total:108},
  ],
  analyze: () => ({
    meta:mock.overview(), trends:mock.trends(), wordcloud:mock.wordcloud(),
    insights:mock.insights(), regions:mock.regions(), anomalies:mock.anomalies(),
    sample_records:[],
  }),
};

// ── Chart defaults ───────────────────────────────────────────
function chartDefaults() {
  Chart.defaults.color = C.text;
  Chart.defaults.font.family = C.font;
  Chart.defaults.font.size = 12;
}
function kill(key) { if (charts[key]) { charts[key].destroy(); delete charts[key]; } }

// ── Skeleton helpers ─────────────────────────────────────────
function showSkeleton(skId, contentId) {
  const sk = document.getElementById(skId);
  const ct = document.getElementById(contentId);
  if (sk) sk.style.display = "block";
  if (ct) { ct.classList.add("hidden-block"); ct.style.display = ""; }
}
function showContent(skId, ...contentIds) {
  const sk = document.getElementById(skId);
  if (sk) sk.style.display = "none";
  contentIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove("hidden-block");
    el.style.display = "block";
  });
}
function showCanvasSkeleton(skId, canvasId) {
  const sk = document.getElementById(skId);
  const cv = document.getElementById(canvasId);
  if (sk) sk.style.display = "block";
  if (cv) cv.style.display = "none";
}
function showCanvasContent(skId, canvasId) {
  const sk = document.getElementById(skId);
  const cv = document.getElementById(canvasId);
  if (sk) sk.style.display = "none";
  if (cv) cv.style.display = "block";
}

// ── GAUGE ────────────────────────────────────────────────────
function buildGauge(avgScore) {
  kill("gauge");
  const ctx = $("#gaugeChart");
  if (!ctx) return;

  // avgScore: −1 to +1  →  map to 0..1 for the gauge
  const clamped = Math.max(-1, Math.min(1, avgScore));
  const pct = (clamped + 1) / 2;  // 0=fully negative, 0.5=neutral, 1=fully positive

  // Build 180° half-doughnut
  const negArc  = Math.max(0.01, (1 - pct));
  const posArc  = Math.max(0.01, pct);

  kill("gauge");
  charts.gauge = new Chart(ctx, {
    type: "doughnut",
    data: {
      datasets: [{
        data: [negArc, posArc],
        backgroundColor: [C.red, C.cyan],
        borderColor: "transparent",
        borderRadius: 4,
        circumference: 180,
        rotation: -90,
      }]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      cutout: "72%",
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      animation: { animateRotate: true, duration: 900 }
    }
  });

  const scoreEl = $("#gaugeScore");
  const labelEl = $("#gaugeLabel");
  if (scoreEl) scoreEl.textContent = clamped.toFixed(3);
  if (labelEl) {
    if (clamped >= 0.05)       { labelEl.textContent = "Positive"; labelEl.style.color = C.cyan; scoreEl.style.color = C.cyan; }
    else if (clamped <= -0.05) { labelEl.textContent = "Negative"; labelEl.style.color = C.red;  scoreEl.style.color = C.red; }
    else                       { labelEl.textContent = "Neutral";  labelEl.style.color = C.neutral; scoreEl.style.color = C.neutral; }
  }
}

// ── HERO MINI CHART ──────────────────────────────────────────
function buildHeroMini(trends) {
  kill("heroMini");
  const ctx = $("#heroMiniChart");
  if (!ctx) return;
  const n = 30;
  const labels = trends.labels.slice(-n);
  const pos    = trends.positive.slice(-n);
  const neg    = trends.negative.slice(-n);

  charts.heroMini = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        { data: pos, borderColor: C.cyan, backgroundColor: "rgba(0,229,255,0.08)", fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2 },
        { data: neg, borderColor: C.red,  backgroundColor: "rgba(255,77,109,0.05)", fill: true, tension: 0.4, pointRadius: 0, borderWidth: 1.5 },
      ]
    },
    options: {
      responsive: false, maintainAspectRatio: false,
      scales: { x: { display: false }, y: { display: false } },
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      animation: { duration: 600 }
    }
  });

  // Trend pct: compare last 7 vs previous 7 positive
  const last7 = pos.slice(-7).reduce((a,b)=>a+b,0);
  const prev7 = pos.slice(-14,-7).reduce((a,b)=>a+b,0) || 1;
  const trendPct = (((last7 - prev7) / prev7) * 100).toFixed(1);
  const el = $("#heroTrendPct");
  if (el) {
    el.textContent = (trendPct >= 0 ? "↑ +" : "↓ ") + trendPct + "%";
    el.style.color = trendPct >= 0 ? C.cyan : C.red;
  }
}

// ── KPI SPARKLINE ────────────────────────────────────────────
function buildSparkline(trends) {
  kill("spark1");
  const ctx = $("#kpiSparkline1");
  if (!ctx) return;
  const totals = trends.positive.map((p,i) => p + (trends.negative[i]||0) + (trends.neutral[i]||0));
  charts.spark1 = new Chart(ctx, {
    type: "bar",
    data: { labels: trends.labels.slice(-20), datasets: [{ data: totals.slice(-20), backgroundColor: "rgba(0,229,255,0.28)", borderRadius: 2 }] },
    options: { responsive: false, maintainAspectRatio: false, scales: { x:{display:false}, y:{display:false} }, plugins: { legend:{display:false}, tooltip:{enabled:false} }, animation:{duration:400} }
  });
}

function buildKpiRings(pos_pct, neg_pct) {
  [["kpiRing1", pos_pct, C.cyan], ["kpiRing2", neg_pct, C.red]].forEach(([id, pct, color]) => {
    kill(id); const ctx = document.getElementById(id); if (!ctx) return;
    charts[id] = new Chart(ctx, {
      type: "doughnut",
      data: { datasets: [{ data: [pct, 100-pct], backgroundColor: [color, "rgba(255,255,255,0.05)"], borderColor: "transparent" }] },
      options: { cutout:"75%", responsive:false, maintainAspectRatio:false, plugins:{legend:{display:false},tooltip:{enabled:false}}, animation:{duration:600} }
    });
  });
}

// ── PIE ─────────────────────────────────────────────────────
function buildPie(meta) {
  kill("pie");

  // Make container visible BEFORE creating the chart
  // so Chart.js can measure the canvas correctly
  const skeleton   = document.getElementById("pieSkeleton");
  const content    = document.getElementById("pieContent");
  if (skeleton) skeleton.style.display = "none";
  if (content)  { content.classList.remove("hidden-block"); content.style.display = "block"; }

  const ctx = $("#pieChart"); if (!ctx) return;

  charts.pie = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Positive", "Negative", "Neutral"],
      datasets: [{
        data: [meta.pos_pct, meta.neg_pct, meta.neu_pct],
        backgroundColor: [C.cyan, C.red, C.neutral],
        borderColor: "transparent",
        hoverOffset: 8,
      }]
    },
    options: {
      cutout: "72%",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => ` ${c.label}: ${c.parsed.toFixed(1)}%` } }
      },
      // No rotation — just a clean fade-in
      animation: { animateRotate: false, animateScale: false, duration: 400 }
    }
  });

  const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setText("legendPos",     meta.pos_pct + "%");
  setText("legendNeg",     meta.neg_pct + "%");
  setText("legendNeu",     meta.neu_pct + "%");
  setText("pieTotalNum",   fmt(meta.total));
  setText("pieTotalBadge", fmt(meta.total));

  const setW = (id, w) => { const el = document.getElementById(id); if (el) el.style.width = w + "%"; };
  setW("scoreBarPos", meta.pos_pct);
  setW("scoreBarNeu", meta.neu_pct);
  setW("scoreBarNeg", meta.neg_pct);
  setText("sblPos", meta.pos_pct + "%");
  setText("sblNeu", meta.neu_pct + "%");
  setText("sblNeg", meta.neg_pct + "%");
}

// ── LINE ─────────────────────────────────────────────────────
function buildLine(trends) {
  kill("line");
  const ctx = $("#lineChart"); if (!ctx) return;
  const MAX = 60;
  const start = Math.max(0, trends.labels.length - MAX);
  const labels   = trends.labels.slice(start);
  const positive = trends.positive.slice(start);
  const negative = trends.negative.slice(start);
  const neutral  = trends.neutral.slice(start);

  charts.line = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        { label:"Positive", data:positive, borderColor:C.cyan,    backgroundColor:"rgba(0,229,255,0.07)", fill:true, tension:0.4, pointRadius:0, borderWidth:2 },
        { label:"Negative", data:negative, borderColor:C.red,     backgroundColor:"rgba(255,77,109,0.07)", fill:true, tension:0.4, pointRadius:0, borderWidth:2 },
        { label:"Neutral",  data:neutral,  borderColor:C.neutral, backgroundColor:"rgba(107,122,153,0.06)", fill:true, tension:0.4, pointRadius:0, borderWidth:1.5 },
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      interaction:{mode:"index",intersect:false},
      scales:{
        x:{ grid:{color:C.grid}, ticks:{maxTicksLimit:8,maxRotation:0,autoSkip:true} },
        y:{ grid:{color:C.grid}, beginAtZero:true }
      },
      plugins:{legend:{position:"bottom"}},
      animation:{duration:600}
    }
  });
}

// ── BAR ──────────────────────────────────────────────────────
function buildBar(keywords) {
  kill("bar");
  const ctx = $("#barChart"); if (!ctx) return;
  const top = keywords.slice(0, 12);
  charts.bar = new Chart(ctx, {
    type: "bar",
    data: {
      labels: top.map(k=>k.keyword),
      datasets: [
        { label:"Positive", data:top.map(k=>k.Positive), backgroundColor:C.cyan,    borderRadius:4 },
        { label:"Negative", data:top.map(k=>k.Negative), backgroundColor:C.red,     borderRadius:4 },
        { label:"Neutral",  data:top.map(k=>k.Neutral),  backgroundColor:C.neutral, borderRadius:4 },
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      scales:{ x:{stacked:true,grid:{color:C.grid}}, y:{stacked:true,grid:{color:C.grid},beginAtZero:true} },
      plugins:{legend:{position:"bottom"}},
      animation:{duration:600}
    }
  });
}

// ── WORD CLOUD ────────────────────────────────────────────────
function buildWordCloud(words) {
  const container = $("#wordCloud");
  if (!container) return;

  container.innerHTML = "";

  if (!words.length) {
    container.textContent = "No words found.";
    return;
  }

  const maxCount = Math.max(...words.map(w => w.count));

  const colors = [
    C.cyan,
    C.purple,
    "#00e676",
    C.yellow,
    "#ff9f40",
    "#ff6b6b",
    "#a78bfa",
    "#34d399"
  ];

  words
    .sort((a, b) => b.count - a.count)

    // LESS WORDS = MORE BREATHING SPACE
    .slice(0, 22)

    .forEach((item, i) => {

      // slightly larger hierarchy
      const size = 14 + (item.count / maxCount) * 18;

      const span = document.createElement("span");

      span.className = "wc-word";
      span.textContent = item.word;

      span.title = `${item.word}: ${item.count} mentions`;

      span.style.cssText = `
      font-size:${size.toFixed(1)}px;
      color:${colors[i % colors.length]};
      opacity:${(0.65 + (item.count / maxCount) * 0.35).toFixed(2)};
      animation-delay:${i * 30}ms;

      display:inline-block;
  transform:rotate(0deg);
`;

      container.appendChild(span);
    });
}

// ── REGIONS ───────────────────────────────────────────────────
function buildRegions(regions) {
  const grid = $("#regionGrid"); if (!grid) return;
  grid.innerHTML = "";
  regions.forEach(r => {
    const total = r.total || (r.Positive+r.Negative+r.Neutral);
    const pp = total ? +(r.Positive/total*100).toFixed(1) : 0;
    const np = total ? +(r.Negative/total*100).toFixed(1) : 0;
    const nu = total ? +(r.Neutral /total*100).toFixed(1) : 0;
    const card = document.createElement("div");
    card.className = "region-card";
    card.innerHTML = `
      <div class="region-card-header">
        <span class="region-name">${r.region}</span>
        <span class="region-total">${fmt(total)} posts</span>
      </div>
      <div class="region-bars">
        <div class="region-bar-row">
          <span class="region-bar-label" style="color:var(--cyan)">Positive</span>
          <div class="region-bar-track"><div class="region-bar-fill" style="width:${pp}%;background:var(--cyan)"></div></div>
          <span class="region-bar-pct" style="color:var(--cyan)">${pp}%</span>
        </div>
        <div class="region-bar-row">
          <span class="region-bar-label" style="color:var(--red)">Negative</span>
          <div class="region-bar-track"><div class="region-bar-fill" style="width:${np}%;background:var(--red)"></div></div>
          <span class="region-bar-pct" style="color:var(--red)">${np}%</span>
        </div>
        <div class="region-bar-row">
          <span class="region-bar-label">Neutral</span>
          <div class="region-bar-track"><div class="region-bar-fill" style="width:${nu}%;background:#6b7a99"></div></div>
          <span class="region-bar-pct">${nu}%</span>
        </div>
      </div>`;
    grid.appendChild(card);
  });
}

// ── ANOMALIES ─────────────────────────────────────────────────
function buildAnomalies(anomalies) {
  const sec = $("#anomalySection"), list = $("#anomalyList"), badge = $("#anomalyCount");
  if (!sec || !list) return;
  if (!anomalies.length) { sec.style.display="none"; return; }
  sec.style.display = "block";
  if (badge) badge.textContent = anomalies.length;
  list.innerHTML = "";
  anomalies.forEach(a => {
    const div = document.createElement("div");
    div.className = "anomaly-item";
    div.innerHTML = `<span class="anomaly-date">📅 ${a.date}</span><span class="anomaly-spike">${a.spike_factor}× spike</span><span class="anomaly-detail"><span class="anomaly-neg">${a.negative_count}</span> negative posts out of <strong>${a.total||"—"}</strong></span>`;
    list.appendChild(div);
  });
}

// ── INSIGHTS + EVIDENCE CARDS ────────────────────────────────
function buildInsights(data) {
  const { insights = [], recommendations = [], confidence = 70, sample_posts = [] } = data;

  // Analysis insights
  const iList = $("#dynamicInsightsList");
  if (iList) {
    iList.innerHTML = "";
    insights.slice(0, 5).forEach((ins, i) => {
      const li = document.createElement("li");
      li.className = `insight-item type-${ins.type||"info"}`;
      li.style.animationDelay = `${i*70}ms`;
      li.innerHTML = `<span class="insight-icon-sm">${ins.icon}</span><span>${ins.text}</span>`;
      iList.appendChild(li);
    });
  }

  // Evidence cards — full-width row below insights grid
  const evSection = $("#evidenceSection");
  const evCards   = $("#evidenceCards");
  if (evCards && sample_posts.length > 0) {
    evCards.innerHTML = "";
    const order = ["Negative", "Positive", "Neutral"];
    const picked = [];
    for (const label of order) {
      const found = sample_posts.find(p => p.sentiment_label === label);
      if (found) picked.push(found);
      if (picked.length >= 3) break;
    }
    picked.forEach(p => {
      const lbl        = p.sentiment_label;
      const score      = p.sentiment_score || 0;
      const cls        = lbl.toLowerCase();
      const scoreStr   = (score >= 0 ? "+" : "") + score.toFixed(3);
      const scoreClass = lbl === "Positive" ? "pos" : lbl === "Negative" ? "neg" : "neu";
      const div = document.createElement("div");
      div.className = `evidence-card ev-${cls}`;
      div.innerHTML = `
        <div class="evidence-card-top">
          <span class="evidence-pill ev-${cls}">${lbl}</span>
          <span class="evidence-score ${scoreClass}">${scoreStr}</span>
          <span class="evidence-topic">${p.keyword || "general"}</span>
        </div>
        <div class="evidence-text">"${(p.cleaned_text || "").slice(0, 110)}${(p.cleaned_text || "").length > 110 ? "…" : ""}"</div>`;
      evCards.appendChild(div);
    });
    if (evSection) evSection.style.display = "block";
  } else {
    if (evSection) evSection.style.display = "none";
  }

  // Recommendations
  const rList = $("#dynamicRecsList");
  if (rList) {
    rList.innerHTML = "";
    recommendations.slice(0, 4).forEach((rec, i) => {
      const li = document.createElement("li");
      li.className = "rec-item";
      li.style.animationDelay = `${i*70}ms`;
      li.innerHTML = `<span class="rec-icon">${rec.icon}</span><span>${rec.text}</span>`;
      rList.appendChild(li);
    });
  }

  // Confidence band
  const fill = $("#confBandFill"), pct = $("#confBandPct");
  if (fill) fill.style.width = confidence + "%";
  if (pct)  pct.textContent = confidence + "%";
}

// ── EXPORT REPORT MODAL ──────────────────────────────────────
function buildReportModal() {
  // Remove existing modal if any
  document.getElementById("reportOverlay")?.remove();

  const { meta = {}, insights = {}, filters = state } = reportData;
  const now = new Date().toLocaleString();
  const activeFilters = [
    filters.keyword !== "all" ? `Topic: ${filters.keyword}` : null,
    filters.region  !== "all" ? `Region: ${filters.region}`  : null,
    filters.q       ? `Search: "${filters.q}"` : null,
  ].filter(Boolean).join(" · ") || "All data";

  const overlay = document.createElement("div");
  overlay.id = "reportOverlay";
  overlay.className = "report-overlay";
  overlay.innerHTML = `
    <div class="report-modal">
      <div class="report-modal-header">
        <div>
          <div class="report-modal-title">◈ SentimentScope Report</div>
          <div class="report-modal-meta">Generated: ${now} · Filters: ${activeFilters}</div>
        </div>
        <button class="report-close-btn" id="reportCloseBtn">✕</button>
      </div>

      <div class="report-section">
        <div class="report-section-title">Key Metrics</div>
        <div class="report-kpi-row">
          <div class="report-kpi">
            <div class="report-kpi-val cyan">${fmt(meta.total||0)}</div>
            <div class="report-kpi-label">Posts Analyzed</div>
          </div>
          <div class="report-kpi">
            <div class="report-kpi-val cyan">${meta.pos_pct||0}%</div>
            <div class="report-kpi-label">Positive</div>
          </div>
          <div class="report-kpi">
            <div class="report-kpi-val red">${meta.neg_pct||0}%</div>
            <div class="report-kpi-label">Negative</div>
          </div>
        </div>
        <div class="report-kpi-row" style="margin-top:10px">
          <div class="report-kpi">
            <div class="report-kpi-val muted">${meta.neu_pct||0}%</div>
            <div class="report-kpi-label">Neutral</div>
          </div>
          <div class="report-kpi">
            <div class="report-kpi-val cyan">${meta.avg_score !== undefined ? (meta.avg_score >= 0 ? "+" : "") + meta.avg_score.toFixed(3) : "—"}</div>
            <div class="report-kpi-label">Compound Score</div>
          </div>
          <div class="report-kpi">
            <div class="report-kpi-val yellow">${meta.trending_topic||"—"}</div>
            <div class="report-kpi-label">Trending Topic</div>
          </div>
        </div>
      </div>

      <div class="report-divider"></div>

      <div class="report-section">
        <div class="report-section-title">Analysis Insights</div>
        ${(insights.insights||[]).map(i => `
          <div class="report-insight-row">
            <span style="flex-shrink:0">${i.icon}</span>
            <span>${i.text}</span>
          </div>`).join("")}
      </div>

      <div class="report-divider"></div>

      <div class="report-section">
        <div class="report-section-title">Recommendations</div>
        ${(insights.recommendations||[]).map(r => `
          <div class="report-insight-row">
            <span style="flex-shrink:0">${r.icon}</span>
            <span>${r.text}</span>
          </div>`).join("")}
      </div>

      <div class="report-footer">
        SentimentScope · NLP Analytics Platform · Confidential
      </div>
      <button class="report-download-btn" id="reportDownloadBtn">
        Download as Text Report
      </button>
    </div>`;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("open"));

  overlay.addEventListener("click", e => { if (e.target === overlay) closeReport(); });
  document.getElementById("reportCloseBtn")?.addEventListener("click", closeReport);
  document.getElementById("reportDownloadBtn")?.addEventListener("click", downloadReport);
}

function closeReport() {
  const overlay = document.getElementById("reportOverlay");
  if (overlay) {
    overlay.classList.remove("open");
    setTimeout(() => overlay.remove(), 300);
  }
}

function downloadReport() {
  const { meta = {}, insights = {}, filters = state } = reportData;
  const now = new Date().toLocaleString();
  const activeFilters = [
    filters.keyword !== "all" ? `Topic: ${filters.keyword}` : null,
    filters.region  !== "all" ? `Region: ${filters.region}`  : null,
    filters.q       ? `Search: "${filters.q}"` : null,
  ].filter(Boolean).join(" | ") || "All data";

  const lines = [
    "═══════════════════════════════════════════",
    "  SENTIMENTSCOPE — ANALYTICS REPORT",
    "═══════════════════════════════════════════",
    `  Generated : ${now}`,
    `  Filters   : ${activeFilters}`,
    "───────────────────────────────────────────",
    "",
    "KEY METRICS",
    `  Posts Analyzed : ${fmt(meta.total||0)}`,
    `  Positive       : ${meta.pos_pct||0}%`,
    `  Negative       : ${meta.neg_pct||0}%`,
    `  Neutral        : ${meta.neu_pct||0}%`,
    `  Compound Score : ${meta.avg_score !== undefined ? (meta.avg_score>=0?"+":"")+meta.avg_score.toFixed(3) : "—"}`,
    `  Trending Topic : ${meta.trending_topic||"—"}`,
    "",
    "ANALYSIS INSIGHTS",
    ...(insights.insights||[]).map(i => `  ${i.icon} ${i.text}`),
    "",
    "RECOMMENDATIONS",
    ...(insights.recommendations||[]).map(r => `  ${r.icon} ${r.text}`),
    "",
    "───────────────────────────────────────────",
    "  SentimentScope · NLP Analytics Platform",
    "  Confidential — Not for public distribution",
    "═══════════════════════════════════════════",
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `SentimentScope_Report_${new Date().toISOString().slice(0,10)}.txt`;
  a.click();
  showToast("Report downloaded ✓");
}

// ── KPI UPDATER ───────────────────────────────────────────────
function updateKpis(meta) {
  const s = (id, v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
  s("kpiTotalVal", fmt(meta.total));
  s("kpiPosVal",   meta.pos_pct + "%");
  s("kpiNegVal",   meta.neg_pct + "%");
  s("kpiTrendVal", meta.trending_topic || "#General");
  s("kpiLastUpdated", "Updated " + fmtTime());

  s("heroPos",      meta.pos_pct + "%");
  s("heroNeg",      meta.neg_pct + "%");
  s("heroNeu",      meta.neu_pct + "%");
  s("heroTrending", meta.trending_topic || "#General");

  s("dashPostCount", fmt(meta.total));
  s("dashBadge",     "Live · " + fmt(meta.total));
  s("lastUpdatedTag", "Updated: " + fmtTime());

  buildGauge(meta.avg_score !== undefined ? meta.avg_score : (meta.pos_pct - meta.neg_pct) / 100);
  buildKpiRings(meta.pos_pct, meta.neg_pct);
  s("pieTotalNum", fmt(meta.total));
}

// ── LOADER ────────────────────────────────────────────────────
function showLoader(msg="Fetching from NLP backend…") {
  const ol = $("#loadingOverlay"), lt = $("#loaderText");
  if (ol) ol.classList.remove("hidden");
  if (lt) lt.textContent = msg;
  ["pieSkeleton","lineSkeleton","barSkeleton","cloudSkeleton"].forEach(id => {
    const el = document.getElementById(id); if (el) el.style.display = "block";
  });
  ["pieContent","lineChart","barChart","wordCloud"].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.style.display = "none"; el.classList.add("hidden-block"); }
  });
}
function hideLoader() {
  const ol = $("#loadingOverlay"); if (ol) ol.classList.add("hidden");
}

// ── MAIN FETCH & RENDER ───────────────────────────────────────
async function fetchAll(s = state) {
  showLoader();
  const qs = `period=${s.period}&keyword=${s.keyword}&region=${s.region}&sentiment=${s.sentiment}`;

  try {
    let meta, trends, keywords, regions, insightsData, wordcloud, anomalies;

    if (s.q) {
      const data = await safe(`/analyze?q=${encodeURIComponent(s.q)}&region=${s.region}`, mock.analyze);
      meta = data.meta; trends = data.trends;
      keywords    = await safe(`/keywords?${qs}`, mock.keywords);
      regions     = data.regions.length ? data.regions : mock.regions();
      insightsData = data.insights; wordcloud = data.wordcloud;
      anomalies   = data.anomalies || [];
    } else {
      [meta, trends, keywords, regions, insightsData, wordcloud, anomalies] = await Promise.all([
        safe(`/overview?${qs}`,  mock.overview),
        safe(`/trends?${qs}`,    mock.trends),
        safe(`/keywords?${qs}`,  mock.keywords),
        safe(`/regions?${qs}`,   mock.regions),
        safe(`/insights?${qs}`,  mock.insights),
        safe(`/wordcloud?${qs}`, mock.wordcloud),
        safe(`/anomalies?${qs}`, mock.anomalies),
      ]);
    }

    // Store for report generation
    reportData = { meta, insights: insightsData, filters: { ...s } };

    // Render
    updateKpis(meta);
    buildPie(meta);            // handles its own skeleton swap internally
    buildLine(trends);         showCanvasContent("lineSkeleton","lineChart");
    buildBar(keywords);        showCanvasContent("barSkeleton","barChart");
    buildWordCloud(wordcloud); showContent("cloudSkeleton","wordCloud");
    buildRegions(regions);
    buildAnomalies(anomalies);
    buildInsights(insightsData);
    buildHeroMini(trends);
    buildSparkline(trends);
    populateKeywords(keywords);

  } finally {
    hideLoader();
  }
}

function populateKeywords(keywords) {
  const sel = $("#filterKeyword"); if (!sel) return;
  const existing = new Set($$("option", sel).map(o => o.value));
  keywords.forEach(k => {
    if (!existing.has(k.keyword)) {
      const opt = document.createElement("option");
      opt.value = k.keyword;
      opt.textContent = k.keyword.charAt(0).toUpperCase() + k.keyword.slice(1);
      sel.appendChild(opt);
    }
  });
}

// ── SEARCH ───────────────────────────────────────────────────
function applySearch(q) {
  state.q = q.trim();
  const banner = $("#searchResultBanner"), bq = $("#bannerQuery");
  if (banner) banner.style.display = state.q ? "flex" : "none";
  if (bq) bq.textContent = state.q;
  fetchAll(state);
}
function clearSearch() {
  state.q = "";
  const inp = $("#globalSearchInput"); if (inp) inp.value = "";
  const banner = $("#searchResultBanner"); if (banner) banner.style.display = "none";
  fetchAll(state);
}

// ── TOAST ────────────────────────────────────────────────────
function showToast(msg) {
  let t = document.getElementById("ssToast");
  if (!t) {
    t = document.createElement("div"); t.id = "ssToast";
    t.style.cssText = "position:fixed;bottom:24px;right:24px;z-index:9999;background:#111827;border:1px solid rgba(0,229,255,0.3);color:#e2e8f0;font-size:0.83rem;font-family:'DM Sans',sans-serif;padding:11px 18px;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.6);opacity:0;transition:opacity 0.3s;pointer-events:none;";
    document.body.appendChild(t);
  }
  t.textContent = msg; t.style.opacity = "1";
  clearTimeout(t._t); t._t = setTimeout(()=>{ t.style.opacity="0"; }, 3000);
}

// ── EVENTS ───────────────────────────────────────────────────
function wireEvents() {
  // Navbar scroll
  window.addEventListener("scroll", () => {
    const nb = $("#navbar"); if (nb) nb.classList.toggle("scrolled", scrollY > 40);
  }, { passive: true });

  // Active nav link
  const sections = $$("section[id]"), navLinks = $$(".nav-link");
  new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navLinks.forEach(l => l.classList.remove("active"));
        const a = navLinks.find(l => l.getAttribute("href") === "#" + e.target.id);
        if (a) a.classList.add("active");
      }
    });
  }, { threshold: 0.35 }).observe;
  sections.forEach(s => new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      navLinks.forEach(l => l.classList.remove("active"));
      const a = navLinks.find(l => l.getAttribute("href") === "#" + entries[0].target.id);
      if (a) a.classList.add("active");
    }
  }, { threshold: 0.35 }).observe(s));

  // Hamburger
  const ham = $("#hamburger"), mob = $("#mobileMenu");
  if (ham && mob) {
    ham.addEventListener("click", () => mob.classList.toggle("open"));
    $$("a", mob).forEach(a => a.addEventListener("click", () => mob.classList.remove("open")));
  }

  // Search toggle
  const stBtn = $("#searchToggleBtn"), sBar = $("#navSearchBar");
  if (stBtn && sBar) stBtn.addEventListener("click", () => {
    sBar.classList.toggle("open");
    if (sBar.classList.contains("open")) setTimeout(() => { const i=$("#globalSearchInput");if(i)i.focus(); }, 300);
  });

  const sInp = $("#globalSearchInput");
  $("#searchSubmitBtn")?.addEventListener("click", () => applySearch(sInp?.value||""));
  sInp?.addEventListener("keydown", e => { if (e.key==="Enter") applySearch(sInp.value); });
  $("#searchClearBtn")?.addEventListener("click", () => { if(sInp)sInp.value=""; clearSearch(); });
  $$(".search-chip").forEach(c => c.addEventListener("click", () => { if(sInp)sInp.value=c.dataset.q; applySearch(c.dataset.q); sBar?.classList.add("open"); }));
  $("#bannerClear")?.addEventListener("click", clearSearch);

  // Filters
  [["filterPeriod","period"],["filterKeyword","keyword"],["filterRegion","region"],["filterSentiment","sentiment"]].forEach(([id, key]) => {
    document.getElementById(id)?.addEventListener("change", e => { state[key]=e.target.value; fetchAll(state); });
  });

  // Reset
  $("#resetFilters")?.addEventListener("click", () => {
    state = { period:"monthly", keyword:"all", region:"all", sentiment:"all", q:"" };
    [["filterPeriod","monthly"],["filterKeyword","all"],["filterRegion","all"],["filterSentiment","all"]].forEach(([id,v]) => { const el=document.getElementById(id);if(el)el.value=v; });
    $$(".toggle-btn").forEach(b => b.classList.toggle("active", b.dataset.period==="monthly"));
    clearSearch();
  });

  // Time toggle
  $$(".toggle-btn").forEach(btn => btn.addEventListener("click", () => {
    $$(".toggle-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.period = btn.dataset.period;
    const sel = $("#filterPeriod"); if(sel)sel.value=btn.dataset.period;
    safe(`/trends?period=${btn.dataset.period}&keyword=${state.keyword}&region=${state.region}`, mock.trends)
      .then(d => { buildLine(d); showCanvasContent("lineSkeleton","lineChart"); });
  }));

  // Live button
  const liveBtn = $("#liveBtn");
  liveBtn?.addEventListener("click", async () => {
    liveBtn.classList.add("loading"); liveBtn.innerHTML = "⏳ Refreshing…";
    await fetchAll(state);
    liveBtn.classList.remove("loading"); liveBtn.innerHTML = '<span class="live-dot"></span>Live Analysis';
    showToast("Dashboard refreshed ✓");
  });

  // Export Report — both navbar button and section button
  const openReport = () => { buildReportModal(); };
  $("#exportReportBtn")?.addEventListener("click", openReport);
  $("#exportReportBtnSection")?.addEventListener("click", openReport);

  // Close report on Escape
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeReport(); });
}

// ── INIT ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  chartDefaults();
  wireEvents();
  safe("/health", () => ({ status:"offline" }))
    .then(d => { setApiStatus(d.status === "ok"); fetchAll(state); })
    .catch(() => { setApiStatus(false); fetchAll(state); });
});