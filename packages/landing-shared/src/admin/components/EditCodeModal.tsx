import { AdminModal } from './AdminModal.tsx'
import { PRODUCT_LABELS } from '../constants.ts'

interface EditCodeModalProps {
  open: boolean
  onClose: () => void
  code: { id: string; code: string; product: string | null } | null
}

export function EditCodeModal({ open, onClose, code }: EditCodeModalProps) {
  const productLabel = code?.product
    ? PRODUCT_LABELS[code.product] ?? code.product
    : 'All products'

  return (
    <AdminModal open={open} onClose={onClose} title={`Details: ${code?.code ?? 'Code'}`}>
      <div className="admin-form-row">
        <label>Product Scope</label>
        <div className="admin-readonly-value">{productLabel}</div>
        <p className="admin-help-text">
          Product scope is set at creation and enforced by Stripe.
          To change it, deactivate this code and create a new one.
        </p>
      </div>

      <div className="admin-share-actions">
        <button type="button" className="admin-btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>
    </AdminModal>
  )
}
