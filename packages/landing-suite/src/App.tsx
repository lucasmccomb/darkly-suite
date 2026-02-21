import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ScrollToHash, AdminLayout, AdminLoginPage, LogoDesignPage } from '@darkly/landing-shared'
import { AdminLicensesPage, AdminDiscountsPage, AdminStatsPage } from '@darkly/landing-shared'
import { AccountLayout, AccountLoginPage, AccountSubscriptionsPage } from '@darkly/landing-shared'
import { HomePage } from './pages/HomePage.tsx'
import { GmailPage } from './pages/GmailPage.tsx'
import { SheetsPage } from './pages/SheetsPage.tsx'
import { DocsPage } from './pages/DocsPage.tsx'
import { SuitePage } from './pages/SuitePage.tsx'
import { PrivacyPage } from './pages/PrivacyPage.tsx'
import { SuccessPage } from './pages/SuccessPage.tsx'
import { SetupPage } from './pages/SetupPage.tsx'
import { SupportPage } from './pages/SupportPage.tsx'
import { NAV_LINKS, NAV_CTA, FOOTER_LINKS, SITE_NAME } from './config.ts'

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
        <Route path="/support" element={<SupportPage />} />
        <Route path="/logo-design" element={
          <LogoDesignPage
            navLinks={NAV_LINKS}
            navCta={NAV_CTA}
            footerLinks={FOOTER_LINKS}
            copyrightName={SITE_NAME}
          />
        } />
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route element={<AdminLayout />}>
          <Route path="/admin/licenses" element={<AdminLicensesPage />} />
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
