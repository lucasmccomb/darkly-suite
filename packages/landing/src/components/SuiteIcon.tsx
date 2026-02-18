import { Mail, Table2, FileText } from 'lucide-react'

interface SuiteIconProps {
  size?: number
  variant?: 'pill' | 'fan'
}

/**
 * Darkly Suite logo.
 * - "pill": three icons side-by-side in a golden pill (product cards, pricing cards)
 * - "fan": three icons fanned like cards in a golden squircle (comparison table)
 */
export function SuiteIcon({ size = 22, variant = 'pill' }: SuiteIconProps) {
  if (variant === 'fan') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        {/* Golden squircle */}
        <rect x="1.5" y="1.5" width="29" height="29" rx="7" stroke="#f5c842" strokeWidth="1.8" fill="#1a1a2e" />

        {/* Mail — back left, fanned left */}
        <g transform="rotate(-15, 16, 22)">
          <rect x="9" y="12" width="14" height="11" rx="1.5" fill="#1a1a2e" stroke="#ea4335" strokeWidth="1.3" />
          <polyline points="9,12 16,17.5 23,12" stroke="#ea4335" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* Sheets — middle, straight */}
        <g>
          <rect x="9" y="12" width="14" height="11" rx="1.5" fill="#1a1a2e" stroke="#81c995" strokeWidth="1.3" />
          <line x1="9" y1="17.5" x2="23" y2="17.5" stroke="#81c995" strokeWidth="0.9" opacity="0.7" />
          <line x1="16" y1="12" x2="16" y2="23" stroke="#81c995" strokeWidth="0.9" opacity="0.7" />
        </g>

        {/* Docs — front right, fanned right */}
        <g transform="rotate(15, 16, 22)">
          <rect x="9" y="12" width="14" height="11" rx="1.5" fill="#1a1a2e" stroke="#4285f4" strokeWidth="1.3" />
          <line x1="12" y1="16" x2="19" y2="16" stroke="#4285f4" strokeWidth="0.9" strokeLinecap="round" opacity="0.7" />
          <line x1="12" y1="19" x2="17" y2="19" stroke="#4285f4" strokeWidth="0.9" strokeLinecap="round" opacity="0.7" />
        </g>
      </svg>
    )
  }

  return (
    <span className="suite-icon-pill">
      <Mail size={size} color="#ea4335" strokeWidth={1.8} />
      <Table2 size={size} color="#81c995" strokeWidth={1.8} />
      <FileText size={size} color="#4285f4" strokeWidth={1.8} />
    </span>
  )
}
