// src/components/charts/PieChart.jsx
import { useEffect, useRef } from 'react'
import { Chart } from 'chart.js'
import { C, fmt, initChartDefaults } from '../../utils/chartConfig'

initChartDefaults()

export default function PieChart({ meta, loading }) {
  const canvasRef = useRef(null)
  const chartRef  = useRef(null)

  useEffect(() => {
    if (!meta || loading) return

    // Show canvas immediately so Chart.js measures correctly
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null }

    if (!canvasRef.current) return

    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels: ['Positive', 'Negative', 'Neutral'],
        datasets: [{
          data: [meta.pos_pct, meta.neg_pct, meta.neu_pct],
          backgroundColor: [C.cyan, C.red, C.neutral],
          borderColor: 'transparent',
          hoverOffset: 8,
        }]
      },
      options: {
        cutout: '72%', responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: c => ` ${c.label}: ${c.parsed.toFixed(1)}%` } }
        },
        animation: { animateRotate: false, animateScale: false, duration: 400 }
      }
    })

    return () => { chartRef.current?.destroy(); chartRef.current = null }
  }, [meta, loading])

  if (loading || !meta) {
    return <div className="chart-skeleton" id="pieSkeleton" />
  }

  return (
    <>
      <div className="pie-wrapper">
        <canvas ref={canvasRef} id="pieChart" />
        <div className="pie-center-label">
          <div className="pie-total">{fmt(meta.total)}</div>
          <div className="pie-total-label">posts</div>
        </div>
      </div>

      <div className="pie-legend">
        {[
          { label:'Positive', val: meta.pos_pct, cls:'cyan', bg:'var(--cyan)' },
          { label:'Negative', val: meta.neg_pct, cls:'red',  bg:'var(--red)' },
          { label:'Neutral',  val: meta.neu_pct, cls:'muted',bg:'#6b7a99' },
        ].map(({ label, val, cls, bg }) => (
          <div className="legend-item" key={label}>
            <span className="legend-dot" style={{ background: bg }} />
            <span className="legend-label">{label}</span>
            <span className={`legend-val ${cls}`}>{val}%</span>
          </div>
        ))}
      </div>

      <div className="score-bar-wrap">
        <div className="score-bar-track">
          <div className="score-bar-seg pos" style={{ width: meta.pos_pct + '%' }} />
          <div className="score-bar-seg neu" style={{ width: meta.neu_pct + '%' }} />
          <div className="score-bar-seg neg" style={{ width: meta.neg_pct + '%' }} />
        </div>
        <div className="score-bar-labels">
          <span className="cyan">{meta.pos_pct}%</span>
          <span className="muted">{meta.neu_pct}%</span>
          <span className="red">{meta.neg_pct}%</span>
        </div>
      </div>
    </>
  )
}