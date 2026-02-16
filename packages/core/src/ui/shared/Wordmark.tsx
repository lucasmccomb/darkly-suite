import { useId } from 'react'
import { usePrefix } from '../../context'

function starPath(cx: number, cy: number, outerR: number, innerR: number, points: number): string {
  const step = Math.PI / points
  let d = ''
  for (let i = 0; i < 2 * points; i++) {
    const r = i % 2 === 0 ? outerR : innerR
    const angle = -Math.PI / 2 + i * step
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)
    d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1)
  }
  return d + 'Z'
}

export function Wordmark() {
  const p = usePrefix()
  const uid = useId()
  const lg = starPath(5, 10, 4.5, 1.3, 4)
  const sm = starPath(15.5, 19, 3.0, 0.6, 4)

  return (
    <span className={`${p}-wordmark`}>
      <span className={`${p}-wordmark-d`}>
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`${uid}-g`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: `var(--${p}-wordmark-start, #f5c842)` }} />
              <stop offset="100%" style={{ stopColor: `var(--${p}-wordmark-end, #d4941c)` }} />
            </linearGradient>
            <mask id={`${uid}-m`}>
              <rect width="32" height="32" fill="white" />
              <circle cx="12" cy="20" r="5" fill="black" />
              <circle cx="14.5" cy="19" r="4.5" fill="white" />
              <path d={sm} fill="black" />
            </mask>
          </defs>
          <path d={lg} fill={`url(#${uid}-g)`} />
          <rect x="19" y="4" width="3.8" height="24" rx="1.9" fill={`url(#${uid}-g)`} />
          <circle cx="13.5" cy="20" r="8" fill={`url(#${uid}-g)`} mask={`url(#${uid}-m)`} />
        </svg>
      </span>
      <span className={`${p}-wordmark-text`}>arkly</span>
    </span>
  )
}
