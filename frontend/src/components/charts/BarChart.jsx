// src/components/charts/BarChart.jsx
import { useEffect, useRef } from 'react'
import { Chart } from 'chart.js'
import { C, initChartDefaults } from '../../utils/chartConfig'

initChartDefaults()

export default function BarChart({ keywords, loading }) {
  const canvasRef = useRef(null)
  const chartRef  = useRef(null)

  useEffect(() => {
    if (!keywords || loading) return
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null }
    if (!canvasRef.current) return

    const top = keywords.slice(0, 12)

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: top.map(k => k.keyword),
        datasets: [
          { label:'Positive', data:top.map(k=>k.Positive), backgroundColor:C.cyan,    borderRadius:4 },
          { label:'Negative', data:top.map(k=>k.Negative), backgroundColor:C.red,     borderRadius:4 },
          { label:'Neutral',  data:top.map(k=>k.Neutral),  backgroundColor:C.neutral, borderRadius:4 },
        ]
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        scales:{
          x:{ stacked:true, grid:{color:C.grid} },
          y:{ stacked:true, grid:{color:C.grid}, beginAtZero:true }
        },
        plugins:{ legend:{ position:'bottom' } },
        animation:{ duration:600 }
      }
    })

    return () => { chartRef.current?.destroy(); chartRef.current = null }
  }, [keywords, loading])

  return (
    <div className="chart-card glass-card span-2">
      <div className="chart-card-header">
        <h3 className="chart-title">Topic Breakdown</h3>
        <span className="chart-hint">Stacked by sentiment</span>
      </div>
      {loading || !keywords ? (
        <div className="chart-skeleton" />
      ) : (
        <canvas ref={canvasRef} id="barChart" />
      )}
    </div>
  )
}