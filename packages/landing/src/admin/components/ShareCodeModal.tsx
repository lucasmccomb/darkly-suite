import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { AdminModal } from './AdminModal.tsx'

interface ShareCodeModalProps {
  open: boolean
  onClose: () => void
  code: string
  discount: string
  expiresAt: string | null
}

export function ShareCodeModal({ open, onClose, code, discount, expiresAt }: ShareCodeModalProps) {
  const [copied, setCopied] = useState(false)

  const shareText = buildShareText(code, discount, expiresAt)

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

function buildShareText(code: string, discount: string, expiresAt: string | null): string {
  const discountPhrase = discount === 'Free' ? 'a free membership' : discount.toLowerCase()
  const timeFrame = expiresAt ? `, valid until ${formatDate(expiresAt)}` : ''
  return `Here's a discount code for Darkly Suite that gives you ${discountPhrase}${timeFrame}: ${code}\n\nCheck it out here: darklysuite.com`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
