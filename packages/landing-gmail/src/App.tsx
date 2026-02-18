import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ScrollToHash } from '@darkly/landing-shared'
import { HomePage } from './pages/HomePage.tsx'
import { PrivacyPage } from './pages/PrivacyPage.tsx'

export function App() {
  return (
    <BrowserRouter>
      <ScrollToHash />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
      </Routes>
    </BrowserRouter>
  )
}
