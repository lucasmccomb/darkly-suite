import type { ReactNode } from 'react'
import { Nav } from '../components/Nav.tsx'
import { Footer } from '../components/Footer.tsx'
import { PromoTile } from '../components/PromoTile.tsx'
import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

// ─── Props ──────────────────────────────────────────────────

interface LogoDesignPageProps {
  navLinks: Array<{ to: string; label: string; external?: boolean }>
  navCta: { to: string; label: string }
  footerLinks: Array<{ to: string; label: string; external?: boolean }>
  copyrightName: string
  trademarkText?: string
  brandLabel?: string
  children?: ReactNode
}

// ─── SVG Logo Components ─────────────────────────────────────
// Each takes an `id` prop for unique SVG element IDs (masks, gradients)
// since multiple instances render on the same page.

interface LogoProps {
  id: string
}

// Helper: generate SVG path for an N-pointed star
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

// Variant 1: Bold stroked "d" with separate crescent moon
function SolidCrescent({ id }: LogoProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <mask id={`${id}-m`}>
          <rect width="32" height="32" fill="white" />
          <circle cx="7.5" cy="17.5" r="4" fill="black" />
        </mask>
      </defs>
      <path
        d="M21 5v23M21 14a7.5 7.5 0 1 0 0 12"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="5.5" cy="18.5" r="5" fill="var(--logo-accent)" mask={`url(#${id}-m)`} />
    </svg>
  )
}

// Variant 2: Filled "d" with blue→purple gradient, crescent alongside
function GradientFill({ id }: LogoProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-g`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8ab4f8" />
          <stop offset="100%" stopColor="#6c5ce7" />
        </linearGradient>
        <mask id={`${id}-dm`}>
          <rect width="32" height="32" fill="white" />
          <circle cx="13.5" cy="20" r="4.5" fill="black" />
        </mask>
        <mask id={`${id}-cm`}>
          <rect width="32" height="32" fill="white" />
          <circle cx="7" cy="17" r="4" fill="black" />
        </mask>
      </defs>
      <rect x="19" y="4" width="3.8" height="24" rx="1.9" fill={`url(#${id}-g)`} />
      <circle cx="13.5" cy="20" r="8" fill={`url(#${id}-g)`} mask={`url(#${id}-dm)`} />
      <circle cx="5" cy="18" r="5" fill={`url(#${id}-g)`} mask={`url(#${id}-cm)`} />
    </svg>
  )
}

// Variant 3: Thin elegant stroked "d" with delicate crescent
function ThinElegant({ id }: LogoProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <mask id={`${id}-m`}>
          <rect width="32" height="32" fill="white" />
          <circle cx="7.5" cy="17.5" r="3.5" fill="black" />
        </mask>
      </defs>
      <path
        d="M21 4v25M21 13.5a8 8 0 1 0 0 13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="5.5" cy="18.5" r="4.2" fill="var(--logo-accent)" mask={`url(#${id}-m)`} />
    </svg>
  )
}

// Variant 4: Gradient circle with "d" + moon as negative space
function NegativeSpaceBadge({ id }: LogoProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-g`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8ab4f8" />
          <stop offset="100%" stopColor="#6c5ce7" />
        </linearGradient>
        <mask id={`${id}-m`}>
          <rect width="32" height="32" fill="white" />
          <rect x="18.5" y="7" width="2.8" height="18" rx="1.4" fill="black" />
          <circle cx="14" cy="19.5" r="6" fill="black" />
          <circle cx="14" cy="19.5" r="3.5" fill="white" />
          <circle cx="6" cy="17.5" r="3.8" fill="black" />
          <circle cx="7.8" cy="17" r="3.3" fill="white" />
        </mask>
      </defs>
      <circle cx="16" cy="16" r="15" fill={`url(#${id}-g)`} mask={`url(#${id}-m)`} />
    </svg>
  )
}

// Variant 5: Bowl counter IS the crescent moon
function MoonAsCounter({ id }: LogoProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <mask id={`${id}-m`}>
          <rect width="32" height="32" fill="white" />
          <circle cx="12" cy="20" r="5" fill="black" />
          <circle cx="14.5" cy="19" r="4.5" fill="white" />
        </mask>
      </defs>
      <rect x="19" y="5" width="3.5" height="23" rx="1.75" fill="currentColor" />
      <circle cx="13.5" cy="20" r="8" fill="currentColor" mask={`url(#${id}-m)`} />
    </svg>
  )
}

// Variant 6: Circle outline with "d" + accent crescent
function OutlineBadge({ id }: LogoProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <mask id={`${id}-m`}>
          <rect width="32" height="32" fill="white" />
          <circle cx="8.5" cy="17" r="3" fill="black" />
        </mask>
      </defs>
      <circle cx="16" cy="16" r="14.5" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M19 8v17M19 14a5.5 5.5 0 1 0 0 9"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="18" r="3.5" fill="var(--logo-accent)" mask={`url(#${id}-m)`} />
    </svg>
  )
}

// Variant 7: Fading bowl + star accents
function FadingMoon({ id }: LogoProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-f`} x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="35%" stopColor="currentColor" stopOpacity="0.3" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
        </linearGradient>
      </defs>
      <path d="M21 5v23" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="13" cy="19" r="8" stroke={`url(#${id}-f)`} strokeWidth="2.5" fill="none" />
      <circle cx="4" cy="14" r="1" fill="var(--logo-accent)" />
      <circle cx="2.5" cy="19.5" r="0.7" fill="var(--logo-accent)" opacity="0.6" />
      <circle cx="4.5" cy="24.5" r="0.85" fill="var(--logo-accent)" opacity="0.8" />
    </svg>
  )
}

// Variant 8: Squircle (rounded square) with knockout
function SquircleMonogram({ id }: LogoProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-g`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8ab4f8" />
          <stop offset="100%" stopColor="#6c5ce7" />
        </linearGradient>
        <mask id={`${id}-m`}>
          <rect width="32" height="32" fill="white" />
          <rect x="18.5" y="7" width="2.8" height="18" rx="1.4" fill="black" />
          <circle cx="14" cy="19.5" r="6" fill="black" />
          <circle cx="14" cy="19.5" r="3.5" fill="white" />
          <circle cx="6" cy="17.5" r="3.8" fill="black" />
          <circle cx="7.8" cy="17" r="3.3" fill="white" />
        </mask>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="7" fill={`url(#${id}-g)`} mask={`url(#${id}-m)`} />
    </svg>
  )
}

// ─── Combined Variants: Gradient + Crescent Counter + Star ──

// Variant 9: Gradient "d" with crescent counter + 5-point star
function CrescentAndStar({ id }: LogoProps) {
  const star = starPath(16, 19, 1.4, 0.55, 5)
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-g`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8ab4f8" />
          <stop offset="100%" stopColor="#6c5ce7" />
        </linearGradient>
        <mask id={`${id}-m`}>
          <rect width="32" height="32" fill="white" />
          <circle cx="12" cy="20" r="5" fill="black" />
          <circle cx="14.5" cy="19" r="4.5" fill="white" />
          <path d={star} fill="black" />
        </mask>
      </defs>
      <rect x="19" y="4" width="3.8" height="24" rx="1.9" fill={`url(#${id}-g)`} />
      <circle cx="13.5" cy="20" r="8" fill={`url(#${id}-g)`} mask={`url(#${id}-m)`} />
    </svg>
  )
}

// Variant 10: Gradient "d" with crescent counter + 4-point sparkle
function CrescentAndSparkle({ id }: LogoProps) {
  const sparkle = starPath(16, 19, 1.5, 0.3, 4)
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-g`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8ab4f8" />
          <stop offset="100%" stopColor="#6c5ce7" />
        </linearGradient>
        <mask id={`${id}-m`}>
          <rect width="32" height="32" fill="white" />
          <circle cx="12" cy="20" r="5" fill="black" />
          <circle cx="14.5" cy="19" r="4.5" fill="white" />
          <path d={sparkle} fill="black" />
        </mask>
      </defs>
      <rect x="19" y="4" width="3.8" height="24" rx="1.9" fill={`url(#${id}-g)`} />
      <circle cx="13.5" cy="20" r="8" fill={`url(#${id}-g)`} mask={`url(#${id}-m)`} />
    </svg>
  )
}

// Variant 11: Circle badge — gradient circle with d + crescent + star knocked out
function CrescentStarBadge({ id }: LogoProps) {
  const star = starPath(15.5, 19, 0.9, 0.35, 5)
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-g`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8ab4f8" />
          <stop offset="100%" stopColor="#6c5ce7" />
        </linearGradient>
        <mask id={`${id}-m`}>
          <rect width="32" height="32" fill="white" />
          <rect x="18.5" y="7" width="2.8" height="18" rx="1.4" fill="black" />
          <circle cx="14" cy="19.5" r="6" fill="black" />
          <circle cx="14" cy="19.5" r="3.5" fill="white" />
          <circle cx="12.5" cy="19.5" r="3" fill="black" />
          <circle cx="14" cy="19" r="2.5" fill="white" />
          <path d={star} fill="black" />
        </mask>
      </defs>
      <circle cx="16" cy="16" r="15" fill={`url(#${id}-g)`} mask={`url(#${id}-m)`} />
    </svg>
  )
}

// Variant 12: Squircle badge — rounded square with d + crescent + star knocked out
function CrescentStarSquircle({ id }: LogoProps) {
  const star = starPath(15.5, 19, 0.9, 0.35, 5)
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-g`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8ab4f8" />
          <stop offset="100%" stopColor="#6c5ce7" />
        </linearGradient>
        <mask id={`${id}-m`}>
          <rect width="32" height="32" fill="white" />
          <rect x="18.5" y="7" width="2.8" height="18" rx="1.4" fill="black" />
          <circle cx="14" cy="19.5" r="6" fill="black" />
          <circle cx="14" cy="19.5" r="3.5" fill="white" />
          <circle cx="12.5" cy="19.5" r="3" fill="black" />
          <circle cx="14" cy="19" r="2.5" fill="white" />
          <path d={star} fill="black" />
        </mask>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="7" fill={`url(#${id}-g)`} mask={`url(#${id}-m)`} />
    </svg>
  )
}

// ─── Dual Sparkle Variants: V10 base + 2 sparkles ───────────

// Variant 13: Standalone — large sparkle floating upper-left, small sparkle in counter
function DualSparkle({ id }: LogoProps) {
  const lg = starPath(5, 10, 4.5, 1.8, 4)
  const sm = starPath(15.5, 19, 3.0, 0.6, 4)
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-g`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8ab4f8" />
          <stop offset="100%" stopColor="#6c5ce7" />
        </linearGradient>
        <mask id={`${id}-m`}>
          <rect width="32" height="32" fill="white" />
          <circle cx="12" cy="20" r="5" fill="black" />
          <circle cx="14.5" cy="19" r="4.5" fill="white" />
          <path d={sm} fill="black" />
        </mask>
      </defs>
      <path d={lg} fill={`url(#${id}-g)`} />
      <rect x="19" y="4" width="3.8" height="24" rx="1.9" fill={`url(#${id}-g)`} />
      <circle cx="13.5" cy="20" r="8" fill={`url(#${id}-g)`} mask={`url(#${id}-m)`} />
    </svg>
  )
}

// Variant 14: Squircle — large sparkle upper-left, small sparkle in counter
function DualSparkleSquircle({ id }: LogoProps) {
  const lg = starPath(5, 10, 4.5, 1.8, 4)
  const sm = starPath(15.5, 19, 1.8, 0.36, 4)
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-g`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8ab4f8" />
          <stop offset="100%" stopColor="#6c5ce7" />
        </linearGradient>
        <mask id={`${id}-m`}>
          <rect width="32" height="32" fill="white" />
          <path d={lg} fill="black" />
          <rect x="18.5" y="7" width="2.8" height="18" rx="1.4" fill="black" />
          <circle cx="14" cy="19.5" r="6" fill="black" />
          <circle cx="14" cy="19.5" r="3.5" fill="white" />
          <circle cx="12.5" cy="19.5" r="3" fill="black" />
          <circle cx="14" cy="19" r="2.5" fill="white" />
          <path d={sm} fill="black" />
        </mask>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="7" fill={`url(#${id}-g)`} mask={`url(#${id}-m)`} />
    </svg>
  )
}

// Variant 15: Standalone alt — large sparkle left of bowl, small sparkle in counter
function DualSparkleAlt({ id }: LogoProps) {
  const lg = starPath(4.5, 17, 4.5, 0.9, 4)
  const sm = starPath(16, 19, 1.5, 0.3, 4)
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-g`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8ab4f8" />
          <stop offset="100%" stopColor="#6c5ce7" />
        </linearGradient>
        <mask id={`${id}-m`}>
          <rect width="32" height="32" fill="white" />
          <circle cx="12" cy="20" r="5" fill="black" />
          <circle cx="14.5" cy="19" r="4.5" fill="white" />
          <path d={sm} fill="black" />
        </mask>
      </defs>
      <path d={lg} fill={`url(#${id}-g)`} />
      <rect x="19" y="4" width="3.8" height="24" rx="1.9" fill={`url(#${id}-g)`} />
      <circle cx="13.5" cy="20" r="8" fill={`url(#${id}-g)`} mask={`url(#${id}-m)`} />
    </svg>
  )
}

// Variant 16: Squircle alt — large sparkle left of bowl, small sparkle in counter
function DualSparkleAltSquircle({ id }: LogoProps) {
  const lg = starPath(4.5, 17, 4.5, 0.9, 4)
  const sm = starPath(15.5, 19, 0.9, 0.18, 4)
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-g`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8ab4f8" />
          <stop offset="100%" stopColor="#6c5ce7" />
        </linearGradient>
        <mask id={`${id}-m`}>
          <rect width="32" height="32" fill="white" />
          <path d={lg} fill="black" />
          <rect x="18.5" y="7" width="2.8" height="18" rx="1.4" fill="black" />
          <circle cx="14" cy="19.5" r="6" fill="black" />
          <circle cx="14" cy="19.5" r="3.5" fill="white" />
          <circle cx="12.5" cy="19.5" r="3" fill="black" />
          <circle cx="14" cy="19" r="2.5" fill="white" />
          <path d={sm} fill="black" />
        </mask>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="7" fill={`url(#${id}-g)`} mask={`url(#${id}-m)`} />
    </svg>
  )
}

// Variant 17: Standalone — like V13 but with slightly thinner large sparkle
function DualSparkleSlim({ id }: LogoProps) {
  const lg = starPath(5, 10, 4.5, 1.3, 4)
  const sm = starPath(15.5, 19, 3.0, 0.6, 4)
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-g`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8ab4f8" />
          <stop offset="100%" stopColor="#6c5ce7" />
        </linearGradient>
        <mask id={`${id}-m`}>
          <rect width="32" height="32" fill="white" />
          <circle cx="12" cy="20" r="5" fill="black" />
          <circle cx="14.5" cy="19" r="4.5" fill="white" />
          <path d={sm} fill="black" />
        </mask>
      </defs>
      <path d={lg} fill={`url(#${id}-g)`} />
      <rect x="19" y="4" width="3.8" height="24" rx="1.9" fill={`url(#${id}-g)`} />
      <circle cx="13.5" cy="20" r="8" fill={`url(#${id}-g)`} mask={`url(#${id}-m)`} />
    </svg>
  )
}

// Variant 18: Squircle — identical V17 logo shrunk inside a dark rounded square
function DualSparkleSlimSquircle({ id }: LogoProps) {
  const lg = starPath(5, 10, 4.5, 1.3, 4)
  const sm = starPath(15.5, 19, 3.0, 0.6, 4)
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id={`${id}-clip`}>
          <rect x="1" y="1" width="30" height="30" rx="7" />
        </clipPath>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="7" fill="#0a0a1a" />
      <g clipPath={`url(#${id}-clip)`}>
        <svg viewBox="-3 -3 38 38" x="1" y="1" width="30" height="30">
          <defs>
            <linearGradient id={`${id}-g`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8ab4f8" />
              <stop offset="100%" stopColor="#6c5ce7" />
            </linearGradient>
            <mask id={`${id}-m`}>
              <rect x="-3" y="-3" width="38" height="38" fill="white" />
              <circle cx="12" cy="20" r="5" fill="black" />
              <circle cx="14.5" cy="19" r="4.5" fill="white" />
              <path d={sm} fill="black" />
            </mask>
          </defs>
          <path d={lg} fill={`url(#${id}-g)`} />
          <rect x="19" y="4" width="3.8" height="24" rx="1.9" fill={`url(#${id}-g)`} />
          <circle cx="13.5" cy="20" r="8" fill={`url(#${id}-g)`} mask={`url(#${id}-m)`} />
        </svg>
      </g>
    </svg>
  )
}

// Variant 19: Standalone — context-aware gradient (golden on dark, blue on light) + white haze
function DualSparkleDeep({ id }: LogoProps) {
  const lg = starPath(5, 10, 4.5, 1.3, 4)
  const sm = starPath(15.5, 19, 3.0, 0.6, 4)
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-g`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'var(--logo-deep-start, #f5c842)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--logo-deep-end, #d4941c)' }} />
        </linearGradient>
        <mask id={`${id}-m`}>
          <rect width="32" height="32" fill="white" />
          <circle cx="12" cy="20" r="5" fill="black" />
          <circle cx="14.5" cy="19" r="4.5" fill="white" />
          <path d={sm} fill="black" />
        </mask>
        <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0.5" stdDeviation="2.5" floodColor="white" floodOpacity="0.4" />
        </filter>
      </defs>
      <g filter={`url(#${id}-glow)`}>
        <path d={lg} fill={`url(#${id}-g)`} />
        <rect x="19" y="4" width="3.8" height="24" rx="1.9" fill={`url(#${id}-g)`} />
        <circle cx="13.5" cy="20" r="8" fill={`url(#${id}-g)`} mask={`url(#${id}-m)`} />
      </g>
    </svg>
  )
}

// Variant 20: Squircle — V19 logo in context-aware squircle
function DualSparkleDeepSquircle({ id }: LogoProps) {
  const lg = starPath(5, 10, 4.5, 1.3, 4)
  const sm = starPath(15.5, 19, 3.0, 0.6, 4)
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-border`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'var(--logo-deep-start, #f5c842)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--logo-deep-end, #d4941c)' }} />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <rect x="1" y="1" width="30" height="30" rx="7" />
        </clipPath>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="7" style={{ fill: 'var(--logo-deep-bg, #0a0a1a)' }} />
      <g clipPath={`url(#${id}-clip)`}>
        <svg viewBox="-5.25 -3 38 38" x="1" y="1" width="30" height="30">
          <defs>
            <linearGradient id={`${id}-g`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: 'var(--logo-deep-start, #f5c842)' }} />
              <stop offset="100%" style={{ stopColor: 'var(--logo-deep-end, #d4941c)' }} />
            </linearGradient>
            <mask id={`${id}-m`}>
              <rect x="-6" y="-3" width="40" height="38" fill="white" />
              <circle cx="12" cy="20" r="5" fill="black" />
              <circle cx="14.5" cy="19" r="4.5" fill="white" />
              <path d={sm} fill="black" />
            </mask>
            <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0.5" stdDeviation="2.5" floodColor="white" floodOpacity="0.4" />
            </filter>
          </defs>
          <g filter={`url(#${id}-glow)`}>
            <path d={lg} fill={`url(#${id}-g)`} />
            <rect x="19" y="4" width="3.8" height="24" rx="1.9" fill={`url(#${id}-g)`} />
            <circle cx="13.5" cy="20" r="8" fill={`url(#${id}-g)`} mask={`url(#${id}-m)`} />
          </g>
        </svg>
      </g>
      <rect x="1.5" y="1.5" width="29" height="29" rx="6.5" fill="none" stroke={`url(#${id}-border)`} strokeWidth="1.2" />
    </svg>
  )
}

// ─── Uppercase D Components ─────────────────────────────────

interface UpperDConfig {
  dPath: string
  moon: [number, number, number]
  bite: [number, number, number]
  sparklePos: [number, number]
  smPos: [number, number]
  smSize?: [number, number]
}

function UpperDStandalone({ id, config }: { id: string; config: UpperDConfig }) {
  const sparkle = starPath(config.sparklePos[0], config.sparklePos[1], 4.0, 1.2, 4)
  const sm = starPath(config.smPos[0], config.smPos[1], config.smSize?.[0] ?? 3.0, config.smSize?.[1] ?? 0.6, 4)
  const [mcx, mcy, mr] = config.moon
  const [bcx, bcy, br] = config.bite
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-g`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'var(--logo-deep-start, #f5c842)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--logo-deep-end, #d4941c)' }} />
        </linearGradient>
        <mask id={`${id}-m`}>
          <rect width="32" height="32" fill="white" />
          <circle cx={mcx} cy={mcy} r={mr} fill="black" />
          <circle cx={bcx} cy={bcy} r={br} fill="white" />
          <path d={sm} fill="black" />
        </mask>
        <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0.5" stdDeviation="2.5" floodColor="white" floodOpacity="0.4" />
        </filter>
      </defs>
      <g filter={`url(#${id}-glow)`}>
        <path d={sparkle} fill={`url(#${id}-g)`} />
        <path d={config.dPath} fill={`url(#${id}-g)`} mask={`url(#${id}-m)`} />
      </g>
    </svg>
  )
}

function UpperDSquircleFrame({ id, config }: { id: string; config: UpperDConfig }) {
  const sparkle = starPath(config.sparklePos[0], config.sparklePos[1], 4.0, 1.2, 4)
  const sm = starPath(config.smPos[0], config.smPos[1], config.smSize?.[0] ?? 3.0, config.smSize?.[1] ?? 0.6, 4)
  const [mcx, mcy, mr] = config.moon
  const [bcx, bcy, br] = config.bite
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-border`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'var(--logo-deep-start, #f5c842)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--logo-deep-end, #d4941c)' }} />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <rect x="1" y="1" width="30" height="30" rx="7" />
        </clipPath>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="7" style={{ fill: 'var(--logo-deep-bg, #0a0a1a)' }} />
      <g clipPath={`url(#${id}-clip)`}>
        <svg viewBox="-3 -3 38 38" x="1" y="1" width="30" height="30">
          <defs>
            <linearGradient id={`${id}-g`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: 'var(--logo-deep-start, #f5c842)' }} />
              <stop offset="100%" style={{ stopColor: 'var(--logo-deep-end, #d4941c)' }} />
            </linearGradient>
            <mask id={`${id}-m`}>
              <rect x="-10" y="-10" width="60" height="60" fill="white" />
              <circle cx={mcx} cy={mcy} r={mr} fill="black" />
              <circle cx={bcx} cy={bcy} r={br} fill="white" />
              <path d={sm} fill="black" />
            </mask>
            <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0.5" stdDeviation="2.5" floodColor="white" floodOpacity="0.4" />
            </filter>
          </defs>
          <g filter={`url(#${id}-glow)`}>
            <path d={sparkle} fill={`url(#${id}-g)`} />
            <path d={config.dPath} fill={`url(#${id}-g)`} mask={`url(#${id}-m)`} />
          </g>
        </svg>
      </g>
      <rect x="1.5" y="1.5" width="29" height="29" rx="6.5" fill="none" stroke={`url(#${id}-border)`} strokeWidth="1.2" />
    </svg>
  )
}

// ─── Variant Data ────────────────────────────────────────────

interface LogoVariant {
  name: string
  description: string
  note: string
  component: (props: LogoProps) => ReactNode
}

const variants: LogoVariant[] = [
  { name: 'Solid Crescent', description: 'Bold stroked "d" with a separate crescent moon nestled against the bowl curve.', note: 'Strong at all sizes. General-purpose candidate.', component: SolidCrescent },
  { name: 'Gradient Fill', description: 'Filled "d" shape with blue-to-purple gradient. Crescent alongside in matching gradient.', note: 'Rich brand feel. Great for marketing and hero sections.', component: GradientFill },
  { name: 'Thin Elegant', description: 'Lightweight, thin-stroke "d" with a delicate crescent. Minimal and refined.', note: 'Best at 32px+. May need bolder version for 16px.', component: ThinElegant },
  { name: 'Negative Space Badge', description: 'Gradient circle with "d" and moon knocked out as negative space.', note: 'Best for 16px favicon and extension icon.', component: NegativeSpaceBadge },
  { name: 'Moon as Counter', description: 'The bowl\'s inner counter IS a crescent moon. The letter and moon are one.', note: 'Clever integration. Very memorable once you see it.', component: MoonAsCounter },
  { name: 'Outline Badge', description: 'Circular outline containing "d" with an accent-colored crescent.', note: 'Professional two-tone look.', component: OutlineBadge },
  { name: 'Fading Moon', description: 'The bowl fades to transparent on the left, like a waning moon. Star accents add atmosphere.', note: 'Artistic. Best at larger sizes for marketing.', component: FadingMoon },
  { name: 'Squircle Monogram', description: 'Modern rounded-square app icon with gradient fill. "d" and moon as negative space.', note: 'App-store style. Modern icon shape language.', component: SquircleMonogram },
  { name: 'Crescent & Star', description: 'Gradient-filled "d" with crescent counter and a 5-point star in the negative space.', note: 'Combines V2 gradient + V5 moon-counter + star. Night sky feel.', component: CrescentAndStar },
  { name: 'Crescent & Sparkle', description: 'Gradient-filled "d" with crescent counter and a 4-point sparkle/twinkle shape.', note: 'Softer, more whimsical than the 5-point star.', component: CrescentAndSparkle },
  { name: 'Crescent & Star Badge', description: 'Gradient circle with "d", crescent, and star all knocked out as negative space.', note: 'Badge format for favicons and extension icons.', component: CrescentStarBadge },
  { name: 'Crescent & Star Squircle', description: 'Rounded-square app icon with "d", crescent, and star as negative space.', note: 'Modern app icon shape. Pairs with the badge variant.', component: CrescentStarSquircle },
  { name: 'Dual Sparkle', description: 'Gradient "d" with crescent counter, small sparkle inside, and a large 3x sparkle floating upper-left.', note: 'Standalone branding logo. Night sky composition.', component: DualSparkle },
  { name: 'Dual Sparkle Squircle', description: 'Squircle with "d", crescent, and both sparkles knocked out. Large sparkle upper-left.', note: 'Extension panel icon. Pairs with standalone V13.', component: DualSparkleSquircle },
  { name: 'Dual Sparkle Alt', description: 'Gradient "d" with crescent counter, small sparkle inside, and a large 3x sparkle left of the bowl.', note: 'Standalone branding. Star beside the moon.', component: DualSparkleAlt },
  { name: 'Dual Sparkle Alt Squircle', description: 'Squircle with "d", crescent, and both sparkles knocked out. Large sparkle left of bowl.', note: 'Extension panel icon. Pairs with standalone V15.', component: DualSparkleAltSquircle },
  { name: 'Dual Sparkle Slim', description: 'Like V13 but with a slightly thinner large sparkle — between V13 thickness and the small sparkle.', note: 'Refined standalone branding. Balanced sparkle weight.', component: DualSparkleSlim },
  { name: 'Dual Sparkle Slim Squircle', description: 'V17 logo inside a dark squircle. Identical logo appearance, just contained in a rounded square.', note: 'App icon / extension panel. Pairs with standalone V17.', component: DualSparkleSlimSquircle },
  { name: 'Dual Sparkle Deep', description: 'V17 shapes with a deeper purple gradient and a subtle smokey white haze/glow around the logo.', note: 'Rich, atmospheric standalone. Deeper purple end (#5232a8).', component: DualSparkleDeep },
  { name: 'Dual Sparkle Deep Squircle', description: 'V19 logo inside a dark squircle with padding. Deeper purple + white haze glow.', note: 'App icon with atmosphere. Pairs with standalone V19.', component: DualSparkleDeepSquircle },
]

const UPPER_D_VARIANTS: Array<{ name: string; description: string; note: string; config: UpperDConfig }> = [
  { name: 'Times New Roman', description: 'Serif — actual Times New Roman Bold glyph outline.', note: 'The classic serif. High-contrast strokes with bracketed serifs.', config: { dPath: 'M14.7,28.0L3.9,28.0L3.9,27.3L4.7,27.3Q5.8,27.3 6.3,27.0Q6.9,26.7 7.1,26.1L7.1,26.1Q7.3,25.8 7.3,23.9L7.3,23.9L7.3,8.1Q7.3,6.3 7.1,5.8Q6.9,5.3 6.3,5.0Q5.7,4.7 4.7,4.7L4.7,4.7L3.9,4.7L3.9,4.0L14.7,4.0Q19.0,4.0 21.6,5.2L21.6,5.2Q24.8,6.6 26.4,9.5Q28.1,12.4 28.1,16.1L28.1,16.1Q28.1,18.6 27.3,20.7Q26.5,22.9 25.2,24.3Q23.9,25.6 22.2,26.5Q20.5,27.3 18.1,27.8L18.1,27.8Q17.0,28.0 14.7,28.0L14.7,28.0Z', moon: [17.6, 16.0, 12.2], bite: [10.9, 16.0, 12.2], sparklePos: [29, 2], smPos: [20.0, 14.0] } },
  { name: 'Georgia', description: 'Serif — actual Georgia Bold glyph outline.', note: 'Designed for screens. Generous x-height, open counters.', config: { dPath: 'M24.4,6.5L24.4,6.5Q26.6,7.9 27.9,10.3Q29.3,12.7 29.3,16.2L29.3,16.2Q29.3,19.2 28.1,21.5Q26.9,23.7 24.9,25.2L24.9,25.2Q22.8,26.6 20.3,27.3Q17.7,28.0 14.8,28.0L14.8,28.0L2.8,28.0L2.8,26.7Q3.3,26.7 4.1,26.6Q4.9,26.5 5.2,26.4L5.2,26.4Q5.8,26.1 6.0,25.7Q6.3,25.3 6.3,24.7L6.3,24.7L6.3,7.6Q6.3,7.1 6.1,6.6Q5.8,6.1 5.2,5.8L5.2,5.8Q4.5,5.6 3.8,5.5Q3.1,5.4 2.7,5.3L2.7,5.3L2.7,4.0L15.5,4.0Q17.5,4.0 19.9,4.5Q22.2,5.0 24.4,6.5Z', moon: [18.1, 16.0, 13.9], bite: [10.4, 16.0, 13.9], sparklePos: [29, 2], smPos: [20.0, 14.0] } },
  { name: 'Big Caslon', description: 'Serif — actual Big Caslon glyph outline.', note: 'Elegant transitional serif. High stroke contrast, refined details.', config: { dPath: 'M28.9,15.8L28.9,15.8Q28.9,13.6 28.4,11.9Q27.8,10.3 26.9,9.0Q26.0,7.7 24.8,6.8Q23.6,5.9 22.2,5.3L22.2,5.3Q21.1,4.8 20.0,4.6Q18.9,4.3 17.8,4.2Q16.7,4.1 15.7,4.1L15.7,4.1Q14.6,4.1 13.5,4.1L13.5,4.1Q9.8,4.1 7.2,4.1Q4.6,4.2 3.2,4.2L3.2,4.2L3.2,4.5Q4.1,4.6 4.8,4.8Q5.5,5.1 6.0,5.7L6.0,5.7Q6.2,5.9 6.3,6.3Q6.4,6.7 6.4,7.2Q6.4,7.7 6.4,8.3L6.4,8.3Q6.4,8.9 6.4,9.5L6.4,9.5L6.4,16.0Q6.4,16.9 6.4,17.9L6.4,17.9Q6.4,18.9 6.4,19.8Q6.4,20.8 6.4,21.6Q6.4,22.4 6.4,22.8L6.4,22.8Q6.4,23.4 6.4,23.9Q6.3,24.5 6.3,25.0Q6.2,25.5 6.1,25.9Q6.0,26.3 5.9,26.4L5.9,26.4Q5.5,26.9 4.7,27.2Q3.9,27.6 3.1,27.7L3.1,27.7L3.1,28.0L15.2,28.0Q16.7,28.0 18.3,27.8Q19.9,27.6 21.4,27.0Q23.0,26.5 24.3,25.6Q25.7,24.7 26.7,23.4Q27.7,22.0 28.3,20.1Q28.9,18.2 28.9,15.8Z', moon: [17.9, 16.0, 13.3], bite: [10.6, 16.0, 13.3], sparklePos: [29, 2], smPos: [20.0, 14.0] } },
  { name: 'Arial', description: 'Sans-serif — actual Arial Bold glyph outline.', note: 'The ubiquitous neo-grotesque. Clean, no-nonsense geometry.', config: { dPath: 'M5.9,28.0L5.9,4.0L14.8,4.0Q17.8,4.0 19.4,4.5L19.4,4.5Q21.5,5.1 23.0,6.7Q24.5,8.3 25.3,10.6Q26.1,12.9 26.1,16.2L26.1,16.2Q26.1,19.2 25.3,21.3L25.3,21.3Q24.4,24.0 22.8,25.6L22.8,25.6Q21.5,26.8 19.3,27.5L19.3,27.5Q17.7,28.0 15.1,28.0L15.1,28.0L5.9,28.0Z', moon: [16.8, 16.0, 9.4], bite: [11.7, 16.0, 9.4], sparklePos: [28, 2], smPos: [18.5, 14.0], smSize: [2.5, 0.5] } },
  { name: 'Arial Narrow', description: 'Sans-serif — actual Arial Narrow Bold glyph outline.', note: 'Condensed sans-serif. Compact horizontal footprint.', config: { dPath: 'M7.6,28.0L7.6,3.5L15.0,3.5Q17.8,3.5 19.2,4.1Q20.7,4.7 21.9,6.2Q23.1,7.7 23.8,10.1Q24.4,12.4 24.4,16.0L24.4,16.0Q24.4,19.2 23.7,21.5Q23.0,23.9 21.9,25.2Q20.8,26.6 19.2,27.3Q17.7,28.0 15.2,28.0L15.2,28.0L7.6,28.0Z', moon: [16.2, 16.0, 7.1], bite: [12.3, 16.0, 7.1], sparklePos: [26, 2], smPos: [17.5, 14.0], smSize: [2.0, 0.4] } },
  { name: 'Arial Rounded', description: 'Sans-serif — actual Arial Rounded Bold glyph outline.', note: 'Rounded terminals for a softer, friendlier feel.', config: { dPath: 'M8.6,3.5L8.6,3.5L15.0,3.5Q17.6,3.5 19.4,3.9Q21.2,4.4 22.7,5.7L22.7,5.7Q26.5,9.0 26.5,15.7L26.5,15.7Q26.5,17.9 26.1,19.7Q25.7,21.5 24.9,23.0Q24.1,24.5 22.9,25.6L22.9,25.6Q21.9,26.5 20.7,27.0Q19.5,27.6 18.2,27.8Q16.8,28.0 15.1,28.0L15.1,28.0L8.7,28.0Q7.3,28.0 6.6,27.6Q5.9,27.2 5.7,26.4Q5.5,25.7 5.5,24.5L5.5,24.5L5.5,6.5Q5.5,4.9 6.2,4.2Q7.0,3.5 8.6,3.5Z', moon: [17.0, 16.0, 10.0], bite: [11.5, 16.0, 10.0], sparklePos: [28, 2], smPos: [19.0, 14.0] } },
]

// ─── Page Sections ───────────────────────────────────────────

const SWATCHES = [
  { key: 'dark', cls: 'logo-swatch--dark' },
  { key: 'gray', cls: 'logo-swatch--gray' },
  { key: 'light', cls: 'logo-swatch--light' },
  { key: 'white', cls: 'logo-swatch--white' },
] as const

function LogoCard({ variant, index }: { variant: LogoVariant; index: number }) {
  const Comp = variant.component
  const prefix = `v${index + 1}`
  const sizes = [16, 32, 48] as const

  return (
    <div className="logo-card">
      <div className="logo-card-number">Variant {index + 1}</div>
      <div className="logo-card-name">{variant.name}</div>
      <div className="logo-card-desc">{variant.description}</div>
      <div className="logo-card-note">{variant.note}</div>
      <div className="logo-card-swatches">
        {SWATCHES.map(s => (
          <div key={s.key} className={`logo-swatch ${s.cls}`}>
            <Comp id={`${prefix}-${s.key}`} />
          </div>
        ))}
      </div>
      <div className="logo-card-sizes">
        {sizes.map(size => (
          <div key={size} className="logo-size-item">
            <div style={{ width: size, height: size }}>
              <Comp id={`${prefix}-sz${size}`} />
            </div>
            <span className="logo-size-label">{size}px</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function GmailSidebarMock() {
  return (
    <div className="gmail-mock-section">
      <h2>Gmail Sidebar Preview</h2>
      <p>How each logo looks as a 20px icon inside Gmail&apos;s gray circle sidebar buttons.</p>
      <div className="gmail-mock-container">
        {variants.map((v, i) => {
          const Comp = v.component
          return (
            <div key={v.name} className="gmail-mock-item">
              <div className="gmail-mock-circle">
                <Comp id={`gmail-v${i + 1}`} />
              </div>
              <span className="gmail-mock-label">{v.name}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SizeComparison() {
  const sizes = [16, 32, 48, 128] as const
  return (
    <div className="size-comparison-section">
      <h2>Size Comparison</h2>
      {variants.map((v, i) => {
        const Comp = v.component
        return (
          <div key={v.name} className="size-comparison-row">
            <span className="size-comparison-name">{v.name}</span>
            <div className="size-comparison-sizes">
              {sizes.map(size => (
                <div key={size} className="size-comparison-cell">
                  <div style={{ width: size, height: size }}>
                    <Comp id={`cmp-v${i + 1}-${size}`} />
                  </div>
                  <span className="logo-size-label">{size}px</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function FinalLogoSection() {
  const sizes = [16, 32, 48, 128] as const
  return (
    <div className="logo-final-section">
      <h2 className="logo-final-title">Final Logo</h2>
      <p className="logo-final-subtitle">V19 (standalone) and V20 (squircle) — the chosen Darkly brand marks.</p>
      <div className="logo-final-pair">
        <div className="logo-final-card">
          <div className="logo-final-label">V19 — Standalone</div>
          <div className="logo-final-swatches">
            {SWATCHES.map(s => (
              <div key={s.key} className={`logo-swatch logo-swatch--lg ${s.cls}`}>
                <DualSparkleDeep id={`final-v19-${s.key}`} />
              </div>
            ))}
          </div>
          <div className="logo-final-sizes">
            {sizes.map(size => (
              <div key={size} className="logo-size-item">
                <div style={{ width: size, height: size }}>
                  <DualSparkleDeep id={`final-v19-sz${size}`} />
                </div>
                <span className="logo-size-label">{size}px</span>
              </div>
            ))}
          </div>
        </div>
        <div className="logo-final-card">
          <div className="logo-final-label">V20 — Squircle</div>
          <div className="logo-final-swatches">
            {SWATCHES.map(s => (
              <div key={s.key} className={`logo-swatch logo-swatch--lg ${s.cls}`}>
                <DualSparkleDeepSquircle id={`final-v20-${s.key}`} />
              </div>
            ))}
          </div>
          <div className="logo-final-sizes">
            {sizes.map(size => (
              <div key={size} className="logo-size-item">
                <div style={{ width: size, height: size }}>
                  <DualSparkleDeepSquircle id={`final-v20-sz${size}`} />
                </div>
                <span className="logo-size-label">{size}px</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="logo-final-wordmark">
        <div className="logo-final-label">Wordmark</div>
        <div className="logo-wordmark-grid">
          {SWATCHES.map(s => (
            <div key={s.key} className={`logo-wordmark-swatch ${s.cls}`}>
              <span className="logo-wordmark">
                <span className="logo-wordmark-d">
                  <DualSparkleDeep id={`wm-${s.key}`} />
                </span>
                <span className="logo-wordmark-text">arkly</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function UppercaseDSection() {
  const sizes = [16, 32, 48, 128] as const
  return (
    <div className="logo-final-section" style={{ marginTop: '3rem' }}>
      <h2 className="logo-final-title">Uppercase D Exploration</h2>
      <p className="logo-final-subtitle">
        Capital &ldquo;D&rdquo; using real typeface outlines with crescent moon as negative space.
        3 serif (Times New Roman, Georgia, Big Caslon) + 3 sans-serif (Arial, Arial Narrow, Arial Rounded).
      </p>
      {UPPER_D_VARIANTS.map((v, i) => {
        const num = 21 + i
        return (
          <div key={v.name} style={{ marginBottom: '3rem' }}>
            <div className="logo-final-pair">
              <div className="logo-final-card">
                <div className="logo-final-label">V{num} — {v.name} (Standalone)</div>
                <div className="logo-card-desc">{v.description}</div>
                <div className="logo-card-note">{v.note}</div>
                <div className="logo-final-swatches">
                  {SWATCHES.map(s => (
                    <div key={s.key} className={`logo-swatch logo-swatch--lg ${s.cls}`}>
                      <UpperDStandalone id={`ud${num}-${s.key}`} config={v.config} />
                    </div>
                  ))}
                </div>
                <div className="logo-final-sizes">
                  {sizes.map(size => (
                    <div key={size} className="logo-size-item">
                      <div style={{ width: size, height: size }}>
                        <UpperDStandalone id={`ud${num}-sz${size}`} config={v.config} />
                      </div>
                      <span className="logo-size-label">{size}px</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="logo-final-card">
                <div className="logo-final-label">V{num} — {v.name} (Squircle)</div>
                <div className="logo-final-swatches">
                  {SWATCHES.map(s => (
                    <div key={s.key} className={`logo-swatch logo-swatch--lg ${s.cls}`}>
                      <UpperDSquircleFrame id={`uds${num}-${s.key}`} config={v.config} />
                    </div>
                  ))}
                </div>
                <div className="logo-final-sizes">
                  {sizes.map(size => (
                    <div key={size} className="logo-size-item">
                      <div style={{ width: size, height: size }}>
                        <UpperDSquircleFrame id={`uds${num}-sz${size}`} config={v.config} />
                      </div>
                      <span className="logo-size-label">{size}px</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="logo-final-wordmark">
              <div className="logo-final-label">Wordmark</div>
              <div className="logo-wordmark-grid">
                {SWATCHES.map(s => (
                  <div key={s.key} className={`logo-wordmark-swatch ${s.cls}`}>
                    <span className="logo-wordmark">
                      <span className="logo-wordmark-d" style={{ left: 0, top: '4px', marginRight: '-0.35rem' }}>
                        <UpperDStandalone id={`udwm${num}-${s.key}`} config={v.config} />
                      </span>
                      <span className="logo-wordmark-text">arkly</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Page Export ──────────────────────────────────────────────

export function LogoDesignPage({
  navLinks,
  navCta,
  footerLinks,
  copyrightName,
  trademarkText,
  brandLabel,
  children,
}: LogoDesignPageProps) {
  return (
    <>
      <Nav brandLabel={brandLabel} links={navLinks} cta={navCta} />
      <section className="logo-explorer">
        <div className="container">
          <Link to="/" className="privacy-back">
            <ChevronLeft size={16} />
            Back to home
          </Link>
          <div className="logo-explorer-header">
            <h1 className="section-title">Logo Exploration</h1>
            <p className="section-subtitle">Brand mark concepts for Darkly — comparing lowercase and uppercase letterforms.</p>
          </div>

          <FinalLogoSection />

          <div className="logo-final-section">
            <h2 className="logo-final-title">Marketing Tile</h2>
            <p className="logo-final-subtitle">Chrome Web Store promotional image (440x280) — appears in search results and featured sections.</p>
            <div className="marketing-tile-section">
              <h3>Gmail</h3>
              <p>440 x 280 — Dark background, logo, tagline.</p>
              <div className="marketing-tile-wrapper">
                <PromoTile tagline="Dark mode for Gmail" />
              </div>
            </div>
          </div>

          {children}

          <UppercaseDSection />

          <div className="logo-final-section" style={{ marginTop: '4rem' }}>
            <h2 className="logo-final-title">Lowercase d Exploration</h2>
            <p className="logo-final-subtitle">
              Lowercase &ldquo;d&rdquo; with crescent moon hugging the left curve — 20 concepts.
              Variants 9–12 add a star. Variants 13–20 add dual sparkles with standalone + squircle pairs.
            </p>
          </div>
          <div className="logo-grid">
            {variants.map((v, i) => (
              <LogoCard key={v.name} variant={v} index={i} />
            ))}
          </div>
          <GmailSidebarMock />
          <SizeComparison />
        </div>
      </section>
      <Footer brandLabel={brandLabel} links={footerLinks} copyrightName={copyrightName} trademarkText={trademarkText} />
    </>
  )
}
