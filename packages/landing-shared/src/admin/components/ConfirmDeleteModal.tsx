import { AdminModal } from './AdminModal'
import { PRODUCT_LABELS } from '../constants'

interface License {
  id: number
  email: string | null
  product: string
  plan: string
  status: string
}

interface ConfirmDeleteModalProps {
  open: boolean
  license: License | null
  loading: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ConfirmDeleteModal({ open, license, loading, onClose, onConfirm }: ConfirmDeleteModalProps) {
  if (!license) return null

  return (
    <AdminModal open={open} onClose={onClose} title="Delete License">
      <div className="admin-confirm-details">
        <div className="admin-confirm-row">
          <span className="admin-confirm-label">Email</span>
          <span>{license.email ?? '(no email)'}</span>
        </div>
        <div className="admin-confirm-row">
          <span className="admin-confirm-label">Product</span>
          <span className={`badge badge--${license.product}`}>
            {PRODUCT_LABELS[license.product] ?? license.product}
          </span>
        </div>
        <div className="admin-confirm-row">
          <span className="admin-confirm-label">Plan</span>
          <span className={`badge badge--${license.plan}`}>{license.plan}</span>
        </div>
        <div className="admin-confirm-row">
          <span className="admin-confirm-label">Access</span>
          <span className={`badge badge--${license.status}`}>{license.status}</span>
        </div>
      </div>

      <p className="admin-confirm-warning">
        {license.plan === 'lifetime'
          ? 'This will permanently delete this license. Lifetime plans do not have a Stripe subscription, so there is nothing to cancel. This action cannot be undone.'
          : 'This will permanently delete this license and cancel any active Stripe subscription. This action cannot be undone.'}
      </p>

      <div className="admin-share-actions">
        <button className="admin-btn-secondary" onClick={onClose} disabled={loading}>
          Cancel
        </button>
        <button className="admin-btn-danger" onClick={onConfirm} disabled={loading}>
          {loading ? 'Deleting...' : 'Delete License'}
        </button>
      </div>
    </AdminModal>
  )
}
