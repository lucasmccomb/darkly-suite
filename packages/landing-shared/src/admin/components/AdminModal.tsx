import type { ReactNode } from 'react'

interface AdminModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function AdminModal({ open, onClose, title, children }: AdminModalProps) {
  if (!open) return null

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h3>{title}</h3>
          <button className="admin-modal-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
        <div className="admin-modal-body">{children}</div>
      </div>
    </div>
  )
}
