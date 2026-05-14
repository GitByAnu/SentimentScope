// src/components/charts/KpiSparkline.jsx
import { useEffect, useRef } from 'react'
import { Chart } from 'chart.js'
import { C, initChartDefaults } from '../../utils/chartConfig'

initChartDefaults()

export default function KpiSparkline({ trends }) {
  const canvasRef = useRef(null)
  const chartRef  = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !trends) return
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null }

    const totals = trends.positive.map((p,i) =>
      p + (trends.negative[i]||0) + (trends.neutral[i]||0)
    )

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: trends.labels.slice(-20),
        datasets: [{ data: totals.slice(-20), backgroundColor: 'rgba(0,229,255,0.28)', borderRadius: 2 }]
      },
      options: {
        responsive: false, maintainAspectRatio: false,
        scales: { x:{display:false}, y:{display:false} },
        plugins: { legend:{display:false}, tooltip:{enabled:false} },
        animation: { duration: 400 }
      }
    })

    return () => { chartRef.current?.destroy(); chartRef.current = null }
  }, [trends])

  return <canvas ref={canvasRef} className="kpi-spark" width={80} height={36} />
}