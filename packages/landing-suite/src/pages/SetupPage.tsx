import { useSearchParams } from 'react-router-dom'
import { Nav, Footer, SetupGuide } from '@darkly/landing-shared'
import { NAV_LINKS, NAV_CTA, FOOTER_LINKS, SITE_NAME, STORE_URLS } from '../config.ts'

export function SetupPage() {
  const [searchParams] = useSearchParams()
  const product = searchParams.get('product')

  return (
    <>
      <Nav brandLabel="Suite" links={NAV_LINKS} cta={NAV_CTA} />
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
          <SetupGuide activeTab={product} storeUrls={STORE_URLS} />
        </div>
      </section>
      <Footer brandLabel="Suite" links={FOOTER_LINKS} copyrightName={SITE_NAME} />
    </>
  )
}
