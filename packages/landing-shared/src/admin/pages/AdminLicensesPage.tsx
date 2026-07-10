import { useCallback, useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil } from 'lucide-react'
import { LicenseDetailModal } from '../components/LicenseDetailModal'
import { AdminToast } from '../components/AdminToast'

interface License {
  id: number
  email: string | null
  product: string
  plan: string
  status: string
  created_at: string
  expires_at: string | null
  stripe_subscription_id: string | null
  discount_code: string | null
}

interface LicensesResponse {
  licenses: License[]
  total: number
  page: number
  limit: number
}

interface Toast {
  message: string
  type: 'success' | 'error'
}

export function AdminLicensesPage() {
  const [data, setData] = useState<LicensesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [plan, setPlan] = useState('')
  const [product, setProduct] = useState('')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<'created_at' | 'email'>('created_at')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [detailLicense, setDetailLicense] = useState<License | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)

  const fetchLicenses = useCallback(async () => {
    setLoading(true)
    // POST with a JSON body — the search term is routinely a customer email
    // and must never travel in a GET query string (#670).
    const res = await fetch('/api/admin/licenses', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ search, status, plan, product, sort, order, page }),
    })
    if (res.ok) {
      setData(await res.json())
    }
    setLoading(false)
  }, [search, status, plan, product, sort, order, page])

  useEffect(() => {
    fetchLicenses()
  }, [fetchLicenses])

  const handleSort = (column: 'created_at' | 'email') => {
    if (sort === column) {
      setOrder(order === 'asc' ? 'desc' : 'asc')
    } else {
      setSort(column)
      setOrder(column === 'email' ? 'asc' : 'desc')
    }
    setPage(1)
  }

  function SortIcon({ column }: { column: 'created_at' | 'email' }) {
    if (sort !== column) return <ArrowUpDown size={14} />
    return order === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
  }

  const handleDetailAction = (message?: string) => {
    setToast({ message: message ?? 'Action completed successfully', type: 'success' })
    fetchLicenses()
  }

  const handleDetailClose = () => {
    setDetailLicense(null)
  }

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0

  return (
    <div className="admin-page">
      <h2>Memberships</h2>
      <div className="admin-filters">
        <input
          type="text"
          placeholder="Search by email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="admin-search"
        />
        <select value={product} onChange={(e) => { setProduct(e.target.value); setPage(1) }} className="admin-select">
          <option value="">All products</option>
          <option value="gmail">Gmail</option>
          <option value="sheets">Sheets</option>
          <option value="docs">Docs</option>
          <option value="suite">Suite</option>
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="admin-select">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select value={plan} onChange={(e) => { setPlan(e.target.value); setPage(1) }} className="admin-select">
          <option value="">All plans</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
          <option value="lifetime">Lifetime</option>
        </select>
      </div>

      {loading ? (
        <div className="admin-table-loading">Loading...</div>
      ) : !data || data.licenses.length === 0 ? (
        <div className="admin-empty">No memberships found.</div>
      ) : (
        <>
          <div className="admin-table-info">{data.total} total memberships</div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className={`admin-th-sortable${sort === 'email' ? ' admin-th-sorted' : ''}`} onClick={() => handleSort('email')}>
                    Email <SortIcon column="email" />
                  </th>
                  <th>Product</th>
                  <th>Plan</th>
                  <th>Access</th>
                  <th>Subscription</th>
                  <th className={`admin-th-sortable${sort === 'created_at' ? ' admin-th-sorted' : ''}`} onClick={() => handleSort('created_at')}>
                    Signed Up <SortIcon column="created_at" />
                  </th>
                  <th>Discount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.licenses.map((license) => (
                  <tr key={license.id}>
                    <td>{license.email ?? '(no email)'}</td>
                    <td><span className={`badge badge--${license.product}`}>{license.product}</span></td>
                    <td><span className={`badge badge--${license.plan}`}>{license.plan}</span></td>
                    <td><span className={`badge badge--${license.status}`}>{license.status}</span></td>
                    <td>
                      {license.stripe_subscription_id
                        ? <span className="badge badge--subscription">subscription</span>
                        : <span className="admin-detail-muted">none</span>}
                    </td>
                    <td>{formatDate(license.created_at)}</td>
                    <td>{license.discount_code ?? '--'}</td>
                    <td>
                      <button
                        className="admin-icon-btn"
                        title="Edit membership"
                        onClick={() => setDetailLicense(license)}
                      >
                        <Pencil size={16} />
                      </button>
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

      <LicenseDetailModal
        open={!!detailLicense}
        license={detailLicense}
        onClose={handleDetailClose}
        onAction={handleDetailAction}
      />

      {toast && (
        <AdminToast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(-2)
  return `${mm}/${dd}/${yy}`
}
