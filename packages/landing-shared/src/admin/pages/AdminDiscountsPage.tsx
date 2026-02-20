import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Copy, Check, Send, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { ShareCodeModal } from '../components/ShareCodeModal.tsx'
import { EditCodeModal } from '../components/EditCodeModal.tsx'
import { PRODUCTS, PRODUCT_LABELS } from '../constants.ts'

interface DiscountCode {
  id: string
  code: string
  active: boolean
  discount_type: 'percent' | 'fixed'
  discount_value: number
  product: string | null
  max_redemptions: number | null
  times_redeemed: number
  expires_at: string | null
  created_at: string
}

interface CodesResponse {
  codes: DiscountCode[]
  total: number
  page: number
  limit: number
}

export function AdminDiscountsPage() {
  const [data, setData] = useState<CodesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [shareCode, setShareCode] = useState<DiscountCode | null>(null)
  const [editCode, setEditCode] = useState<DiscountCode | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [productFilter, setProductFilter] = useState('')
  const [page, setPage] = useState(1)

  // Form state
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<'free' | 'percent' | 'fixed'>('free')
  const [discountValue, setDiscountValue] = useState('')
  const [productScope, setProductScope] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [maxUses, setMaxUses] = useState('1')

  const fetchCodes = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    if (productFilter) params.set('product', productFilter)
    params.set('page', page.toString())

    const res = await fetch(`/api/admin/discount-codes?${params}`, { credentials: 'same-origin' })
    if (res.ok) {
      setData(await res.json())
    }
    setLoading(false)
  }, [search, statusFilter, productFilter, page])

  useEffect(() => {
    fetchCodes()
  }, [fetchCodes])

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0

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
    if (maxUses) body.max_uses = parseInt(maxUses, 10)

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
      setMaxUses('1')
      setShowForm(false)
      fetchCodes()
    } else {
      const d = await res.json()
      setError(d.error || 'Failed to create code')
    }
    setCreating(false)
  }

  async function handleToggleActive(dc: DiscountCode) {
    const res = await fetch(`/api/admin/discount-codes?id=${dc.id}`, {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !dc.active }),
    })
    if (res.ok) fetchCodes()
  }

  async function handleEditSave(id: string, patch: { product?: string }) {
    const res = await fetch(`/api/admin/discount-codes?id=${id}`, {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (!res.ok) {
      const d = await res.json()
      throw new Error(d.error || 'Failed to update')
    }
    fetchCodes()
  }

  async function handleDelete(dc: DiscountCode) {
    if (!confirm(`Deactivate code ${dc.code}? (Stripe promo codes cannot be deleted)`)) return
    const res = await fetch(`/api/admin/discount-codes?id=${dc.id}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    })
    if (res.ok) fetchCodes()
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
              Code (optional — random code will be generated if left empty)
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. LAUNCH50"
                className="admin-input"
              />
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
          <div className="admin-form-row">
            <label>
              Product Scope
              <select
                value={productScope}
                onChange={(e) => setProductScope(e.target.value)}
                className="admin-select"
              >
                <option value="">All products</option>
                {PRODUCTS.map((p) => (
                  <option key={p} value={p}>{PRODUCT_LABELS[p]}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="admin-form-row admin-form-row--inline">
            <label>
              Expiration (optional)
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
          <button type="submit" className="admin-btn-primary" disabled={creating}>
            {creating ? 'Creating...' : 'Create Discount Code'}
          </button>
        </form>
      )}

      <div className="admin-filters">
        <input
          type="text"
          placeholder="Search by code..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="admin-search"
        />
        <select value={productFilter} onChange={(e) => { setProductFilter(e.target.value); setPage(1) }} className="admin-select">
          <option value="">All products</option>
          {PRODUCTS.map((p) => (
            <option key={p} value={p}>{PRODUCT_LABELS[p]}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="admin-select">
          <option value="">All statuses</option>
          <option value="available">Available</option>
          <option value="used">Used</option>
          <option value="exhausted">Exhausted</option>
          <option value="expired">Expired</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <div className="admin-table-loading">Loading...</div>
      ) : !data || data.codes.length === 0 ? (
        <div className="admin-empty">No discount codes found.</div>
      ) : (
        <>
          <div className="admin-table-info">{data.total} total codes</div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Usage</th>
                  <th>Expires</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.codes.map((dc) => (
                  <tr key={dc.id} className={dc.active ? '' : 'admin-row-inactive'}>
                    <td className="admin-code-cell">{dc.code}</td>
                    <td>{formatDiscount(dc)}</td>
                    <td>{dc.product ? PRODUCT_LABELS[dc.product] ?? dc.product : 'All'}</td>
                    <td>
                      <span className={`badge badge--${getCodeStatus(dc)}`}>
                        {getCodeStatus(dc)}
                      </span>
                    </td>
                    <td>{renderUsage(dc)}</td>
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
                        <button
                          className={`admin-icon-btn ${dc.active ? 'admin-icon-btn--active' : ''}`}
                          onClick={() => handleToggleActive(dc)}
                          title={dc.active ? 'Deactivate' : 'Activate'}
                          aria-label={dc.active ? 'Deactivate' : 'Activate'}
                        >
                          {dc.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>
                        <button
                          className="admin-icon-btn"
                          onClick={() => setEditCode(dc)}
                          title="Edit product scope"
                          aria-label="Edit product scope"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="admin-icon-btn admin-icon-btn--danger"
                          onClick={() => handleDelete(dc)}
                          title="Deactivate code"
                          aria-label="Deactivate code"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="admin-pagination">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
              <span>Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}

      <ShareCodeModal
        open={shareCode !== null}
        onClose={() => setShareCode(null)}
        code={shareCode?.code ?? ''}
        discount={shareCode ? formatDiscount(shareCode) : ''}
        product={shareCode?.product ?? null}
        expiresAt={shareCode?.expires_at ?? null}
      />

      <EditCodeModal
        open={editCode !== null}
        onClose={() => setEditCode(null)}
        onSave={handleEditSave}
        code={editCode}
      />
    </div>
  )
}

function getCodeStatus(dc: DiscountCode): string {
  if (!dc.active) return 'inactive'
  if (dc.max_redemptions != null && dc.times_redeemed >= dc.max_redemptions) return 'exhausted'
  if (dc.expires_at && new Date(dc.expires_at) < new Date()) return 'expired'
  if (dc.times_redeemed > 0) return 'used'
  return 'available'
}

function renderUsage(dc: DiscountCode): string {
  if (dc.max_redemptions != null) return `${dc.times_redeemed}/${dc.max_redemptions}`
  return dc.times_redeemed > 0 ? `${dc.times_redeemed} used` : '--'
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
