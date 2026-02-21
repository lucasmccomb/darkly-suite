import { useEffect } from 'react'

interface AdminToastProps {
  message: string
  type: 'success' | 'error'
  onDismiss: () => void
}

export function AdminToast({ message, type, onDismiss }: AdminToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div className={`admin-toast admin-toast--${type}`}>
      {message}
    </div>
  )
}
