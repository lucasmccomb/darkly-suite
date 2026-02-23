import { useSearchParams } from 'react-router-dom'
import { useCallback } from 'react'
import { Check } from 'lucide-react'
import type { PricingTier } from './Pricing.tsx'
import { buildCheckoutUrl, getOrCreateToken } from '../utils/checkout.ts'
import { useExtensionToken } from '../hooks/useExtensionToken.ts'

interface SubscribeContentProps {
  product: string
  productName: string
  tiers: PricingTier[]
  features?: string[]
  checkoutBaseUrl: string
  setupPath?: string
}

export function SubscribeContent({
  product,
  productName,
  tiers,
  features,
  checkoutBaseUrl,
  setupPath = '/setup',
}: SubscribeContentProps) {
  const [searchParams] = useSearchParams()
  const urlToken = searchParams.get('token')
  const email = searchParams.get('email') || undefined
  const extensionToken = useExtensionToken(product)
  const token = getOrCreateToken(urlToken, extensionToken)

  const handleSubscribe = useCallback(
    (plan: string) => {
      window.location.href = buildCheckoutUrl(checkoutBaseUrl, product, plan, token, email)
    },
    [checkoutBaseUrl, product, token, email],
  )

  return (
    <>
      <section style={{ textAlign: 'center', padding: '120px 24px 0' }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <span className="section-label">Subscribe</span>
          <h1
            className="section-title"
            style={{ fontSize: '2.25rem', marginTop: 12 }}
          >
            Choose your plan
          </h1>
          <p className="section-subtitle">
            Unlock all {productName} features with the plan that works for you.
          </p>
        </div>
      </section>

      <section className="pricing section" style={{ paddingTop: 32 }}>
        <div className="container">
          <div className="pricing-tiers">
            {tiers.map((tier) => {
              const plan = tier.plan.toLowerCase()
              const isLifetime = plan === 'lifetime'

              return (
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
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleSubscribe(plan)}
                  >
                    {isLifetime ? 'One-time payment' : 'Subscribe'}
                  </button>
                </div>
              )
            })}
          </div>

          {features && features.length > 0 && (
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
          )}
        </div>
      </section>

      <section style={{ textAlign: 'center', padding: '0 24px 60px' }}>
        <a
          href={setupPath}
          style={{
            color: 'var(--color-text-secondary)',
            fontSize: '0.9rem',
            textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}
        >
          Already subscribed? Go to setup →
        </a>
      </section>
    </>
  )
}
