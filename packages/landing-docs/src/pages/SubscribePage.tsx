import { Nav, Footer, SubscribeContent } from '@darkly/landing-shared'
import { NAV_LINKS, NAV_CTA, FOOTER_LINKS, SITE_NAME, AUTH_API_URL, DOCS_FEATURES, individualTiers } from '../config.ts'

export function SubscribePage() {
  return (
    <>
      <Nav brandLabel="for Docs" links={NAV_LINKS} cta={NAV_CTA} />
      <SubscribeContent
        product="docs"
        productName="Darkly for Docs"
        tiers={individualTiers()}
        features={DOCS_FEATURES}
        authBaseUrl={AUTH_API_URL}
      />
      <Footer
        brandLabel="for Docs"
        links={FOOTER_LINKS}
        copyrightName={SITE_NAME}
        trademarkText="Google Docs is a trademark of Google LLC. Darkly is not affiliated with or endorsed by Google."
      />
    </>
  )
}
