import { Mail, Table2, FileText } from 'lucide-react'

interface SuiteIconProps {
  size?: number
}

/**
 * Darkly Suite logo: Mail, Sheets, and Docs icons
 * side-by-side in a golden pill border.
 */
export function SuiteIcon({ size = 22 }: SuiteIconProps) {
  return (
    <span className="suite-icon-pill">
      <Mail size={size} color="#ea4335" strokeWidth={1.8} />
      <Table2 size={size} color="#81c995" strokeWidth={1.8} />
      <FileText size={size} color="#4285f4" strokeWidth={1.8} />
    </span>
  )
}
