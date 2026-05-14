// src/components/charts/GaugeChart.jsx
import { useEffect, useRef } from 'react'
import { Chart } from 'chart.js'
import { C, initChartDefaults } from '../../utils/chartConfig'

initChartDefaults()

export default function GaugeChart({ avgScore = 0 }) {
  const canvasRef = useRef(null)
  const chartRef  = useRef(null)

  useEffect(() => {
    if (!canvasRef.current) return
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null }

    const clamped = Math.max(-1, Math.min(1, avgScore))
    const pct     = (clamped + 1) / 2
    const negArc  = Math.max(0.01, 1 - pct)
    const posArc  = Math.max(0.01, pct)

    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [negArc, posArc],
          backgroundColor: [C.red, C.cyan],
          borderColor: 'transparent',
          borderRadius: 4,
          circumference: 180,
          rotation: -90,
        }]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        animation: { animateRotate: true, duration: 900 }
      }
    })

    return () => { chartRef.current?.destroy(); chartRef.current = null }
  }, [avgScore])

  const clamped = Math.max(-1, Math.min(1, avgScore))
  const scoreColor = clamped >= 0.05 ? C.cyan : clamped <= -0.05 ? C.red : C.neutral
  const scoreLabel = clamped >= 0.05 ? 'Positive' : clamped <= -0.05 ? 'Negative' : 'Neutral'

  return (
    <div className="gauge-card glass-card">
      <div className="gauge-label">Compound Sentiment Score</div>
      <div className="gauge-wrap">
        <canvas ref={canvasRef} width={220} height={120} />
        <div className="gauge-center">
          <div className="gauge-score" style={{ color: scoreColor }}>
            {clamped.toFixed(3)}
          </div>
          <div className="gauge-sublabel" style={{ color: scoreColor }}>{scoreLabel}</div>
        </div>
      </div>
      <div className="gauge-scale">
        <span className="red">−1.0</span>
        <span className="muted">Neutral</span>
        <span className="cyan">+1.0</span>
      </div>
    </div>
  )
}