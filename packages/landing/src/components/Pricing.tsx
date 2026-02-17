import { Check, Mail, Table2, FileText, Package } from 'lucide-react'
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

type AppId = 'gmail' | 'sheets' | 'docs'

interface PricingProps {
  product: 'gmail' | 'sheets' | 'docs' | 'suite'
  selectedApp?: AppId | null
  onAppChange?: (app: AppId | null) => void
  features?: string[]
}

const APP_NAMES: Record<AppId, string> = {
  gmail: 'Darkly for Gmail',
  sheets: 'Darkly for Sheets',
  docs: 'Darkly for Docs',
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

const COMPARISON_FEATURES = [
  { name: 'Gmail dark mode', gmail: true, sheets: false, docs: false, suite: true },
  { name: 'Sheets dark mode', gmail: false, sheets: true, docs: false, suite: true },
  { name: 'Docs dark mode', gmail: false, sheets: false, docs: true, suite: true },
  { name: 'OS theme sync', gmail: true, sheets: true, docs: true, suite: true },
  { name: 'Keyboard shortcut', gmail: true, sheets: true, docs: true, suite: true },
  { name: 'Time-based scheduling', gmail: true, sheets: true, docs: true, suite: true },
  { name: 'Sunrise/sunset scheduling', gmail: true, sheets: true, docs: true, suite: true },
  { name: 'Cross-device sync', gmail: true, sheets: true, docs: true, suite: true },
  { name: 'Preserve Grid Colors', gmail: false, sheets: true, docs: false, suite: true },
  { name: 'In-app settings panel', gmail: true, sheets: true, docs: true, suite: true },
  { name: 'Priority email support', gmail: true, sheets: true, docs: true, suite: true },
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

export function Pricing({ product, selectedApp, onAppChange, features = defaultFeatures }: PricingProps) {
  const isDualMode = onAppChange !== undefined
  const appLink = selectedApp ?? 'gmail'

  // On individual product pages, keep existing single-product behavior
  if (!isDualMode) {
    const resolvedTiers = product === 'suite' ? bundleTiers : individualTiers(product)

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

  // Dual-mode: home page with single app row + suite row
  const singleTiers = individualTiers(appLink)

  return (
    <section id="pricing" className="pricing section">
      <div className="container">
        <div className="pricing-header">
          <span className="section-label">Pricing</span>
          <h2 className="section-title">Simple, transparent pricing</h2>
          <p className="section-subtitle">
            Get dark mode for a single app or save with the full suite.
          </p>
        </div>

        <div className="pricing-row">
          <div className="pricing-row-head">
            <h3 className="pricing-row-title">Full Suite</h3>
            <p className="pricing-row-desc">All three apps, one price</p>
          </div>
          <div className="pricing-tiers">
            {bundleTiers.map((tier) => (
              <div
                key={tier.plan}
                className={`pricing-card pricing-card--suite ${tier.highlighted ? 'pricing-card--highlighted' : ''}`}
              >
                {tier.badge && <span className="pricing-badge">{tier.badge}</span>}
                <div className="pricing-plan">{tier.plan}</div>
                <div className="pricing-suite-icons">
                  <Mail size={22} color="#8ab4f8" strokeWidth={1.8} />
                  <Table2 size={22} color="#81c995" strokeWidth={1.8} />
                  <FileText size={22} color="#f28b82" strokeWidth={1.8} />
                </div>
                <div className="pricing-suite-label">Gmail, Sheets & Docs</div>
                <div className="pricing-price">
                  {tier.price}
                  {tier.period && <span>{tier.period}</span>}
                </div>
                <div className="pricing-subtitle">{tier.subtitle}</div>
                <Link to="/suite" className="btn btn-primary">
                  Get the Suite
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="pricing-row">
          <div className="pricing-row-head">
            <h3 className="pricing-row-title">Single App</h3>
            <p className="pricing-row-desc">Dark mode for one Google app</p>
          </div>
          <div className="pricing-tiers">
            {singleTiers.map((tier) => (
              <div
                key={tier.plan}
                className={`pricing-card ${tier.highlighted ? 'pricing-card--highlighted' : ''}`}
              >
                {tier.badge && <span className="pricing-badge">{tier.badge}</span>}
                <div className="pricing-plan">{tier.plan}</div>
                <div className="pricing-choose-label">Choose 1</div>
                <div className={`pricing-app-icons ${selectedApp ? 'pricing-app-icons--has-selection' : ''}`}>
                  <span className={`pricing-app-icon-wrap ${selectedApp === 'gmail' ? 'pricing-app-icon--active' : ''}`}>
                    <Mail size={24} color="#8ab4f8" strokeWidth={1.8} />
                  </span>
                  <span className="pricing-icon-or">or</span>
                  <span className={`pricing-app-icon-wrap ${selectedApp === 'sheets' ? 'pricing-app-icon--active' : ''}`}>
                    <Table2 size={24} color="#81c995" strokeWidth={1.8} />
                  </span>
                  <span className="pricing-icon-or">or</span>
                  <span className={`pricing-app-icon-wrap ${selectedApp === 'docs' ? 'pricing-app-icon--active' : ''}`}>
                    <FileText size={24} color="#f28b82" strokeWidth={1.8} />
                  </span>
                </div>
                <div className="pricing-price">
                  {tier.price}
                  {tier.period && <span>{tier.period}</span>}
                </div>
                <div className="pricing-subtitle">{tier.subtitle}</div>
                <div className="pricing-app-select-wrapper">
                  {selectedApp && (
                    <span className="pricing-app-select-icon">
                      {selectedApp === 'gmail' && <Mail size={16} color="#8ab4f8" strokeWidth={1.8} />}
                      {selectedApp === 'sheets' && <Table2 size={16} color="#81c995" strokeWidth={1.8} />}
                      {selectedApp === 'docs' && <FileText size={16} color="#f28b82" strokeWidth={1.8} />}
                    </span>
                  )}
                  <select
                    className={`pricing-app-select ${selectedApp ? 'pricing-app-select--has-icon' : ''}`}
                    value={selectedApp ?? ''}
                    onChange={(e) => onAppChange(e.target.value ? e.target.value as AppId : null)}
                  >
                    <option value="">Select app</option>
                    <option value="gmail">Darkly for Gmail</option>
                    <option value="sheets">Darkly for Sheets</option>
                    <option value="docs">Darkly for Docs</option>
                  </select>
                </div>
                {selectedApp ? (
                  <Link to={`/${selectedApp}`} className="btn btn-primary">
                    {selectedApp === 'gmail' && <Mail size={16} color="#8ab4f8" strokeWidth={1.8} />}
                    {selectedApp === 'sheets' && <Table2 size={16} color="#81c995" strokeWidth={1.8} />}
                    {selectedApp === 'docs' && <FileText size={16} color="#f28b82" strokeWidth={1.8} />}
                    Get {APP_NAMES[selectedApp]}
                  </Link>
                ) : (
                  <span className="btn btn-primary btn-disabled">Get Single App</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pricing-comparison">
          <h3 className="pricing-comparison-title">Compare plans</h3>
          <div className="pricing-comparison-wrap">
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>
                    <Mail size={18} color="#8ab4f8" strokeWidth={1.8} />
                    <span>Darkly for Gmail</span>
                  </th>
                  <th>
                    <Table2 size={18} color="#81c995" strokeWidth={1.8} />
                    <span>Darkly for Sheets</span>
                  </th>
                  <th>
                    <FileText size={18} color="#f28b82" strokeWidth={1.8} />
                    <span>Darkly for Docs</span>
                  </th>
                  <th className="pricing-comparison-suite-col">
                    <Package size={18} color="#f5c842" strokeWidth={1.8} />
                    <span>Darkly Suite</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_FEATURES.map((f) => (
                  <tr key={f.name}>
                    <td>{f.name}</td>
                    <td>{f.gmail ? <Check size={16} className="check" /> : <span className="pricing-comparison-dash">&mdash;</span>}</td>
                    <td>{f.sheets ? <Check size={16} className="check" /> : <span className="pricing-comparison-dash">&mdash;</span>}</td>
                    <td>{f.docs ? <Check size={16} className="check" /> : <span className="pricing-comparison-dash">&mdash;</span>}</td>
                    <td className="pricing-comparison-suite-col">{f.suite ? <Check size={16} className="check" /> : <span className="pricing-comparison-dash">&mdash;</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
