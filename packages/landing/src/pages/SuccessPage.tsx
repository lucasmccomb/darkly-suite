import { Nav } from '../components/Nav.tsx'
import { Footer } from '../components/Footer.tsx'
import { Wordmark } from '../components/Wordmark.tsx'
import { Check } from 'lucide-react'

export function SuccessPage() {
  return (
    <>
      <Nav />
      <section style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 24px 80px',
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
            <Check size={36} color="var(--color-success)" strokeWidth={2.5} />
          </div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--color-text)',
            marginBottom: 12,
          }}>
            Welcome to <Wordmark /> Pro!
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
            marginBottom: 32,
          }}>
            Your payment was successful. Pro features are now active --
            head back to your Google apps and enjoy the premium dark mode experience.
          </p>
          <a
            href="https://mail.google.com"
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              background: 'linear-gradient(135deg, var(--color-accent), var(--color-purple))',
              color: '#fff',
              fontWeight: 600,
              fontSize: '1rem',
              borderRadius: 'var(--radius)',
              textDecoration: 'none',
              transition: 'var(--transition)',
            }}
          >
            Open Gmail
          </a>
        </div>
      </section>
      <Footer />
    </>
  )
}
