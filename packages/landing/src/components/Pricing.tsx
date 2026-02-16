import { Check } from 'lucide-react'
import { Link } from 'react-router-dom'

interface PricingTier {
  plan: string
  price: string
  period: string
  subtitle: string
  highlighted: boolean
  badge?: string
  cta: string
  link: string
}

interface PricingProps {
  product: 'gmail' | 'sheets' | 'docs' | 'suite'
  tiers?: PricingTier[]
  features?: string[]
}

const individualTiers = (product: string): PricingTier[] => [
  {
    plan: 'Monthly',
    price: '$0.99',
    period: '/mo',
    subtitle: 'Cancel anytime',
    highlighted: false,
    cta: 'Get Started',
    link: `/${product}`,
  },
  {
    plan: 'Yearly',
    price: '$9.99',
    period: '/yr',
    subtitle: 'Save 16%',
    highlighted: true,
    badge: 'Best Value',
    cta: 'Get Started',
    link: `/${product}`,
  },
  {
    plan: 'Lifetime',
    price: '$29.99',
    period: '',
    subtitle: 'One-time payment',
    highlighted: false,
    cta: 'Get Started',
    link: `/${product}`,
  },
]

const bundleTiers: PricingTier[] = [
  {
    plan: 'Monthly',
    price: '$2.99',
    period: '/mo',
    subtitle: 'Cancel anytime',
    highlighted: false,
    cta: 'Get the Suite',
    link: '/suite',
  },
  {
    plan: 'Yearly',
    price: '$29.99',
    period: '/yr',
    subtitle: 'Save 16%',
    highlighted: true,
    badge: 'Best Value',
    cta: 'Get the Suite',
    link: '/suite',
  },
  {
    plan: 'Lifetime',
    price: '$49.99',
    period: '',
    subtitle: 'One-time payment',
    highlighted: false,
    cta: 'Get the Suite',
    link: '/suite',
  },
]

const defaultFeatures = [
  'Dark mode for Gmail, Sheets, and Docs',
  'OS dark mode detection',
  'Manual toggle & keyboard shortcut',
  'Time-based scheduling',
  'Sunrise/sunset scheduling',
  'Cross-device sync',
  'In-app settings panel',
  'Priority email support',
]

export function Pricing({ product, tiers, features = defaultFeatures }: PricingProps) {
  const resolvedTiers = tiers ?? (product === 'suite' ? bundleTiers : individualTiers(product))

  return (
    <section id="pricing" className="pricing section">
      <div className="container">
        <div className="pricing-header">
          <span className="section-label">Pricing</span>
          <h2 className="section-title">Simple, transparent pricing</h2>
          <p className="section-subtitle">
            {product === 'suite'
              ? 'One subscription covers Gmail, Sheets, and Docs. Pick the billing cycle that works for you.'
              : 'One plan, every feature. Pick the billing cycle that works for you.'}
          </p>
        </div>
        <div className="pricing-tiers">
          {resolvedTiers.map((tier) => (
            <div
              key={tier.plan}
              className={`pricing-card ${tier.highlighted ? 'pricing-card--highlighted' : ''}`}
            >
              {tier.badge && <span className="pricing-badge">{tier.badge}</span>}
              <div className="pricing-plan">{tier.plan}</div>
              <div className="pricing-price">
                {tier.price}
                {tier.period && <span>{tier.period}</span>}
              </div>
              <div className="pricing-subtitle">{tier.subtitle}</div>
              <Link to={tier.link} className="btn btn-primary">
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
        <div className="pricing-features-section">
          <h3 className="pricing-features-title">Everything included</h3>
          <ul className="pricing-features-list">
            {features.map((feature) => (
              <li key={feature}>
                <Check size={18} className="check" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
