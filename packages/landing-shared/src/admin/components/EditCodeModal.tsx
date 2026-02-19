import { useState, type FormEvent } from 'react'
import { AdminModal } from './AdminModal.tsx'

const PRODUCTS = ['gmail', 'sheets', 'docs', 'suite'] as const

interface EditCodeModalProps {
  open: boolean
  onClose: () => void
  onSave: (id: number, patch: EditCodePatch) => Promise<void>
  code: EditableCode | null
}

export interface EditableCode {
  id: number
  code: string
  product: string | null
  expires_at: string | null
  max_uses: number | null
  active: number
}

export interface EditCodePatch {
  active?: boolean
  expires_at?: string | null
  product?: string[]
  max_uses?: number | null
}

function parseProducts(product: string | null): string[] {
  if (!product) return []
  try {
    const parsed = JSON.parse(product)
    if (Array.isArray(parsed)) return parsed
  } catch { /* not JSON */ }
  return [product]
}

function toDateInputValue(iso: string | null): string {
  if (!iso) return ''
  return iso.slice(0, 10)
}

export function EditCodeModal({ open, onClose, onSave, code }: EditCodeModalProps) {
  const [products, setProducts] = useState<string[]>([])
  const [expiresAt, setExpiresAt] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Reset form when code changes
  const [prevId, setPrevId] = useState<number | null>(null)
  if (code && code.id !== prevId) {
    setPrevId(code.id)
    setProducts(parseProducts(code.product))
    setExpiresAt(toDateInputValue(code.expires_at))
    setMaxUses(code.max_uses != null ? code.max_uses.toString() : '')
    setError('')
  }

  function toggleProduct(p: string) {
    setProducts((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!code) return
    setSaving(true)
    setError('')

    const patch: EditCodePatch = {
      product: products,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      max_uses: maxUses ? parseInt(maxUses, 10) : null,
    }

    try {
      await onSave(code.id, patch)
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
          <div className="admin-checkbox-group">
            {PRODUCTS.map((p) => (
              <label key={p} className="admin-checkbox-label">
                <input
                  type="checkbox"
                  checked={products.includes(p)}
                  onChange={() => toggleProduct(p)}
                />
                {p}
              </label>
            ))}
          </div>
        </div>

        <div className="admin-form-row admin-form-row--inline">
          <label>
            Expiration
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="admin-input"
            />
          </label>
          <label>
            Max Uses
            <input
              type="number"
              min="1"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="Unlimited"
              className="admin-input"
            />
          </label>
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
