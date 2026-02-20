import { Nav, Footer, SetupGuide } from '@darkly/landing-shared'
import { NAV_LINKS, NAV_CTA, FOOTER_LINKS, SITE_NAME, STORE_URL } from '../config.ts'

export function SetupPage() {
  return (
    <>
      <Nav brandLabel="for Sheets" links={NAV_LINKS} cta={NAV_CTA} />
      <section className="setup-header">
        <div className="container">
          <span className="section-label">Setup Guide</span>
          <h1 className="section-title">Welcome to Darkly for Sheets</h1>
          <p className="section-subtitle">
            You&apos;re all set! Follow these steps to start using dark mode in Google Sheets.
          </p>
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <SetupGuide
            activeTab="sheets"
            storeUrls={{ sheets: STORE_URL }}
            products={['sheets']}
          />
        </div>
      </section>
      <Footer
        brandLabel="for Sheets"
        links={FOOTER_LINKS}
        copyrightName={SITE_NAME}
        trademarkText="Google Sheets is a trademark of Google LLC. Darkly is not affiliated with or endorsed by Google."
      />
    </>
  )
}
