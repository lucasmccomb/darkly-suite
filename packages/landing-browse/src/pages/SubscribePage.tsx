import { Nav, Footer, SubscribeContent } from '@darkly/landing-shared'
import { NAV_LINKS, NAV_CTA, FOOTER_LINKS, SITE_NAME, AUTH_API_URL, BROWSE_FEATURES, individualTiers } from '../config.ts'

export function SubscribePage() {
  return (
    <>
      <Nav links={NAV_LINKS} cta={NAV_CTA} />
      <SubscribeContent
        product="browse"
        productName="Browse Darkly"
        tiers={individualTiers()}
        features={BROWSE_FEATURES}
        authBaseUrl={AUTH_API_URL}
      />
      <Footer
        links={FOOTER_LINKS}
        copyrightName={SITE_NAME}
        trademarkText="Browse Darkly is not affiliated with or endorsed by Google."
      />
    </>
  )
}
