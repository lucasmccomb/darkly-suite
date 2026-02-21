import { NavLink, Outlet, Navigate } from 'react-router-dom'
import { useAccountAuth, AccountAuthProvider } from './AccountAuthContext.tsx'
import { Wordmark } from '../components/Wordmark.tsx'

function AccountShell() {
  const { authenticated, loading } = useAccountAuth()

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
      </div>
    )
  }

  if (!authenticated) {
    return <Navigate to="/account" replace />
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <Wordmark />{' '}Account
        </div>
        <nav className="admin-sidebar-nav">
          <NavLink to="/account/subscriptions" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            Subscriptions
          </NavLink>
        </nav>
        <div className="admin-sidebar-footer">
          <form method="POST" action="/api/account/logout">
            <button type="submit" className="admin-logout-btn">Sign Out</button>
          </form>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}

export function AccountLayout() {
  return (
    <AccountAuthProvider>
      <AccountShell />
    </AccountAuthProvider>
  )
}
