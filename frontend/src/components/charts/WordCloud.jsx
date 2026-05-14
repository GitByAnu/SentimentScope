// src/components/charts/WordCloud.jsx
const COLORS = ['#00e5ff','#7c4dff','#00e676','#ffd740','#ff9f40','#ff6b6b','#a78bfa','#34d399']

export default function WordCloud({ words, loading }) {
  if (loading || !words?.length) {
    return (
      <div className="chart-card glass-card span-1">
        <div className="chart-card-header">
          <h3 className="chart-title">Trending Words</h3>
        </div>
        <div className="chart-skeleton" />
      </div>
    )
  }

  const maxCount = Math.max(...words.map(w => w.count))

  return (
    <div className="chart-card glass-card span-1">
      <div className="chart-card-header">
        <h3 className="chart-title">Trending Words</h3>
      </div>
      <div className="word-cloud" id="wordCloud">
        {words.slice(0, 23).map((item, i) => {
          const size    = 10 + (item.count / maxCount) * 18
          const opacity = 0.65 + (item.count / maxCount) * 0.35
          return (
            <span
              key={item.word}
              className="wc-word"
              title={`${item.word}: ${item.count} mentions`}
              style={{
                fontSize:        `${size.toFixed(1)}px`,
                color:           COLORS[i % COLORS.length],
                opacity:         opacity.toFixed(2),
                animationDelay:  `${i * 30}ms`,
              }}
            >
              {item.word}
            </span>
          )
        })}
      </div>
    </div>
  )
}