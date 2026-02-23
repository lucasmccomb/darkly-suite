import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ScrollToHash, AdminLayout, AdminLoginPage, AdminLicensesPage, AdminDiscountsPage, AdminStatsPage } from '@darkly/landing-shared'
import { AccountLayout, AccountLoginPage, AccountSubscriptionsPage } from '@darkly/landing-shared'
import { HomePage } from './pages/HomePage.tsx'
import { PrivacyPage } from './pages/PrivacyPage.tsx'
import { SuccessPage } from './pages/SuccessPage.tsx'
import { SubscribePage } from './pages/SubscribePage.tsx'
import { SupportPage } from './pages/SupportPage.tsx'

export function App() {
  return (
    <BrowserRouter>
      <ScrollToHash />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/subscribe" element={<SubscribePage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route element={<AdminLayout />}>
          <Route path="/admin/memberships" element={<AdminLicensesPage />} />
          <Route path="/admin/discounts" element={<AdminDiscountsPage />} />
          <Route path="/admin/stats" element={<AdminStatsPage />} />
        </Route>
        <Route path="/account" element={<AccountLoginPage />} />
        <Route element={<AccountLayout />}>
          <Route path="/account/subscriptions" element={<AccountSubscriptionsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
