import { useEffect, useState } from 'react'

interface Subscription {
  id: number
  product: string
  plan: string
  status: string
  created_at: string
  expires_at: string | null
  discount_code: string | null
  stripe_customer_id: string | null
}

interface SubscriptionsResponse {
  subscriptions: Subscription[]
}

const PRODUCT_LABELS: Record<string, string> = {
  gmail: 'Gmail',
  sheets: 'Sheets',
  docs: 'Docs',
  suite: 'Suite',
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'active': return 'badge badge--active'
    case 'cancelled': return 'badge badge--cancelled'
    case 'past_due': return 'badge badge--expired'
    case 'expired': return 'badge badge--expired'
    default: return 'badge'
  }
}

export function AccountSubscriptionsPage() {
  const [data, setData] = useState<SubscriptionsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/account/subscriptions', { credentials: 'same-origin' })
      .then(async (res) => {
        if (res.ok) {
          setData(await res.json())
        }
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  return (
    <div className="admin-page">
      <h2>Subscriptions</h2>

      {loading ? (
        <div className="admin-table-loading">Loading...</div>
      ) : !data || data.subscriptions.length === 0 ? (
        <div className="admin-empty">No subscriptions found for this account.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Created</th>
                <th>Expires</th>
                <th>Promo Code</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.subscriptions.map((sub) => (
                <tr key={sub.id}>
                  <td><span className={`badge badge--${sub.product}`}>{PRODUCT_LABELS[sub.product] ?? sub.product}</span></td>
                  <td><span className={`badge badge--${sub.plan}`}>{sub.plan}</span></td>
                  <td><span className={statusBadgeClass(sub.status)}>{sub.status}</span></td>
                  <td>{formatDate(sub.created_at)}</td>
                  <td>{sub.expires_at ? formatDate(sub.expires_at) : '--'}</td>
                  <td>{sub.discount_code ?? '--'}</td>
                  <td>
                    {sub.plan === 'lifetime' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: 'var(--color-success, #81c995)', fontSize: '0.8rem', fontWeight: 600 }}>
                          Lifetime access
                        </span>
                        {sub.stripe_customer_id && (
                          <a
                            href={`/api/account/portal?customer_id=${sub.stripe_customer_id}`}
                            style={{ color: 'var(--color-text-secondary, #999)', fontSize: '0.75rem', textDecoration: 'underline', textUnderlineOffset: 2 }}
                          >
                            View receipt
                          </a>
                        )}
                      </span>
                    ) : sub.stripe_customer_id ? (
                      <a
                        href={`/api/account/portal?customer_id=${sub.stripe_customer_id}`}
                        className="admin-btn-primary"
                        style={{ textDecoration: 'none', fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                      >
                        Manage Billing
                      </a>
                    ) : '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
