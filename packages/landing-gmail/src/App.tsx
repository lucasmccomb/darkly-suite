import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ScrollToHash } from '@darkly/landing-shared'
import { HomePage } from './pages/HomePage.tsx'
import { PrivacyPage } from './pages/PrivacyPage.tsx'
import { SetupPage } from './pages/SetupPage.tsx'
import { SubscribePage } from './pages/SubscribePage.tsx'
import { SuccessPage } from './pages/SuccessPage.tsx'

export function App() {
  return (
    <BrowserRouter>
      <ScrollToHash />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/subscribe" element={<SubscribePage />} />
        <Route path="/success" element={<SuccessPage />} />
      </Routes>
    </BrowserRouter>
  )
}
