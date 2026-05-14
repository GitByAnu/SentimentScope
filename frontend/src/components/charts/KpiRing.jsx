// src/components/charts/KpiRing.jsx
import { useEffect, useRef } from 'react'
import { Chart } from 'chart.js'
import { initChartDefaults } from '../../utils/chartConfig'

initChartDefaults()

export default function KpiRing({ pct, color }) {
  const canvasRef = useRef(null)
  const chartRef  = useRef(null)

  useEffect(() => {
    if (!canvasRef.current) return
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [pct, 100 - pct],
          backgroundColor: [color, 'rgba(255,255,255,0.05)'],
          borderColor: 'transparent'
        }]
      },
      options: {
        cutout: '75%', responsive: false, maintainAspectRatio: false,
        plugins: { legend:{display:false}, tooltip:{enabled:false} },
        animation: { duration: 600 }
      }
    })

    return () => { chartRef.current?.destroy(); chartRef.current = null }
  }, [pct, color])

  return <canvas ref={canvasRef} className="kpi-ring-canvas" width={52} height={52} />
}