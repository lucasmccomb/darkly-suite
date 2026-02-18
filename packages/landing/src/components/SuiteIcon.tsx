import { Mail, Table2, FileText } from 'lucide-react'

interface SuiteIconProps {
  size?: number
  variant?: 'pill' | 'fan'
}

/**
 * Darkly Suite logo.
 * - "pill": three icons side-by-side in a golden pill (product cards, pricing cards)
 * - "fan": three Lucide icons fanned like cards in a golden squircle (comparison table)
 */
export function SuiteIcon({ size = 22, variant = 'pill' }: SuiteIconProps) {
  if (variant === 'fan') {
    const iconSize = Math.round(size * 0.55)
    return (
      <span className="suite-icon-fan" style={{ width: size, height: size }}>
        <span className="suite-icon-fan-card suite-icon-fan-card--left">
          <Mail size={iconSize} color="#ea4335" strokeWidth={1.8} />
        </span>
        <span className="suite-icon-fan-card suite-icon-fan-card--center">
          <Table2 size={iconSize} color="#81c995" strokeWidth={1.8} />
        </span>
        <span className="suite-icon-fan-card suite-icon-fan-card--right">
          <FileText size={iconSize} color="#4285f4" strokeWidth={1.8} />
        </span>
      </span>
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
