import { useCallback, useEffect, useState } from 'react'

interface ProductStats {
  product: string
  total: number
  active: number
  cancelled: number
  expired: number
  past_due: number
  monthly: number
  yearly: number
  lifetime: number
}

interface StatsResponse {
  byProduct: ProductStats[]
  totals: Omit<ProductStats, 'product'>
  recentSignups: Array<{ product: string; count: number }>
}

export function AdminStatsPage() {
  const [data, setData] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/stats', { credentials: 'same-origin' })
    if (res.ok) {
      setData(await res.json())
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  if (loading) {
    return (
      <div className="admin-page">
        <h2>Stats</h2>
        <div className="admin-table-loading">Loading...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="admin-page">
        <h2>Stats</h2>
        <div className="admin-empty">Failed to load stats.</div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <h2>Stats</h2>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-value">{data.totals.total}</div>
          <div className="admin-stat-label">Total Licenses</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-value admin-stat-value--active">{data.totals.active}</div>
          <div className="admin-stat-label">Active</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-value">{data.totals.cancelled}</div>
          <div className="admin-stat-label">Cancelled</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-value">{data.totals.past_due}</div>
          <div className="admin-stat-label">Past Due</div>
        </div>
      </div>

      <h3 className="admin-section-title">By Product</h3>
      {data.byProduct.length === 0 ? (
        <div className="admin-empty">No data yet.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Total</th>
                <th>Active</th>
                <th>Monthly</th>
                <th>Yearly</th>
                <th>Lifetime</th>
                <th>Cancelled</th>
              </tr>
            </thead>
            <tbody>
              {data.byProduct.map((row) => (
                <tr key={row.product}>
                  <td><span className={`badge badge--${row.product}`}>{row.product}</span></td>
                  <td>{row.total}</td>
                  <td>{row.active}</td>
                  <td>{row.monthly}</td>
                  <td>{row.yearly}</td>
                  <td>{row.lifetime}</td>
                  <td>{row.cancelled}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 className="admin-section-title">Recent Signups (30 days)</h3>
      {data.recentSignups.length === 0 ? (
        <div className="admin-empty">No signups in the last 30 days.</div>
      ) : (
        <div className="admin-stats-grid">
          {data.recentSignups.map((row) => (
            <div key={row.product} className="admin-stat-card">
              <div className="admin-stat-value">{row.count}</div>
              <div className="admin-stat-label">{row.product}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
