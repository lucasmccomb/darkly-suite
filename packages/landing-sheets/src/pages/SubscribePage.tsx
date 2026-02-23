import { Nav, Footer, SubscribeContent } from '@darkly/landing-shared'
import { NAV_LINKS, NAV_CTA, FOOTER_LINKS, SITE_NAME, AUTH_API_URL, SHEETS_FEATURES, individualTiers } from '../config.ts'

export function SubscribePage() {
  return (
    <>
      <Nav brandLabel="for Sheets" links={NAV_LINKS} cta={NAV_CTA} />
      <SubscribeContent
        product="sheets"
        productName="Darkly for Sheets"
        tiers={individualTiers()}
        features={SHEETS_FEATURES}
        authBaseUrl={AUTH_API_URL}
      />
      <Footer
        brandLabel="for Sheets"
        links={FOOTER_LINKS}
        copyrightName={SITE_NAME}
        trademarkText="Google Sheets is a trademark of Google LLC. Darkly is not affiliated with or endorsed by Google."
      />
    </>
  )
}
