import { Nav, Footer, SetupGuide } from '@darkly/landing-shared'
import { NAV_LINKS, NAV_CTA, FOOTER_LINKS, SITE_NAME, STORE_URL } from '../config.ts'

export function SetupPage() {
  return (
    <>
      <Nav brandLabel="for Gmail" links={NAV_LINKS} cta={NAV_CTA} />
      <section className="setup-header">
        <div className="container">
          <span className="section-label">Setup Guide</span>
          <h1 className="section-title">Welcome to Darkly for Gmail</h1>
          <p className="section-subtitle">
            You&apos;re all set! Follow these steps to start using dark mode in Gmail.
          </p>
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <SetupGuide
            activeTab="gmail"
            storeUrls={{ gmail: STORE_URL }}
            products={['gmail']}
          />
        </div>
      </section>
      <Footer
        brandLabel="for Gmail"
        links={FOOTER_LINKS}
        copyrightName={SITE_NAME}
        trademarkText="Gmail is a trademark of Google LLC. Darkly is not affiliated with or endorsed by Google."
      />
    </>
  )
}
