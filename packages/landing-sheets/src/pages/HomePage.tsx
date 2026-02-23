import { useCallback } from 'react'
import { Table2, Sunset, Clock, Settings } from 'lucide-react'
import { Nav, Hero, Features, Pricing, FAQ, Footer, buildCheckoutUrl, getOrCreateToken, useExtensionToken } from '@darkly/landing-shared'
import type { ScreenshotImage } from '@darkly/landing-shared'
import {
  NAV_LINKS, NAV_CTA, FOOTER_LINKS, SITE_NAME, STORE_URL, CHECKOUT_API_URL,
  SHEETS_FEATURES, SHEETS_FAQ, individualTiers,
} from '../config.ts'

const heroScreenshots: ScreenshotImage[] = [
  { src: '/images/screenshots/split-view.jpg', alt: 'Google Sheets with Darkly dark mode — split view showing light and dark halves' },
  { src: '/images/screenshots/panel-open-dark.jpg', alt: 'Google Sheets in dark mode with Darkly settings panel open' },
]

const featureScreenshots: ScreenshotImage[] = [
  { src: '/images/screenshots/panel-views.jpg', alt: 'All Darkly theme modes — Schedule, Default, Sunrise/Sunset, and System' },
]

const sheetsFeatureItems = [
  {
    icon: <Table2 size={28} color="#81c995" strokeWidth={1.8} />,
    iconClass: 'feature-icon--settings',
    title: 'Grid-Aware Styling',
    description: 'Dark mode that understands the Sheets grid. Cells, headers, formula bar, and toolbar are all styled for readability.',
  },
  {
    icon: <Sunset size={28} color="#f28b82" strokeWidth={1.8} />,
    iconClass: 'feature-icon--sunset',
    title: 'Sunset Scheduling',
    description: 'Dark mode activates at sunset, light mode returns at sunrise. Uses your location to calculate the exact times each day.',
  },
  {
    icon: <Clock size={28} color="#6c5ce7" strokeWidth={1.8} />,
    iconClass: 'feature-icon--schedule',
    title: 'Schedule Mode',
    description: 'Set a daily dark mode schedule. Handles midnight wrapping automatically.',
  },
  {
    icon: <Settings size={28} color="#8ab4f8" strokeWidth={1.8} />,
    iconClass: 'feature-icon--sync',
    title: 'In-Sheets Settings',
    description: 'Configure everything without leaving Google Sheets. Access settings right from the toolbar.',
  },
]

export function HomePage() {
  const extensionToken = useExtensionToken('sheets')

  const handleCheckout = useCallback((product: string, plan: string) => {
    const token = getOrCreateToken(null, extensionToken)
    window.location.href = buildCheckoutUrl(CHECKOUT_API_URL, product, plan, token)
  }, [extensionToken])

  return (
    <>
      <Nav brandLabel="for Sheets" links={NAV_LINKS} cta={NAV_CTA} />
      <Hero
        title="Comfortable dark mode<br />for Google Sheets"
        subtitle="Grid-aware dark mode that styles cells, headers, and the formula bar without affecting your spreadsheet data."
        ctaText="Get Darkly for Sheets"
        ctaLink="#pricing"
        icon={<Table2 size={48} color="#81c995" strokeWidth={1.5} />}
        screenshots={heroScreenshots}
      />
      <Features
        items={sheetsFeatureItems}
        sectionTitle="Designed for spreadsheets"
        sectionSubtitle="Darkly understands the Sheets layout and styles every element for comfortable use."
        screenshots={featureScreenshots}
      />
      <Pricing
        product="sheets"
        features={SHEETS_FEATURES}
        individualTiers={individualTiers}
        storeUrls={{ sheets: STORE_URL }}
        onCheckout={handleCheckout}
      />
      <FAQ items={SHEETS_FAQ} />
      <Footer
        brandLabel="for Sheets"
        links={FOOTER_LINKS}
        copyrightName={SITE_NAME}
        trademarkText="Google Sheets is a trademark of Google LLC. Darkly is not affiliated with or endorsed by Google."
      />
    </>
  )
}
