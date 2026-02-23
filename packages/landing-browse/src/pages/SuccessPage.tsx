import { Check, Globe, Download, ArrowRight } from 'lucide-react'
import { Nav, Footer, Wordmark } from '@darkly/landing-shared'
import { NAV_LINKS, NAV_CTA, FOOTER_LINKS, SITE_NAME, STORE_URL } from '../config.ts'

export function SuccessPage() {
  return (
    <>
      <Nav links={NAV_LINKS} cta={NAV_CTA} />

      <section style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '140px 24px 60px',
      }}>
        <div style={{ textAlign: 'center', maxWidth: 520 }}>
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
            <Check size={36} color="var(--color-success)" strokeWidth={2.5} />
          </div>

          <h1 style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--color-text)',
            marginBottom: 12,
          }}>
            Payment Successful
          </h1>

          <p style={{
            fontSize: '1.1rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
            marginBottom: 32,
          }}>
            Welcome to <Wordmark />! You now have full access to
            beautiful dark mode for every website.
          </p>

          <a
            href={STORE_URL}
            className="btn btn-primary"
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginBottom: 48, display: 'inline-flex' }}
          >
            <Globe size={18} strokeWidth={2} />
            <span className="btn-label">Install Browse Darkly</span>
          </a>
        </div>
      </section>

      <section style={{ paddingBottom: 100 }}>
        <div className="container" style={{ maxWidth: 520, textAlign: 'center' }}>
          <div style={{
            borderTop: '1px solid var(--color-border)',
            paddingTop: 40,
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--color-text)',
              marginBottom: 8,
            }}>
              Getting Started
            </h2>
            <p style={{
              fontSize: '0.95rem',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.6,
              marginBottom: 24,
            }}>
              Install the extension from the Chrome Web Store, then open any website to activate dark mode.
            </p>

            <div style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
              <a
                href={STORE_URL}
                className="btn btn-secondary"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download size={16} strokeWidth={2} />
                <span className="btn-label">Install Extension</span>
              </a>
              <a href="/" className="btn btn-outline">
                <ArrowRight size={16} strokeWidth={2} />
                <span className="btn-label">Back to Home</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer
        links={FOOTER_LINKS}
        copyrightName={SITE_NAME}
        trademarkText="Browse Darkly is not affiliated with or endorsed by Google."
      />
    </>
  )
}
