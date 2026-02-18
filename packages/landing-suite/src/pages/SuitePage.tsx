import { Nav, Hero, Features, Pricing, FAQ, Footer } from '@darkly/landing-shared'
import { NAV_LINKS, NAV_CTA, FOOTER_LINKS, SITE_NAME, STORE_URLS, individualTiers, bundleTiers } from '../config.ts'

const suiteFeatures = [
  'Dark mode for Gmail, Sheets, and Docs',
  'OS dark mode detection',
  'Manual toggle & keyboard shortcut',
  'Time-based scheduling',
  'Sunrise/sunset scheduling',
  'Cross-device sync',
  'In-app settings panel',
  'Priority email support',
]

export function SuitePage() {
  return (
    <>
      <Nav brandLabel="Suite" links={NAV_LINKS} cta={NAV_CTA} />
      <Hero
        title="The complete dark mode<br />suite for Google"
        subtitle="One extension, one license. Premium dark mode for Gmail, Sheets, and Docs with automatic scheduling and OS sync."
        ctaText="Get the Suite"
        ctaLink="#pricing"
      />
      <Features
        sectionTitle="Everything in one package"
        sectionSubtitle="The Darkly Suite gives you dark mode for all Google apps with unified settings."
      />
      <Pricing product="suite" features={suiteFeatures} individualTiers={individualTiers} bundleTiers={bundleTiers} storeUrls={STORE_URLS} />
      <FAQ />
      <Footer brandLabel="Suite" links={FOOTER_LINKS} copyrightName={SITE_NAME} />
    </>
  )
}
