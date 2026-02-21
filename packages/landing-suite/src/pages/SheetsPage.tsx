import { useCallback } from 'react'
import { Nav, Hero, Features, Pricing, FAQ, Footer, buildCheckoutUrl, getOrCreateToken } from '@darkly/landing-shared'
import { Table2, Sunset, Clock, Settings } from 'lucide-react'
import { NAV_LINKS, NAV_CTA, FOOTER_LINKS, SITE_NAME, STORE_URLS, CHECKOUT_API_URL, individualTiers } from '../config.ts'

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

const sheetsFeatures = [
  'Dark mode for Google Sheets',
  'Grid and cell-aware styling',
  'Formula bar dark mode',
  'OS dark mode detection',
  'Time-based scheduling',
  'Sunrise/sunset scheduling',
  'In-Sheets settings panel',
  'Priority email support',
]

export function SheetsPage() {
  const handleCheckout = useCallback((product: string, plan: string) => {
    const token = getOrCreateToken()
    window.location.href = buildCheckoutUrl(CHECKOUT_API_URL, product, plan, token)
  }, [])

  return (
    <>
      <Nav brandLabel="Suite" links={NAV_LINKS} cta={NAV_CTA} />
      <Hero
        title="Comfortable dark mode<br />for Google Sheets"
        subtitle="Grid-aware dark mode that styles cells, headers, and the formula bar without affecting your spreadsheet data."
        ctaText="Get Darkly for Sheets"
        ctaLink="#pricing"
      />
      <Features
        items={sheetsFeatureItems}
        sectionTitle="Designed for spreadsheets"
        sectionSubtitle="Darkly understands the Sheets layout and styles every element for comfortable use."
      />
      <Pricing product="sheets" features={sheetsFeatures} individualTiers={individualTiers} storeUrls={STORE_URLS} onCheckout={handleCheckout} />
      <FAQ />
      <Footer brandLabel="Suite" links={FOOTER_LINKS} copyrightName={SITE_NAME} />
    </>
  )
}
