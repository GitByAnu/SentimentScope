// src/hooks/useToast.js
import { useCallback, useRef } from 'react'

export function useToast() {
  const timerRef = useRef(null)

  const showToast = useCallback((msg) => {
    let t = document.getElementById('ssToast')
    if (!t) {
      t = document.createElement('div')
      t.id = 'ssToast'
      t.style.cssText = [
        'position:fixed', 'bottom:24px', 'right:24px', 'z-index:9999',
        'background:#111827', 'border:1px solid rgba(0,229,255,0.3)',
        'color:#e2e8f0', 'font-size:0.83rem', "font-family:'DM Sans',sans-serif",
        'padding:11px 18px', 'border-radius:12px',
        'box-shadow:0 4px 24px rgba(0,0,0,0.6)',
        'opacity:0', 'transition:opacity 0.3s', 'pointer-events:none',
      ].join(';')
      document.body.appendChild(t)
    }
    t.textContent = msg
    t.style.opacity = '1'
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => { t.style.opacity = '0' }, 3000)
  }, [])

  return showToast
}