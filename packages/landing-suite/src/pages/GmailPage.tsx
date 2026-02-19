import { Nav, Hero, Features, Pricing, FAQ, Footer } from '@darkly/landing-shared'
import type { ScreenshotImage } from '@darkly/landing-shared'
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

const heroScreenshots: ScreenshotImage[] = [
  { src: '/images/screenshots/split-view.jpg', alt: 'Gmail with Darkly dark mode — split view showing light and dark halves' },
  { src: '/images/screenshots/panel-open-dark.jpg', alt: 'Gmail in dark mode with Darkly settings panel open' },
]

const featureScreenshots: ScreenshotImage[] = [
  { src: '/images/screenshots/panel-views.jpg', alt: 'All Darkly theme modes — Schedule, Default, Sunrise/Sunset, and System' },
  { src: '/images/screenshots/inbox-dark-mini-panel.jpg', alt: 'Gmail dark mode with Darkly mini panel showing quick theme controls' },
  { src: '/images/screenshots/marketing-tile.jpg', alt: 'Darkly for Gmail — save your eyes with intelligent dark mode' },
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
        screenshots={heroScreenshots}
      />
      <Features
        sectionTitle="Built for Gmail, designed for comfort"
        sectionSubtitle="Darkly transforms every part of Gmail with carefully crafted dark styling."
        screenshots={featureScreenshots}
      />
      <Pricing product="gmail" features={gmailFeatures} individualTiers={individualTiers} storeUrls={STORE_URLS} />
      <FAQ />
      <Footer brandLabel="Suite" links={FOOTER_LINKS} copyrightName={SITE_NAME} />
    </>
  )
}
