import { useCallback } from 'react'
import { FileText, Sunset, Clock, Settings } from 'lucide-react'
import { Nav, Hero, Features, Pricing, FAQ, Footer, buildCheckoutUrl, getOrCreateToken, useExtensionToken } from '@darkly/landing-shared'
import type { ScreenshotImage } from '@darkly/landing-shared'
import {
  NAV_LINKS, NAV_CTA, FOOTER_LINKS, SITE_NAME, STORE_URL, CHECKOUT_API_URL,
  DOCS_FEATURES, DOCS_FAQ, individualTiers,
} from '../config.ts'

const heroScreenshots: ScreenshotImage[] = [
  { src: '/images/screenshots/split-view.jpg', alt: 'Google Docs with Darkly dark mode — split view showing light and dark halves' },
  { src: '/images/screenshots/panel-open-dark.jpg', alt: 'Google Docs in dark mode with Darkly settings panel open' },
]

const featureScreenshots: ScreenshotImage[] = [
  { src: '/images/screenshots/panel-views.jpg', alt: 'All Darkly theme modes — Schedule, Default, Sunrise/Sunset, and System' },
]

const docsFeatureItems = [
  {
    icon: <FileText size={28} color="#4285f4" strokeWidth={1.8} />,
    iconClass: 'feature-icon--settings',
    title: 'Document-Aware Styling',
    description: 'Dark mode that understands the Docs layout. Toolbar, ruler, menus, and the Kix editor canvas are all styled for comfortable editing.',
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
    title: 'In-Docs Settings',
    description: 'Configure everything without leaving Google Docs. Access settings right from the toolbar.',
  },
]

export function HomePage() {
  const extensionToken = useExtensionToken('docs')

  const handleCheckout = useCallback((product: string, plan: string) => {
    const token = getOrCreateToken(null, extensionToken)
    window.location.href = buildCheckoutUrl(CHECKOUT_API_URL, product, plan, token)
  }, [extensionToken])

  return (
    <>
      <Nav brandLabel="for Docs" links={NAV_LINKS} cta={NAV_CTA} />
      <Hero
        title="Document-aware dark mode<br />for Google Docs"
        subtitle="Intelligent dark mode that themes the toolbar, ruler, and Kix editor canvas while preserving your document formatting and collaboration features."
        ctaText="Get Darkly for Docs"
        ctaLink="#pricing"
        icon={<FileText size={48} color="#4285f4" strokeWidth={1.5} />}
        screenshots={heroScreenshots}
      />
      <Features
        items={docsFeatureItems}
        sectionTitle="Designed for document editing"
        sectionSubtitle="Darkly understands the Docs layout and styles every element for comfortable writing and collaboration."
        screenshots={featureScreenshots}
      />
      <Pricing
        product="docs"
        features={DOCS_FEATURES}
        individualTiers={individualTiers}
        storeUrls={{ docs: STORE_URL }}
        onCheckout={handleCheckout}
      />
      <FAQ items={DOCS_FAQ} />
      <Footer
        brandLabel="for Docs"
        links={FOOTER_LINKS}
        copyrightName={SITE_NAME}
        trademarkText="Google Docs is a trademark of Google LLC. Darkly is not affiliated with or endorsed by Google."
      />
    </>
  )
}
