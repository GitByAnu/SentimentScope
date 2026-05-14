// src/components/charts/LineChart.jsx
import { useEffect, useRef, useState } from 'react'
import { Chart } from 'chart.js'
import { C, initChartDefaults } from '../../utils/chartConfig'
import { fetchTrends } from '../../services/api'

initChartDefaults()

export default function LineChart({ trends, loading, keyword, region }) {
  const canvasRef  = useRef(null)
  const chartRef   = useRef(null)
  const [period, setPeriod]   = useState('monthly')
  const [localTrends, setLocalTrends] = useState(null)
  const [localLoading, setLocalLoading] = useState(false)

  // Use passed trends initially; switch locally on period toggle
  const activeTrends = localTrends || trends

  useEffect(() => {
    if (!activeTrends || loading) return
    drawChart(activeTrends)
    return () => { chartRef.current?.destroy(); chartRef.current = null }
  }, [activeTrends, loading])

  function drawChart(t) {
    if (!canvasRef.current) return
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null }

    const MAX   = 60
    const start = Math.max(0, t.labels.length - MAX)
    const labels   = t.labels.slice(start)
    const positive = t.positive.slice(start)
    const negative = t.negative.slice(start)
    const neutral  = t.neutral.slice(start)

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label:'Positive', data:positive, borderColor:C.cyan,    backgroundColor:'rgba(0,229,255,0.07)', fill:true, tension:0.4, pointRadius:0, borderWidth:2 },
          { label:'Negative', data:negative, borderColor:C.red,     backgroundColor:'rgba(255,77,109,0.07)', fill:true, tension:0.4, pointRadius:0, borderWidth:2 },
          { label:'Neutral',  data:neutral,  borderColor:C.neutral, backgroundColor:'rgba(107,122,153,0.06)', fill:true, tension:0.4, pointRadius:0, borderWidth:1.5 },
        ]
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        interaction:{ mode:'index', intersect:false },
        scales:{
          x:{ grid:{color:C.grid}, ticks:{maxTicksLimit:8,maxRotation:0,autoSkip:true} },
          y:{ grid:{color:C.grid}, beginAtZero:true }
        },
        plugins:{ legend:{ position:'bottom' } },
        animation:{ duration:600 }
      }
    })
  }

  const handlePeriod = async (p) => {
    setPeriod(p)
    setLocalLoading(true)
    const data = await fetchTrends(p, keyword || 'all', region || 'all')
    setLocalTrends(data)
    setLocalLoading(false)
  }

  return (
    <div className="chart-card glass-card span-2">
      <div className="chart-card-header">
        <h3 className="chart-title">Sentiment Over Time</h3>
        <div className="time-toggle">
          {['daily','weekly','monthly'].map(p => (
            <button
              key={p}
              className={`toggle-btn${period === p ? ' active' : ''}`}
              onClick={() => handlePeriod(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {(loading || localLoading) ? (
        <div className="chart-skeleton tall" />
      ) : (
        <canvas ref={canvasRef} id="lineChart" />
      )}
    </div>
  )
}