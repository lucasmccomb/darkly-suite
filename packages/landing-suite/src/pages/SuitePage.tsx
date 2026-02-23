import { useCallback } from 'react'
import { Nav, Hero, Features, Pricing, FAQ, Footer, buildCheckoutUrl, getOrCreateToken, useExtensionToken } from '@darkly/landing-shared'
import { NAV_LINKS, NAV_CTA, FOOTER_LINKS, SITE_NAME, STORE_URLS, CHECKOUT_API_URL, individualTiers, bundleTiers } from '../config.ts'

const suiteFeatures = [
  'Dark mode for Gmail, Sheets, Docs, and Drive',
  'OS dark mode detection',
  'Manual toggle',
  'Time-based scheduling',
  'Sunrise/sunset scheduling',
  'Cross-device sync',
  'In-app settings panel',
  'Priority email support',
]

export function SuitePage() {
  const extensionToken = useExtensionToken('suite')

  const handleCheckout = useCallback((product: string, plan: string) => {
    const token = getOrCreateToken(null, extensionToken)
    window.location.href = buildCheckoutUrl(CHECKOUT_API_URL, product, plan, token)
  }, [extensionToken])

  return (
    <>
      <Nav brandLabel="Suite" links={NAV_LINKS} cta={NAV_CTA} />
      <Hero
        title="The complete dark mode<br />suite for Google"
        subtitle="One extension, one license. Premium dark mode for Gmail, Sheets, Docs, and Drive with automatic scheduling and OS sync."
        ctaText="Get the Suite"
        ctaLink="#pricing"
      />
      <Features
        sectionTitle="Everything in one package"
        sectionSubtitle="The Darkly Suite gives you dark mode for all Google apps with unified settings."
      />
      <Pricing product="suite" features={suiteFeatures} individualTiers={individualTiers} bundleTiers={bundleTiers} storeUrls={STORE_URLS} onCheckout={handleCheckout} />
      <FAQ />
      <Footer brandLabel="Suite" links={FOOTER_LINKS} copyrightName={SITE_NAME} />
    </>
  )
}
