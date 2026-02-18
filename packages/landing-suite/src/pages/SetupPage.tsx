import { useSearchParams } from 'react-router-dom'
import { Nav } from '../components/Nav.tsx'
import { Footer } from '../components/Footer.tsx'
import { SetupGuide } from '../components/SetupGuide.tsx'

export function SetupPage() {
  const [searchParams] = useSearchParams()
  const product = searchParams.get('product')

  return (
    <>
      <Nav />
      <section className="setup-header">
        <div className="container">
          <span className="section-label">Setup Guide</span>
          <h1 className="section-title">Get started with Darkly</h1>
          <p className="section-subtitle">
            Follow these steps to set up dark mode for your Google apps.
            Select your app below to see app-specific instructions.
          </p>
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <SetupGuide activeTab={product} />
        </div>
      </section>
      <Footer />
    </>
  )
}
