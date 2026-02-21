import { useCallback, useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal'
import { AdminToast } from '../components/AdminToast'

interface License {
  id: number
  email: string | null
  product: string
  plan: string
  status: string
  created_at: string
  expires_at: string | null
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
  const [deletingLicense, setDeletingLicense] = useState<License | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)

  const fetchLicenses = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    if (plan) params.set('plan', plan)
    if (product) params.set('product', product)
    params.set('page', page.toString())

    const res = await fetch(`/api/admin/licenses?${params}`, { credentials: 'same-origin' })
    if (res.ok) {
      setData(await res.json())
    }
    setLoading(false)
  }, [search, status, plan, product, page])

  useEffect(() => {
    fetchLicenses()
  }, [fetchLicenses])

  const handleDeleteClick = (license: License) => {
    setDeletingLicense(license)
  }

  const handleConfirmDelete = async () => {
    if (!deletingLicense) return

    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/admin/licenses?id=${deletingLicense.id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })

      if (res.ok) {
        setToast({ message: 'License deleted successfully', type: 'success' })
        setDeletingLicense(null)
        fetchLicenses()
      } else {
        const body = await res.json().catch(() => ({ error: 'Unknown error' })) as { error: string }
        setToast({ message: body.error || 'Failed to delete license', type: 'error' })
      }
    } catch {
      setToast({ message: 'Network error — please try again', type: 'error' })
    } finally {
      setDeleteLoading(false)
    }
  }

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0

  return (
    <div className="admin-page">
      <h2>Licenses</h2>
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
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
          <option value="past_due">Past Due</option>
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
        <div className="admin-empty">No licenses found.</div>
      ) : (
        <>
          <div className="admin-table-info">{data.total} total licenses</div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Product</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Signed Up</th>
                  <th>Expires</th>
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
                    <td>{formatDate(license.created_at)}</td>
                    <td>{license.expires_at ? formatDate(license.expires_at) : '--'}</td>
                    <td>{license.discount_code ?? '--'}</td>
                    <td>
                      <div className="admin-actions-cell">
                        <button
                          className="admin-icon-btn admin-icon-btn--danger"
                          title="Delete license"
                          onClick={() => handleDeleteClick(license)}
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

      <ConfirmDeleteModal
        open={!!deletingLicense}
        license={deletingLicense}
        loading={deleteLoading}
        onClose={() => setDeletingLicense(null)}
        onConfirm={handleConfirmDelete}
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
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
