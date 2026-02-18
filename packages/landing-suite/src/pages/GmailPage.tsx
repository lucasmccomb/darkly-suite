import { Nav, Hero, Features, Pricing, FAQ, Footer } from '@darkly/landing-shared'
import { NAV_LINKS, NAV_CTA, FOOTER_LINKS, SITE_NAME, STORE_URLS, individualTiers } from '../config.ts'

const gmailFeatures = [
  'Dark mode for Gmail',
  'OS dark mode detection',
  'Manual toggle & keyboard shortcut',
  'Time-based scheduling',
  'Sunrise/sunset scheduling',
  'Cross-device sync',
  'In-Gmail settings panel',
  'Priority email support',
]

export function GmailPage() {
  return (
    <>
      <Nav brandLabel="Suite" links={NAV_LINKS} cta={NAV_CTA} />
      <Hero
        title="Intelligent dark mode<br />for Gmail"
        subtitle="Automatically switch your Gmail theme to an optimized dark mode based on your machine's OS, sunset/sunrise, or a custom schedule."
        ctaText="Get Darkly for Gmail"
        ctaLink="#pricing"
      />
      <Features
        sectionTitle="Built for Gmail, designed for comfort"
        sectionSubtitle="Darkly transforms every part of Gmail with carefully crafted dark styling."
      />
      <Pricing product="gmail" features={gmailFeatures} individualTiers={individualTiers} storeUrls={STORE_URLS} />
      <FAQ />
      <Footer brandLabel="Suite" links={FOOTER_LINKS} copyrightName={SITE_NAME} />
    </>
  )
}
