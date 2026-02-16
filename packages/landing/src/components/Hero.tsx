import { Link } from 'react-router-dom'
import { BrandLogo } from './BrandLogo.tsx'
import { ShieldCheck } from 'lucide-react'

interface HeroProps {
  title: string
  subtitle: string
  ctaText: string
  ctaLink: string
  badge?: string
}

export function Hero({ title, subtitle, ctaText, ctaLink, badge }: HeroProps) {
  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-icon">
          <BrandLogo glow />
        </div>
        <h1 className="hero-title" dangerouslySetInnerHTML={{ __html: title }} />
        <p className="hero-subtitle">{subtitle}</p>
        <div className="hero-cta">
          <Link to={ctaLink} className="btn btn-primary">
            <span className="btn-label">{ctaText}</span>
          </Link>
          <a href="#features" className="btn btn-secondary">
            See Features
          </a>
        </div>
        <div className="hero-badge">
          <ShieldCheck size={20} />
          <span>{badge ?? 'No data collected. No tracking. 100% private.'}</span>
        </div>
      </div>
    </section>
  )
}
