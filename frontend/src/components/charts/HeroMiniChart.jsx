// src/components/charts/HeroMiniChart.jsx
import { useEffect, useRef } from 'react'
import { Chart } from 'chart.js'
import { C, initChartDefaults } from '../../utils/chartConfig'

initChartDefaults()

export default function HeroMiniChart({ trends }) {
  const canvasRef  = useRef(null)
  const chartRef   = useRef(null)
  const trendRef   = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !trends) return
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null }

    const n      = 30
    const labels = trends.labels.slice(-n)
    const pos    = trends.positive.slice(-n)
    const neg    = trends.negative.slice(-n)

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { data: pos, borderColor: C.cyan, backgroundColor: 'rgba(0,229,255,0.08)', fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2 },
          { data: neg, borderColor: C.red,  backgroundColor: 'rgba(255,77,109,0.05)', fill: true, tension: 0.4, pointRadius: 0, borderWidth: 1.5 },
        ]
      },
      options: {
        responsive: false, maintainAspectRatio: false,
        scales: { x: { display: false }, y: { display: false } },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        animation: { duration: 600 }
      }
    })

    // Trend %
    const last7 = pos.slice(-7).reduce((a,b)=>a+b,0)
    const prev7 = pos.slice(-14,-7).reduce((a,b)=>a+b,0) || 1
    const pct   = (((last7 - prev7) / prev7) * 100).toFixed(1)
    if (trendRef.current) {
      trendRef.current.textContent = (pct >= 0 ? '↑ +' : '↓ ') + pct + '%'
      trendRef.current.style.color = pct >= 0 ? C.cyan : C.red
    }

    return () => { chartRef.current?.destroy(); chartRef.current = null }
  }, [trends])

  return (
    <div className="hero-mini-card glass-card">
      <div className="hmc-header">
        <span className="hmc-title">30-day trend</span>
        <span className="hmc-badge" ref={trendRef}>↑ —</span>
      </div>
      <canvas ref={canvasRef} width={240} height={70} />
    </div>
  )
}