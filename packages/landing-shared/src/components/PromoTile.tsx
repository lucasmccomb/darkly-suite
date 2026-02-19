import { useId } from 'react'

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

interface PromoTileProps {
  tagline?: string
}

export function PromoTile({ tagline = 'Dark mode for Gmail' }: PromoTileProps) {
  const uid = useId()
  const lg = starPath(5, 10, 4.5, 1.3, 4)
  const sm = starPath(15.5, 19, 3.0, 0.6, 4)

  // Layout constants
  const width = 440
  const height = 280
  const logoScale = 2.2
  const logoWidth = 32 * logoScale
  const wordmarkFontSize = 38
  const taglineFontSize = 17

  // Horizontal centering: logo "d" + "arkly" text
  // The logo viewBox is 32 wide, scaled to ~70px. "arkly" is ~5 chars at 38px bold ~ 95px.
  // Total brand width ~ 155px. Offset slightly for optical centering.
  const brandCenterX = width / 2
  const logoX = brandCenterX - 80
  const logoY = 78
  const wordmarkX = logoX + logoWidth - 6
  const wordmarkY = logoY + 24 * logoScale - 4
  const taglineCenterX = width / 2
  const taglineY = wordmarkY + 44

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Background */}
        <linearGradient id={`${uid}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0e0e24" />
          <stop offset="100%" stopColor="#080816" />
        </linearGradient>

        {/* Logo / wordmark gradient */}
        <linearGradient id={`${uid}-g`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f5c842" />
          <stop offset="100%" stopColor="#d4941c" />
        </linearGradient>

        {/* Wordmark text gradient (needs gradientUnits for text) */}
        <linearGradient id={`${uid}-tg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5c842" />
          <stop offset="100%" stopColor="#d4941c" />
        </linearGradient>

        {/* Crescent mask for the "d" bowl */}
        <mask id={`${uid}-m`}>
          <rect width="32" height="32" fill="white" />
          <circle cx="12" cy="20" r="5" fill="black" />
          <circle cx="14.5" cy="19" r="4.5" fill="white" />
          <path d={sm} fill="black" />
        </mask>

        {/* Glow filter */}
        <filter id={`${uid}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0.5" stdDeviation="2.5" floodColor="white" floodOpacity="0.4" />
        </filter>

        {/* Subtle ambient glow behind the brand */}
        <radialGradient id={`${uid}-amb`} cx="50%" cy="45%" r="40%">
          <stop offset="0%" stopColor="#f5c842" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#f5c842" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Dark background */}
      <rect width={width} height={height} rx="12" fill="#0a0a1a" />
      <rect width={width} height={height} rx="12" fill={`url(#${uid}-bg)`} opacity="0.5" />

      {/* Subtle ambient glow */}
      <rect width={width} height={height} rx="12" fill={`url(#${uid}-amb)`} />

      {/* Logo "d" with glow */}
      <g
        transform={`translate(${logoX}, ${logoY}) scale(${logoScale})`}
        filter={`url(#${uid}-glow)`}
      >
        {/* Large sparkle — floating upper-left */}
        <path d={lg} fill={`url(#${uid}-g)`} />

        {/* "d" stem */}
        <rect x="19" y="4" width="3.8" height="24" rx="1.9" fill={`url(#${uid}-g)`} />

        {/* "d" bowl with crescent mask */}
        <circle cx="13.5" cy="20" r="8" fill={`url(#${uid}-g)`} mask={`url(#${uid}-m)`} />
      </g>

      {/* Wordmark "arkly" */}
      <text
        x={wordmarkX}
        y={wordmarkY}
        fill={`url(#${uid}-tg)`}
        fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
        fontWeight="700"
        fontSize={wordmarkFontSize}
        letterSpacing="-0.5"
      >
        arkly
      </text>

      {/* Tagline */}
      <text
        x={taglineCenterX}
        y={taglineY}
        fill="#9aa0a6"
        fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
        fontWeight="400"
        fontSize={taglineFontSize}
        textAnchor="middle"
        letterSpacing="0.2"
      >
        {tagline}
      </text>
    </svg>
  )
}
