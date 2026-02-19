import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Copy, Check, Send, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { ShareCodeModal } from '../components/ShareCodeModal.tsx'
import { EditCodeModal, type EditCodePatch, type EditableCode } from '../components/EditCodeModal.tsx'

const PRODUCTS = ['gmail', 'sheets', 'docs', 'suite'] as const

interface DiscountCode {
  id: number
  code: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  product: string | null
  active: number
  max_uses: number | null
  use_count: number
  used_by_email: string | null
  used_at: string | null
  expires_at: string | null
  created_at: string
  stripe_promo_code_id: string | null
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
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [shareCode, setShareCode] = useState<DiscountCode | null>(null)
  const [editCode, setEditCode] = useState<EditableCode | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [productFilter, setProductFilter] = useState('')
  const [page, setPage] = useState(1)

  // Form state
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<'free' | 'percent' | 'fixed'>('free')
  const [discountValue, setDiscountValue] = useState('')
  const [productScopes, setProductScopes] = useState<string[]>([])
  const [expiresAt, setExpiresAt] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [bulkCount, setBulkCount] = useState('')

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
    if (productScopes.length > 0) body.product = productScopes
    if (expiresAt) body.expires_at = new Date(expiresAt).toISOString()
    if (maxUses) body.max_uses = parseInt(maxUses, 10)
    if (bulkCount && parseInt(bulkCount, 10) > 1) body.count = parseInt(bulkCount, 10)

    const res = await fetch('/api/admin/discount-codes', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      setCode('')
      setDiscountValue('')
      setProductScopes([])
      setExpiresAt('')
      setMaxUses('')
      setBulkCount('')
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

  async function handleEditSave(id: number, patch: EditCodePatch) {
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
    if (!confirm(`Delete code ${dc.code}? This cannot be undone.`)) return
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

  function toggleProductScope(p: string) {
    setProductScopes((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    )
  }

  const bulkActive = parseInt(bulkCount, 10) > 1

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
          <div className="admin-form-row admin-form-row--inline">
            <label>
              Code {bulkActive ? '(auto-generated)' : '(optional)'}
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. LAUNCH50"
                className="admin-input"
                disabled={bulkActive}
              />
            </label>
            <label>
              Quantity
              <input
                type="number"
                min="1"
                max="100"
                value={bulkCount}
                onChange={(e) => { setBulkCount(e.target.value); if (parseInt(e.target.value, 10) > 1) setCode('') }}
                placeholder="1"
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
            <label>Product Scope</label>
            <div className="admin-checkbox-group">
              {PRODUCTS.map((p) => (
                <label key={p} className="admin-checkbox-label">
                  <input
                    type="checkbox"
                    checked={productScopes.includes(p)}
                    onChange={() => toggleProductScope(p)}
                  />
                  {p}
                </label>
              ))}
              <span className="admin-checkbox-hint">
                {productScopes.length === 0 ? 'All products' : ''}
              </span>
            </div>
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
                placeholder="Single use"
                className="admin-input"
              />
            </label>
          </div>
          <button type="submit" className="admin-btn-primary" disabled={creating}>
            {creating ? 'Creating...' : bulkActive ? `Create ${bulkCount} Codes` : 'Create Discount Code'}
          </button>
        </form>
      )}

      <div className="admin-filters">
        <input
          type="text"
          placeholder="Search by code or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="admin-search"
        />
        <select value={productFilter} onChange={(e) => { setProductFilter(e.target.value); setPage(1) }} className="admin-select">
          <option value="">All products</option>
          <option value="gmail">Gmail</option>
          <option value="sheets">Sheets</option>
          <option value="docs">Docs</option>
          <option value="suite">Suite</option>
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
                    <td>{renderProduct(dc.product)}</td>
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
                          title="Edit code"
                          aria-label="Edit code"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="admin-icon-btn admin-icon-btn--danger"
                          onClick={() => handleDelete(dc)}
                          title="Delete code"
                          aria-label="Delete code"
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
  if (dc.max_uses != null && dc.use_count >= dc.max_uses) return 'exhausted'
  if (dc.max_uses == null && dc.used_at) return 'used'
  if (dc.expires_at && new Date(dc.expires_at) < new Date()) return 'expired'
  return 'available'
}

function renderUsage(dc: DiscountCode): string {
  if (dc.max_uses != null) return `${dc.use_count}/${dc.max_uses}`
  return dc.used_at ? '1 used' : '--'
}

function renderProduct(product: string | null): string {
  if (!product) return 'All'
  try {
    const parsed = JSON.parse(product)
    if (Array.isArray(parsed)) return parsed.join(', ')
  } catch { /* not JSON */ }
  return product
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
