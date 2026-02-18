import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { HomePage } from './pages/HomePage.tsx'
import { GmailPage } from './pages/GmailPage.tsx'
import { SheetsPage } from './pages/SheetsPage.tsx'
import { DocsPage } from './pages/DocsPage.tsx'
import { SuitePage } from './pages/SuitePage.tsx'
import { PrivacyPage } from './pages/PrivacyPage.tsx'
import { SuccessPage } from './pages/SuccessPage.tsx'
import { SetupPage } from './pages/SetupPage.tsx'
import { AdminLoginPage } from './admin/pages/AdminLoginPage.tsx'
import { AdminLayout } from './admin/AdminLayout.tsx'
import { AdminLicensesPage } from './admin/pages/AdminLicensesPage.tsx'
import { AdminDiscountsPage } from './admin/pages/AdminDiscountsPage.tsx'
import { AdminStatsPage } from './admin/pages/AdminStatsPage.tsx'

function ScrollToHash() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

export function App() {
  return (
    <BrowserRouter>
      <ScrollToHash />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/gmail" element={<GmailPage />} />
        <Route path="/sheets" element={<SheetsPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/suite" element={<SuitePage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route element={<AdminLayout />}>
          <Route path="/admin/licenses" element={<AdminLicensesPage />} />
          <Route path="/admin/discounts" element={<AdminDiscountsPage />} />
          <Route path="/admin/stats" element={<AdminStatsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
