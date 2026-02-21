import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface AccountAuthState {
  authenticated: boolean
  loading: boolean
  email: string | null
}

const AccountAuthContext = createContext<AccountAuthState>({ authenticated: false, loading: true, email: null })

export function useAccountAuth() {
  return useContext(AccountAuthContext)
}

export function AccountAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AccountAuthState>({ authenticated: false, loading: true, email: null })

  useEffect(() => {
    fetch('/api/account/session', { credentials: 'same-origin' })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json()
          setState({ authenticated: data.authenticated, loading: false, email: data.email ?? null })
        } else {
          setState({ authenticated: false, loading: false, email: null })
        }
      })
      .catch(() => {
        setState({ authenticated: false, loading: false, email: null })
      })
  }, [])

  return <AccountAuthContext.Provider value={state}>{children}</AccountAuthContext.Provider>
}
