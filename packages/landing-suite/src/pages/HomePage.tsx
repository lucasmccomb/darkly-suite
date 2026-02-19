import { useState, useCallback } from 'react'
import { Nav, Hero, Features, Pricing, ProductCard, FAQ, Footer, SuiteIcon } from '@darkly/landing-shared'
import type { ScreenshotImage } from '@darkly/landing-shared'
import { Mail, Table2, FileText } from 'lucide-react'
import { NAV_LINKS, NAV_CTA, FOOTER_LINKS, SITE_NAME, STORE_URLS, individualTiers, bundleTiers, COMPARISON_FEATURES } from '../config.ts'

type AppId = 'gmail' | 'sheets' | 'docs'

const heroScreenshots: ScreenshotImage[] = [
  { src: '/images/screenshots/split-view.jpg', alt: 'Gmail with Darkly dark mode — split view showing light and dark halves' },
  { src: '/images/screenshots/panel-open-dark.jpg', alt: 'Gmail in dark mode with Darkly settings panel open' },
]

const featureScreenshots: ScreenshotImage[] = [
  { src: '/images/screenshots/panel-views.jpg', alt: 'All Darkly theme modes — Schedule, Default, Sunrise/Sunset, and System' },
]

export function HomePage() {
  const [selectedApp, setSelectedApp] = useState<AppId | null>(null)

  const selectAndScroll = useCallback((app: AppId) => {
    setSelectedApp(app)
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  return (
    <>
      <Nav brandLabel="Suite" links={NAV_LINKS} cta={NAV_CTA} />
      <Hero
        title="Premium dark mode<br />for Google apps"
        subtitle="Automatic dark mode scheduling, OS theme sync, and intelligent styling for Gmail, Sheets, and Docs."
        ctaText="Get the Suite"
        ctaLink="/suite"
        screenshots={heroScreenshots}
      />
      <section className="products section">
        <div className="container">
          <div className="products-header">
            <span className="section-label">Products</span>
            <h2 className="section-title">Choose your coverage</h2>
            <p className="section-subtitle">
              Get dark mode for a single app or save with the full suite.
            </p>
          </div>
          <div className="products-grid">
            <ProductCard
              name="Darkly for Gmail"
              description="Dark mode for Gmail with intelligent scheduling and OS theme sync."
              icon={<Mail size={28} color="#ea4335" strokeWidth={1.8} />}
              link="/gmail"
              price="$0.99/mo"
              onClick={() => selectAndScroll('gmail')}
            />
            <ProductCard
              name="Darkly for Sheets"
              description="Dark mode for Google Sheets with cell grid awareness and formula bar styling."
              icon={<Table2 size={28} color="#81c995" strokeWidth={1.8} />}
              link="/sheets"
              price="$0.99/mo"
              onClick={() => selectAndScroll('sheets')}
            />
            <ProductCard
              name="Darkly for Docs"
              description="Dark mode for Google Docs with canvas rendering and document styling."
              icon={<FileText size={28} color="#4285f4" strokeWidth={1.8} />}
              link="/docs"
              price="$0.99/mo"
              onClick={() => selectAndScroll('docs')}
            />
            <ProductCard
              name="Darkly Suite"
              description="All three apps in one bundle. One license, one price, full coverage."
              icon={<SuiteIcon size={28} />}
              link="/suite"
              price="$2.99/mo"
            />
          </div>
        </div>
      </section>
      <Features screenshots={featureScreenshots} />
      <Pricing
        product="suite"
        selectedApp={selectedApp}
        onAppChange={setSelectedApp}
        individualTiers={individualTiers}
        bundleTiers={bundleTiers}
        comparisonFeatures={COMPARISON_FEATURES}
        storeUrls={STORE_URLS}
      />
      <FAQ />
      <Footer brandLabel="Suite" links={FOOTER_LINKS} copyrightName={SITE_NAME} />
    </>
  )
}
