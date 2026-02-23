import { useCallback } from 'react'
import { Globe, Palette, Brain, PanelRight, Monitor, Sunset, Clock, Settings } from 'lucide-react'
import { Nav, Hero, Features, Pricing, FAQ, Footer, buildCheckoutUrl, getOrCreateToken, useExtensionToken } from '@darkly/landing-shared'
import {
  NAV_LINKS, NAV_CTA, FOOTER_LINKS, SITE_NAME, STORE_URL, CHECKOUT_API_URL,
  BROWSE_FEATURES, BROWSE_FAQ, individualTiers,
} from '../config.ts'

const browseFeatureItems = [
  {
    icon: <Palette size={28} color="#8ab4f8" strokeWidth={1.8} />,
    iconClass: 'feature-icon--sync',
    title: 'Curated Presets',
    description: 'Choose from beautiful presets like Nord, Solarized, Monokai, and more. Each preset is carefully tuned for readability across every type of website.',
  },
  {
    icon: <Brain size={28} color="#f28b82" strokeWidth={1.8} />,
    iconClass: 'feature-icon--sunset',
    title: 'Smart Detection',
    description: 'Automatically detects sites that already have dark mode and skips them. No more double-darkened pages or broken layouts.',
  },
  {
    icon: <Globe size={28} color="#6c5ce7" strokeWidth={1.8} />,
    iconClass: 'feature-icon--schedule',
    title: 'Per-Site Memory',
    description: 'Remembers your preferred theme for each website. Your favorite news site gets Nord while your email stays Solarized.',
  },
  {
    icon: <PanelRight size={28} color="#81c995" strokeWidth={1.8} />,
    iconClass: 'feature-icon--settings',
    title: 'Side Panel Settings',
    description: 'Configure everything from Chrome\'s built-in Side Panel. Quick access to presets, scheduling, and per-site controls without leaving the page.',
  },
]

const schedulingFeatureItems = [
  {
    icon: <Monitor size={28} color="#8ab4f8" strokeWidth={1.8} />,
    iconClass: 'feature-icon--sync',
    title: 'OS Theme Sync',
    description: 'Automatically follows your device\'s dark mode setting. Toggle dark mode on your system and every website follows instantly.',
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
    description: 'Set a daily dark mode schedule. Handles midnight wrapping automatically so you never have to think about it.',
  },
  {
    icon: <Settings size={28} color="#81c995" strokeWidth={1.8} />,
    iconClass: 'feature-icon--settings',
    title: 'Zero Telemetry',
    description: 'All settings stay on your device using Chrome\'s built-in storage. No analytics, no tracking, no accounts. Your browsing is your business.',
  },
]

export function HomePage() {
  const extensionToken = useExtensionToken('browse')

  const handleCheckout = useCallback((product: string, plan: string) => {
    const token = getOrCreateToken(null, extensionToken)
    window.location.href = buildCheckoutUrl(CHECKOUT_API_URL, product, plan, token)
  }, [extensionToken])

  return (
    <>
      <Nav links={NAV_LINKS} cta={NAV_CTA} />
      <Hero
        title="Dark mode that<br />looks good"
        subtitle="Beautiful dark mode for every website. Curated presets, per-site memory, smart detection, and automatic scheduling."
        ctaText="Get Browse Darkly"
        ctaLink="#pricing"
        icon={<Globe size={48} color="#8ab4f8" strokeWidth={1.5} />}
      />
      <Features
        items={browseFeatureItems}
        sectionTitle="Dark mode done right"
        sectionSubtitle="Browse Darkly transforms any website with carefully crafted dark themes that preserve readability and visual hierarchy."
      />
      <Features
        items={schedulingFeatureItems}
        sectionTitle="Adapts to your rhythm"
        sectionSubtitle="Set it once and forget it. Browse Darkly follows your schedule, your OS, or the sun."
      />
      <Pricing
        product="browse"
        features={BROWSE_FEATURES}
        individualTiers={individualTiers}
        storeUrls={{ browse: STORE_URL }}
        onCheckout={handleCheckout}
      />
      <FAQ items={BROWSE_FAQ} />
      <Footer
        links={FOOTER_LINKS}
        copyrightName={SITE_NAME}
        trademarkText="Browse Darkly is not affiliated with or endorsed by Google."
      />
    </>
  )
}
