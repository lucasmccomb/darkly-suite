import { Nav, Footer, SubscribeContent } from '@darkly/landing-shared'
import { NAV_LINKS, NAV_CTA, FOOTER_LINKS, SITE_NAME, AUTH_API_URL, GMAIL_FEATURES, individualTiers } from '../config.ts'

export function SubscribePage() {
  return (
    <>
      <Nav brandLabel="for Gmail" links={NAV_LINKS} cta={NAV_CTA} />
      <SubscribeContent
        product="gmail"
        productName="Darkly for Gmail"
        tiers={individualTiers()}
        features={GMAIL_FEATURES}
        authBaseUrl={AUTH_API_URL}
      />
      <Footer
        brandLabel="for Gmail"
        links={FOOTER_LINKS}
        copyrightName={SITE_NAME}
        trademarkText="Gmail is a trademark of Google LLC. Darkly is not affiliated with or endorsed by Google."
      />
    </>
  )
}
