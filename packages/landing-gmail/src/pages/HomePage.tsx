import { Nav, Hero, Features, Pricing, FAQ, Footer } from '@darkly/landing-shared'
import {
  NAV_LINKS, NAV_CTA, FOOTER_LINKS, SITE_NAME, STORE_URL,
  GMAIL_FEATURES, GMAIL_FAQ, individualTiers,
} from '../config.ts'

export function HomePage() {
  return (
    <>
      <Nav links={NAV_LINKS} cta={NAV_CTA} />
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
      <Pricing
        product="gmail"
        features={GMAIL_FEATURES}
        individualTiers={individualTiers}
        storeUrls={{ gmail: STORE_URL }}
      />
      <FAQ items={GMAIL_FAQ} />
      <Footer
        links={FOOTER_LINKS}
        copyrightName={SITE_NAME}
        trademarkText="Gmail is a trademark of Google LLC. Darkly is not affiliated with or endorsed by Google."
      />
    </>
  )
}
