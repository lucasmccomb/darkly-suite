import { Nav } from '../components/Nav.tsx'
import { Hero } from '../components/Hero.tsx'
import { Features } from '../components/Features.tsx'
import { Pricing } from '../components/Pricing.tsx'
import { ProductCard } from '../components/ProductCard.tsx'
import { FAQ } from '../components/FAQ.tsx'
import { Footer } from '../components/Footer.tsx'
import { Mail, Table2, FileText, Package } from 'lucide-react'

export function HomePage() {
  return (
    <>
      <Nav />
      <Hero
        title="Premium dark mode<br />for Google apps"
        subtitle="Automatic dark mode scheduling, OS theme sync, and intelligent styling for Gmail, Sheets, and Docs."
        ctaText="Get the Suite"
        ctaLink="/suite"
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
              name="Gmail Darkly"
              description="Dark mode for Gmail with intelligent scheduling and OS theme sync."
              icon={<Mail size={28} color="#8ab4f8" strokeWidth={1.8} />}
              link="/gmail"
              price="$0.99/mo"
            />
            <ProductCard
              name="Sheets Darkly"
              description="Dark mode for Google Sheets with cell grid awareness and formula bar styling."
              icon={<Table2 size={28} color="#81c995" strokeWidth={1.8} />}
              link="/sheets"
              price="$0.99/mo"
            />
            <ProductCard
              name="Docs Darkly"
              description="Dark mode for Google Docs with canvas rendering and document styling."
              icon={<FileText size={28} color="#f28b82" strokeWidth={1.8} />}
              link="/docs"
              price="$0.99/mo"
            />
            <ProductCard
              name="Darkly Suite"
              description="All three apps in one bundle. One license, one price, full coverage."
              icon={<Package size={28} color="#a29bfe" strokeWidth={1.8} />}
              link="/suite"
              price="$2.99/mo"
            />
          </div>
        </div>
      </section>
      <Features />
      <Pricing product="suite" />
      <FAQ />
      <Footer />
    </>
  )
}
