import { Check, FileText, Download, ArrowRight } from 'lucide-react'
import { Nav, Footer, Wordmark, useCheckoutComplete } from '@darkly/landing-shared'
import { NAV_LINKS, NAV_CTA, FOOTER_LINKS, SITE_NAME } from '../config.ts'

export function SuccessPage() {
  useCheckoutComplete('docs')

  return (
    <>
      <Nav brandLabel="for Docs" links={NAV_LINKS} cta={NAV_CTA} />

      <section style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '140px 24px 60px',
      }}>
        <div style={{ textAlign: 'center', maxWidth: 520 }}>
          {/* Checkmark icon */}
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
            Welcome to <Wordmark /> for Docs! You now have full access to
            intelligent dark mode for Google Docs.
          </p>

          {/* Return to Google Docs button */}
          <a
            href="https://docs.google.com/document"
            className="btn btn-primary"
            style={{ marginBottom: 48, display: 'inline-flex' }}
          >
            <FileText size={18} strokeWidth={2} />
            <span className="btn-label">Return to Google Docs</span>
          </a>
        </div>
      </section>

      {/* Continue Setup section */}
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
              Continue Setup
            </h2>
            <p style={{
              fontSize: '0.95rem',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.6,
              marginBottom: 24,
            }}>
              Need help getting started? Follow our setup guide.
            </p>

            <div style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
              <a href="/setup#step-4" className="btn btn-secondary">
                <ArrowRight size={16} strokeWidth={2} />
                <span className="btn-label">Extension Already Installed</span>
              </a>
              <a href="/setup" className="btn btn-outline">
                <Download size={16} strokeWidth={2} />
                <span className="btn-label">Install Extension</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer
        brandLabel="for Docs"
        links={FOOTER_LINKS}
        copyrightName={SITE_NAME}
        trademarkText="Google Docs is a trademark of Google LLC. Darkly is not affiliated with or endorsed by Google."
      />
    </>
  )
}
