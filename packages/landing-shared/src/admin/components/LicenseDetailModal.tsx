import { useCallback, useEffect, useState } from 'react'
import { AdminModal } from './AdminModal'
import { PRODUCT_LABELS } from '../constants'

interface License {
  id: number
  email: string | null
  product: string
  plan: string
  status: string
  stripe_subscription_id: string | null
}

interface StripeSubscription {
  id: string
  status: string
  current_period_start: number
  current_period_end: number
  cancel_at_period_end: boolean
  canceled_at: number | null
  ended_at: number | null
  plan?: {
    amount: number
    currency: string
    interval: string
  }
}

interface StripeCustomer {
  id: string
  email: string | null
  name: string | null
  created: number
}

interface DetailResponse {
  license: License & { discount_code: string | null; created_at: string; expires_at: string | null; stripe_customer_id: string | null }
  stripe: { subscription: StripeSubscription | null; customer: StripeCustomer | null } | null
  stripe_error: string | null
}

interface LicenseDetailModalProps {
  open: boolean
  license: License | null
  onClose: () => void
  onAction: () => void
}

type ActionState = { loading: boolean; action: string | null }

export function LicenseDetailModal({ open, license, onClose, onAction }: LicenseDetailModalProps) {
  const [detail, setDetail] = useState<DetailResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionState, setActionState] = useState<ActionState>({ loading: false, action: null })
  const [error, setError] = useState<string | null>(null)

  const fetchDetail = useCallback(async () => {
    if (!license) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/licenses/${license.id}`, { credentials: 'same-origin' })
      if (res.ok) {
        setDetail(await res.json())
      } else {
        setError('Failed to load license details')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [license])

  useEffect(() => {
    if (open && license) {
      setDetail(null)
      fetchDetail()
    }
  }, [open, license, fetchDetail])

  const handleAction = async (action: string, confirmMessage: string) => {
    if (!license || !confirm(confirmMessage)) return
    setActionState({ loading: true, action })
    try {
      const res = await fetch(`/api/admin/licenses?id=${license.id}&action=${action}`, {
        method: 'PATCH',
        credentials: 'same-origin',
      })
      if (res.ok) {
        onAction()
        fetchDetail()
      } else {
        const body = await res.json().catch(() => ({ error: 'Unknown error' })) as { error: string }
        setError(body.error || `Failed to ${action.replace(/_/g, ' ')}`)
      }
    } catch {
      setError('Network error')
    } finally {
      setActionState({ loading: false, action: null })
    }
  }

  if (!license) return null

  const sub = detail?.stripe?.subscription
  const customer = detail?.stripe?.customer
  const hasSubscription = !!license.stripe_subscription_id
  const subActive = sub && !['canceled', 'incomplete_expired'].includes(sub.status)

  return (
    <AdminModal open={open} onClose={onClose} title="License Details">
      {loading ? (
        <div className="admin-table-loading">Loading...</div>
      ) : error && !detail ? (
        <div className="admin-detail-error">{error}</div>
      ) : detail ? (
        <div className="admin-detail-content">
          {/* License section (D1 data) */}
          <div className="admin-detail-section">
            <h4 className="admin-detail-section-title">License</h4>
            <div className="admin-detail-grid">
              <DetailRow label="Email" value={detail.license.email ?? '(no email)'} />
              <DetailRow label="Product">
                <span className={`badge badge--${detail.license.product}`}>
                  {PRODUCT_LABELS[detail.license.product] ?? detail.license.product}
                </span>
              </DetailRow>
              <DetailRow label="Plan">
                <span className={`badge badge--${detail.license.plan}`}>{detail.license.plan}</span>
              </DetailRow>
              <DetailRow label="Access">
                <span className={`badge badge--${detail.license.status}`}>{detail.license.status}</span>
              </DetailRow>
              <DetailRow label="Created" value={formatDate(detail.license.created_at)} />
              <DetailRow label="Expires" value={detail.license.expires_at ? formatDate(detail.license.expires_at) : 'N/A'} />
              {detail.license.discount_code && (
                <DetailRow label="Discount" value={detail.license.discount_code} />
              )}
            </div>
          </div>

          {/* Stripe Subscription section */}
          <div className="admin-detail-section">
            <h4 className="admin-detail-section-title">Stripe Subscription</h4>
            {detail.stripe_error && (
              <div className="admin-detail-warning">Stripe data unavailable: {detail.stripe_error}</div>
            )}
            {!hasSubscription ? (
              <p className="admin-detail-muted">Lifetime license — no Stripe subscription</p>
            ) : sub ? (
              <div className="admin-detail-grid">
                <DetailRow label="Status">
                  <span className={`badge badge--stripe-${sub.status}`}>{sub.status}</span>
                  {sub.cancel_at_period_end && (
                    <span className="admin-detail-tag">cancels at period end</span>
                  )}
                </DetailRow>
                <DetailRow label="Billing Period" value={`${formatTimestamp(sub.current_period_start)} — ${formatTimestamp(sub.current_period_end)}`} />
                {sub.plan && (
                  <DetailRow label="Amount" value={`${formatCurrency(sub.plan.amount, sub.plan.currency)} / ${sub.plan.interval}`} />
                )}
                {sub.canceled_at && (
                  <DetailRow label="Canceled At" value={formatTimestamp(sub.canceled_at)} />
                )}
              </div>
            ) : !detail.stripe_error ? (
              <p className="admin-detail-muted">Loading...</p>
            ) : null}
          </div>

          {/* Stripe Customer section */}
          {customer && (
            <div className="admin-detail-section">
              <h4 className="admin-detail-section-title">Stripe Customer</h4>
              <div className="admin-detail-grid">
                <DetailRow label="Email" value={customer.email ?? '(none)'} />
                <DetailRow label="Name" value={customer.name ?? '(none)'} />
              </div>
            </div>
          )}

          {/* Error banner */}
          {error && <div className="admin-detail-error">{error}</div>}

          {/* Actions */}
          <div className="admin-detail-actions">
            {hasSubscription && subActive && !sub?.cancel_at_period_end && (
              <button
                className="admin-btn-warning"
                disabled={actionState.loading}
                onClick={() => handleAction(
                  'cancel_subscription',
                  `Cancel subscription at period end (${sub ? formatTimestamp(sub.current_period_end) : 'end of period'})? User keeps access until then.`,
                )}
              >
                {actionState.action === 'cancel_subscription' ? 'Canceling...' : 'Cancel at Period End'}
              </button>
            )}
            {hasSubscription && subActive && (
              <button
                className="admin-btn-danger"
                disabled={actionState.loading}
                onClick={() => handleAction(
                  'cancel_immediately',
                  'Cancel subscription immediately and revoke access? This cannot be undone.',
                )}
              >
                {actionState.action === 'cancel_immediately' ? 'Canceling...' : 'Cancel Immediately'}
              </button>
            )}
            {detail.license.status === 'active' && (
              <button
                className="admin-btn-danger"
                disabled={actionState.loading}
                onClick={() => handleAction('revoke_access', 'Revoke access? This only changes the D1 record, not the Stripe subscription.')}
              >
                {actionState.action === 'revoke_access' ? 'Revoking...' : 'Revoke Access'}
              </button>
            )}
            {detail.license.status === 'inactive' && (
              <button
                className="admin-btn-primary"
                disabled={actionState.loading}
                onClick={() => handleAction('grant_access', 'Grant access? This only changes the D1 record, not the Stripe subscription.')}
              >
                {actionState.action === 'grant_access' ? 'Granting...' : 'Grant Access'}
              </button>
            )}
          </div>
        </div>
      ) : null}
    </AdminModal>
  )
}

function DetailRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="admin-detail-row">
      <span className="admin-detail-label">{label}</span>
      <span className="admin-detail-value">{children ?? value}</span>
    </div>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100)
}
