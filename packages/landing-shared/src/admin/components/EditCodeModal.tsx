import { useState, type FormEvent } from 'react'
import { AdminModal } from './AdminModal.tsx'

const PRODUCTS = ['gmail', 'sheets', 'docs', 'suite'] as const

const PRODUCT_LABELS: Record<string, string> = {
  gmail: 'Darkly for Gmail',
  sheets: 'Darkly for Sheets',
  docs: 'Darkly for Docs',
  suite: 'Darkly Suite',
}

interface EditCodeModalProps {
  open: boolean
  onClose: () => void
  onSave: (id: string, patch: { product?: string }) => Promise<void>
  code: { id: string; code: string; product: string | null } | null
}

export function EditCodeModal({ open, onClose, onSave, code }: EditCodeModalProps) {
  const [product, setProduct] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Reset form when code changes
  const [prevId, setPrevId] = useState<string | null>(null)
  if (code && code.id !== prevId) {
    setPrevId(code.id)
    setProduct(code.product ?? '')
    setError('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!code) return
    setSaving(true)
    setError('')

    try {
      await onSave(code.id, { product: product || undefined })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminModal open={open} onClose={onClose} title={`Edit ${code?.code ?? 'Code'}`}>
      <form onSubmit={handleSubmit}>
        {error && <div className="admin-form-error">{error}</div>}

        <div className="admin-form-row">
          <label>Product Scope</label>
          <select
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            className="admin-select"
          >
            <option value="">All products</option>
            {PRODUCTS.map((p) => (
              <option key={p} value={p}>{PRODUCT_LABELS[p]}</option>
            ))}
          </select>
        </div>

        <div className="admin-share-actions">
          <button type="button" className="admin-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="admin-btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </AdminModal>
  )
}
