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
    const iconSize = Math.round(size * 0.52)
    const cardSize = iconSize
    const stepX = Math.round(size * 0.28)
    const stepY = Math.round(size * 0.18)
    const outerPad = 4
    const totalWidth = cardSize + stepX * 2 + outerPad * 2
    const totalHeight = cardSize + stepY * 2 + outerPad * 2
    return (
      <span className="suite-icon-fan" style={{ width: totalWidth, height: totalHeight }}>
        <span className="suite-icon-fan-card" style={{ width: cardSize, height: cardSize, left: stepX * 2 + outerPad, top: stepY * 2 + outerPad, zIndex: 1 }}>
          <FileText size={iconSize} color="#4285f4" strokeWidth={1.8} />
        </span>
        <span className="suite-icon-fan-card" style={{ width: cardSize, height: cardSize, left: stepX + outerPad, top: stepY + outerPad, zIndex: 2 }}>
          <Table2 size={iconSize} color="#81c995" strokeWidth={1.8} />
        </span>
        <span className="suite-icon-fan-card" style={{ width: cardSize, height: cardSize, left: outerPad, top: outerPad, zIndex: 3 }}>
          <Mail size={iconSize} color="#ea4335" strokeWidth={1.8} />
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
