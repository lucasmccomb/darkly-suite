import { NavLink, Outlet, Navigate } from 'react-router-dom'
import { useAdminAuth, AdminAuthProvider } from './AdminAuthContext.tsx'
import { Wordmark } from '../components/Wordmark.tsx'

function AdminShell() {
  const { authenticated, loading } = useAdminAuth()

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
      </div>
    )
  }

  if (!authenticated) {
    return <Navigate to="/admin" replace />
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <Wordmark />{' '}Admin
        </div>
        <nav className="admin-sidebar-nav">
          <NavLink to="/admin/licenses" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            Licenses
          </NavLink>
          <NavLink to="/admin/discounts" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            Discount Codes
          </NavLink>
          <NavLink to="/admin/stats" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            Stats
          </NavLink>
        </nav>
        <div className="admin-sidebar-footer">
          <form method="POST" action="/api/admin/logout">
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

export function AdminLayout() {
  return (
    <AdminAuthProvider>
      <AdminShell />
    </AdminAuthProvider>
  )
}
