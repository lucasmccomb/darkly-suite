import { useCallback, useEffect, useState } from 'react'
import { ChevronRight, AlertTriangle } from 'lucide-react'
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
  onAction: (message?: string) => void
}

type ActionState = { loading: boolean; action: string | null }

export function LicenseDetailModal({ open, license, onClose, onAction }: LicenseDetailModalProps) {
  const [detail, setDetail] = useState<DetailResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionState, setActionState] = useState<ActionState>({ loading: false, action: null })
  const [error, setError] = useState<string | null>(null)
  const [deleteExpanded, setDeleteExpanded] = useState(false)
  const [deleteConfirmed, setDeleteConfirmed] = useState(false)

  const fetchDetail = useCallback(async () => {
    if (!license) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/licenses/${license.id}`, { credentials: 'same-origin' })
      if (res.ok) {
        setDetail(await res.json())
      } else {
        setError('Failed to load membership details')
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
      setDeleteExpanded(false)
      setDeleteConfirmed(false)
      fetchDetail()
    }
  }, [open, license, fetchDetail])

  const handleCancelSubscription = async () => {
    if (!license) return
    setActionState({ loading: true, action: 'cancel' })
    try {
      const res = await fetch(`/api/admin/licenses?id=${license.id}&action=cancel_immediately`, {
        method: 'PATCH',
        credentials: 'same-origin',
      })
      if (res.ok) {
        onAction('Subscription cancelled successfully')
        fetchDetail()
      } else {
        const body = await res.json().catch(() => ({ error: 'Unknown error' })) as { error: string }
        setError(body.error || 'Failed to cancel subscription')
      }
    } catch {
      setError('Network error')
    } finally {
      setActionState({ loading: false, action: null })
    }
  }

  const handleDeleteMembership = async () => {
    if (!license) return
    setActionState({ loading: true, action: 'delete' })
    try {
      const res = await fetch(`/api/admin/licenses?id=${license.id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      if (res.ok) {
        onAction('Membership deleted successfully')
        onClose()
      } else {
        const body = await res.json().catch(() => ({ error: 'Unknown error' })) as { error: string }
        setError(body.error || 'Failed to delete membership')
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
    <AdminModal open={open} onClose={onClose} title="Edit Membership">
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
          <div className="admin-detail-footer">
            {hasSubscription && subActive && (
              <div className="admin-detail-footer-primary">
                <button
                  className="admin-btn-danger"
                  disabled={actionState.loading}
                  onClick={handleCancelSubscription}
                >
                  {actionState.action === 'cancel' ? 'Canceling...' : 'Cancel Subscription'}
                </button>
              </div>
            )}

            {/* Collapsible delete section */}
            <div className="admin-delete-section">
              <button
                className="admin-delete-toggle"
                onClick={() => { setDeleteExpanded(!deleteExpanded); setDeleteConfirmed(false) }}
                type="button"
              >
                <ChevronRight size={16} className={`admin-delete-chevron${deleteExpanded ? ' admin-delete-chevron--open' : ''}`} />
                Delete Membership
              </button>

              {deleteExpanded && (
                <div className="admin-delete-expanded">
                  <div className="admin-delete-warning">
                    <AlertTriangle size={16} />
                    <span>This cannot be undone. You will lose all membership information for this user. Any active Stripe subscription will also be cancelled.</span>
                  </div>
                  <label className="admin-delete-confirm-label">
                    <input
                      type="checkbox"
                      checked={deleteConfirmed}
                      onChange={(e) => setDeleteConfirmed(e.target.checked)}
                    />
                    Are you sure you want to delete this membership?
                  </label>
                  <button
                    className="admin-btn-danger"
                    disabled={!deleteConfirmed || actionState.loading}
                    onClick={handleDeleteMembership}
                  >
                    {actionState.action === 'delete' ? 'Deleting...' : 'Delete Membership'}
                  </button>
                </div>
              )}
            </div>
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
  const d = new Date(iso)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(-2)
  return `${mm}/${dd}/${yy}`
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts * 1000)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(-2)
  return `${mm}/${dd}/${yy}`
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100)
}
