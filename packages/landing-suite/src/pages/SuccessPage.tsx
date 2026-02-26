import { useSearchParams } from 'react-router-dom'
import { Nav, Footer, Wordmark, SetupGuide, useCheckoutComplete } from '@darkly/landing-shared'
import { Check, RefreshCw, ArrowRight } from 'lucide-react'
import { NAV_LINKS, NAV_CTA, FOOTER_LINKS, SITE_NAME, STORE_URLS } from '../config.ts'

export function SuccessPage() {
  const [searchParams] = useSearchParams()
  const product = searchParams.get('product')
  const isRestored = searchParams.get('restored') === 'true'

  useCheckoutComplete(product)

  return (
    <>
      <Nav brandLabel="Suite" links={NAV_LINKS} cta={NAV_CTA} />
      <section style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 24px 48px',
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: 520,
        }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'rgba(129, 201, 149, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            {isRestored
              ? <RefreshCw size={36} color="var(--color-success)" strokeWidth={2.5} />
              : <Check size={36} color="var(--color-success)" strokeWidth={2.5} />}
          </div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--color-text)',
            marginBottom: 12,
          }}>
            {isRestored ? 'Purchase Restored' : <>Welcome to <Wordmark /> Suite!</>}
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
          }}>
            {isRestored
              ? <>Your <Wordmark /> Suite license has been restored. Return to any Google app to continue using dark mode.</>
              : <>Your payment was successful. Follow the steps below to get started with your premium dark mode experience.</>}
          </p>
          {isRestored && (
            <a
              href="https://mail.google.com"
              className="btn btn-primary"
              style={{ marginTop: 32, display: 'inline-flex' }}
            >
              <ArrowRight size={18} strokeWidth={2} />
              <span className="btn-label">Return to Gmail</span>
            </a>
          )}
        </div>
      </section>
      {!isRestored && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <SetupGuide activeTab={product} storeUrls={STORE_URLS} />
          </div>
        </section>
      )}
      <Footer brandLabel="Suite" links={FOOTER_LINKS} copyrightName={SITE_NAME} />
    </>
  )
}
