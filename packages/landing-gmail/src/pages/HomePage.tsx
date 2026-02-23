import { useCallback } from 'react'
import { Mail } from 'lucide-react'
import { Nav, Hero, Features, Pricing, FAQ, Footer, buildCheckoutUrl, getOrCreateToken, useExtensionToken } from '@darkly/landing-shared'
import type { ScreenshotImage } from '@darkly/landing-shared'
import {
  NAV_LINKS, NAV_CTA, FOOTER_LINKS, SITE_NAME, STORE_URL, CHECKOUT_API_URL,
  GMAIL_FEATURES, GMAIL_FAQ, individualTiers,
} from '../config.ts'

const heroScreenshots: ScreenshotImage[] = [
  { src: '/images/screenshots/split-view.jpg', alt: 'Gmail with Darkly dark mode — split view showing light and dark halves' },
  { src: '/images/screenshots/panel-open-dark.jpg', alt: 'Gmail in dark mode with Darkly settings panel open' },
]

const featureScreenshots: ScreenshotImage[] = [
  { src: '/images/screenshots/panel-views.jpg', alt: 'All Darkly theme modes — Schedule, Default, Sunrise/Sunset, and System' },
]

export function HomePage() {
  const extensionToken = useExtensionToken('gmail')

  const handleCheckout = useCallback((product: string, plan: string) => {
    const token = getOrCreateToken(null, extensionToken)
    window.location.href = buildCheckoutUrl(CHECKOUT_API_URL, product, plan, token)
  }, [extensionToken])

  return (
    <>
      <Nav brandLabel="for Gmail" links={NAV_LINKS} cta={NAV_CTA} />
      <Hero
        title="Intelligent dark mode<br />for Gmail"
        subtitle="Automatically switch your Gmail theme to an optimized dark mode based on your machine's OS, sunset/sunrise, or a custom schedule."
        ctaText="Get Darkly for Gmail"
        ctaLink="#pricing"
        icon={<Mail size={48} color="#ea4335" strokeWidth={1.5} />}
        screenshots={heroScreenshots}
      />
      <Features
        sectionTitle="Built for Gmail, designed for comfort"
        sectionSubtitle="Darkly transforms every part of Gmail with carefully crafted dark styling."
        screenshots={featureScreenshots}
      />
      <Pricing
        product="gmail"
        features={GMAIL_FEATURES}
        individualTiers={individualTiers}
        storeUrls={{ gmail: STORE_URL }}
        onCheckout={handleCheckout}
      />
      <FAQ items={GMAIL_FAQ} />
      <Footer
        brandLabel="for Gmail"
        links={FOOTER_LINKS}
        copyrightName={SITE_NAME}
        trademarkText="Gmail is a trademark of Google LLC. Darkly is not affiliated with or endorsed by Google."
      />
    </>
  )
}
