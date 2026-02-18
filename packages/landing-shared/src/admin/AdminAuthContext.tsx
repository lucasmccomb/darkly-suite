import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface AdminAuthState {
  authenticated: boolean
  loading: boolean
}

const AdminAuthContext = createContext<AdminAuthState>({ authenticated: false, loading: true })

export function useAdminAuth() {
  return useContext(AdminAuthContext)
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminAuthState>({ authenticated: false, loading: true })

  useEffect(() => {
    fetch('/api/admin/session', { credentials: 'same-origin' })
      .then((res) => {
        setState({ authenticated: res.ok, loading: false })
      })
      .catch(() => {
        setState({ authenticated: false, loading: false })
      })
  }, [])

  return <AdminAuthContext.Provider value={state}>{children}</AdminAuthContext.Provider>
}
