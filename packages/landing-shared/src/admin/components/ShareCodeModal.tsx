import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { AdminModal } from './AdminModal.tsx'

const PRODUCT_NAMES: Record<string, string> = {
  gmail: 'Darkly for Gmail',
  sheets: 'Darkly for Sheets',
  docs: 'Darkly for Docs',
  suite: 'Darkly Suite',
}

const PRODUCT_URLS: Record<string, string> = {
  gmail: 'gmaildarkly.com',
}

interface ShareCodeModalProps {
  open: boolean
  onClose: () => void
  code: string
  discount: string
  product: string | null
  expiresAt: string | null
}

export function ShareCodeModal({ open, onClose, code, discount, product, expiresAt }: ShareCodeModalProps) {
  const [copied, setCopied] = useState(false)

  const shareText = buildShareText(code, discount, product, expiresAt)

  async function handleCopy() {
    await navigator.clipboard.writeText(shareText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleClose() {
    setCopied(false)
    onClose()
  }

  return (
    <AdminModal open={open} onClose={handleClose} title="Share Code">
      <div className="admin-share-text-preview">{shareText}</div>
      <div className="admin-share-actions">
        <button className="admin-btn-secondary" onClick={handleClose}>
          Cancel
        </button>
        <button className={`admin-btn-primary admin-btn-icon${copied ? ' admin-btn-copied' : ''}`} onClick={handleCopy}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </AdminModal>
  )
}

function buildShareText(code: string, discount: string, product: string | null, expiresAt: string | null): string {
  const productName = product ? (PRODUCT_NAMES[product] ?? 'Darkly Suite') : 'Darkly Suite'
  const url = product ? (PRODUCT_URLS[product] ?? 'darklysuite.com') : 'darklysuite.com'
  const discountPhrase = discount === 'Free' ? 'a free membership' : discount.toLowerCase()
  const timeFrame = expiresAt ? `, valid until ${formatDate(expiresAt)}` : ''
  return `Here's a discount code for ${productName} that gives you ${discountPhrase}${timeFrame}: ${code}\n\nCheck it out here: ${url}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
