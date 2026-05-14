// src/utils/chartConfig.js
import {
  Chart,
  ArcElement,
  LineElement,
  BarElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
  Legend,
  DoughnutController,
  LineController,
  BarController,
} from 'chart.js'

Chart.register(
  ArcElement, LineElement, BarElement, PointElement,
  CategoryScale, LinearScale, Filler, Tooltip, Legend,
  DoughnutController, LineController, BarController
)

export const C = {
  cyan:    '#00e5ff',
  red:     '#ff4d6d',
  neutral: '#6b7a99',
  purple:  '#7c4dff',
  green:   '#00e676',
  yellow:  '#ffd740',
  grid:    'rgba(255,255,255,0.06)',
  text:    '#94a3b8',
  font:    "'DM Sans', sans-serif",
}

export function initChartDefaults() {
  Chart.defaults.color = C.text
  Chart.defaults.font.family = C.font
  Chart.defaults.font.size = 12
}

export const fmt = n => n >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(n)
export const fmtTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })