import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Copy, Check, Send } from 'lucide-react'
import { ShareCodeModal } from '../components/ShareCodeModal.tsx'

interface DiscountCode {
  id: number
  code: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  product: string | null
  used_by_email: string | null
  used_at: string | null
  expires_at: string | null
  created_at: string
}

export function AdminDiscountsPage() {
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [shareCode, setShareCode] = useState<DiscountCode | null>(null)

  // Form state
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<'free' | 'percent' | 'fixed'>('free')
  const [discountValue, setDiscountValue] = useState('')
  const [productScope, setProductScope] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  const fetchCodes = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/discount-codes', { credentials: 'same-origin' })
    if (res.ok) {
      const data = await res.json()
      setCodes(data.codes)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCodes()
  }, [fetchCodes])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setError('')
    setCreating(true)

    const isFree = discountType === 'free'
    const body: Record<string, unknown> = {
      discount_type: isFree ? 'percent' : discountType,
      discount_value: isFree ? 100 : parseInt(discountValue, 10),
    }
    if (code.trim()) body.code = code.trim().toUpperCase()
    if (productScope) body.product = productScope
    if (expiresAt) body.expires_at = new Date(expiresAt).toISOString()

    const res = await fetch('/api/admin/discount-codes', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      setCode('')
      setDiscountValue('')
      setProductScope('')
      setExpiresAt('')
      setShowForm(false)
      fetchCodes()
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to create code')
    }
    setCreating(false)
  }

  async function copyToClipboard(dc: DiscountCode) {
    await navigator.clipboard.writeText(dc.code)
    setCopiedId(dc.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2>Discount Codes</h2>
        <button className="admin-btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Create Code'}
        </button>
      </div>

      {showForm && (
        <form className="admin-create-form" onSubmit={handleCreate}>
          {error && <div className="admin-form-error">{error}</div>}
          <div className="admin-form-row">
            <label>
              Code (optional -- auto-generated if blank)
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                placeholder="e.g. LAUNCH50"
                className="admin-input"
                maxLength={500}
              />
              <span className="admin-form-hint">Letters, numbers, and dashes only</span>
            </label>
          </div>
          <div className="admin-form-row admin-form-row--inline">
            <label>
              Type
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value as 'free' | 'percent' | 'fixed')} className="admin-select">
                <option value="free">Free membership</option>
                <option value="percent">Percent off</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </label>
            <label>
              Value
              <input
                type="number"
                min="1"
                max={discountType === 'percent' ? '100' : undefined}
                value={discountType === 'free' ? '100' : discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === 'percent' ? '50' : '5'}
                required={discountType !== 'free'}
                disabled={discountType === 'free'}
                className="admin-input"
              />
            </label>
          </div>
          <div className="admin-form-row admin-form-row--inline">
            <label>
              Product Scope (optional)
              <select value={productScope} onChange={(e) => setProductScope(e.target.value)} className="admin-select">
                <option value="">All products</option>
                <option value="gmail">Gmail</option>
                <option value="sheets">Sheets</option>
                <option value="docs">Docs</option>
                <option value="suite">Suite</option>
              </select>
            </label>
            <label>
              Expiration (optional)
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="admin-input"
              />
            </label>
          </div>
          <button type="submit" className="admin-btn-primary" disabled={creating}>
            {creating ? 'Creating...' : 'Create Discount Code'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="admin-table-loading">Loading...</div>
      ) : codes.length === 0 ? (
        <div className="admin-empty">No discount codes yet.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Product</th>
                <th>Status</th>
                <th>Used By</th>
                <th>Expires</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((dc) => (
                <tr key={dc.id}>
                  <td className="admin-code-cell">{dc.code}</td>
                  <td>{formatDiscount(dc)}</td>
                  <td>{dc.product ?? 'All'}</td>
                  <td>
                    <span className={`badge badge--${getCodeStatus(dc)}`}>
                      {getCodeStatus(dc)}
                    </span>
                  </td>
                  <td>{dc.used_by_email ?? '--'}</td>
                  <td>{dc.expires_at ? formatDate(dc.expires_at) : 'Never'}</td>
                  <td>{formatDate(dc.created_at)}</td>
                  <td>
                    <div className="admin-actions-cell">
                      <button
                        className="admin-icon-btn"
                        onClick={() => copyToClipboard(dc)}
                        title="Copy code"
                        aria-label="Copy code"
                      >
                        {copiedId === dc.id ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                      {getCodeStatus(dc) === 'available' && (
                        <button
                          className="admin-icon-btn"
                          onClick={() => setShareCode(dc)}
                          title="Share code"
                          aria-label="Share code"
                        >
                          <Send size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ShareCodeModal
        open={shareCode !== null}
        onClose={() => setShareCode(null)}
        code={shareCode?.code ?? ''}
        discount={shareCode ? formatDiscount(shareCode) : ''}
        expiresAt={shareCode?.expires_at ?? null}
      />
    </div>
  )
}

function getCodeStatus(code: DiscountCode): string {
  if (code.used_at) return 'used'
  if (code.expires_at && new Date(code.expires_at) < new Date()) return 'expired'
  return 'available'
}

function formatDiscount(dc: DiscountCode): string {
  if (dc.discount_type === 'percent' && dc.discount_value === 100) return 'Free'
  if (dc.discount_type === 'percent') return `${dc.discount_value}% off`
  return `$${dc.discount_value} off`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
