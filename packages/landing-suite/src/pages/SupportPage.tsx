import { Link } from 'react-router-dom'
import { ChevronLeft, Mail, Clock, Shield } from 'lucide-react'
import { Nav, Footer } from '@darkly/landing-shared'
import { NAV_LINKS, NAV_CTA, FOOTER_LINKS, SITE_NAME } from '../config.ts'

export function SupportPage() {
  return (
    <>
      <Nav brandLabel="Suite" links={NAV_LINKS} cta={NAV_CTA} />
      <section className="support">
        <div className="container">
          <Link to="/" className="support-back">
            <ChevronLeft size={16} />
            Back to home
          </Link>
          <h1 className="support-title">Support</h1>
          <p className="support-subtitle">
            We&apos;re here to help. Find answers below or reach out directly.
          </p>

          <div className="support-cards">
            <div className="support-card">
              <Mail size={24} className="support-card-icon" />
              <h3>Email Support</h3>
              <p>Get help with billing, technical issues, or general questions.</p>
              <a href="mailto:support@darklysuite.com" className="support-card-link">
                support@darklysuite.com
              </a>
            </div>
            <div className="support-card">
              <Clock size={24} className="support-card-icon" />
              <h3>Response Time</h3>
              <p>We typically respond within 24 hours on business days.</p>
            </div>
          </div>

          <div className="support-content">
            <h2>Frequently Asked Questions</h2>

            <h3>How do I activate dark mode after installing?</h3>
            <p>
              Click the Darkly icon in your toolbar. If you haven&apos;t subscribed yet, you&apos;ll
              see the pricing options. After subscribing, dark mode activates automatically. Visit
              the <Link to="/setup">setup guide</Link> for detailed instructions.
            </p>

            <h3>I subscribed but dark mode isn&apos;t working</h3>
            <p>
              Try refreshing the page (Ctrl+R / Cmd+R). If the issue persists, close and reopen the
              tab. Your subscription status is cached locally and refreshes when you return to the
              tab. If it still doesn&apos;t work, email us with your subscription details.
            </p>

            <h3>How do I manage or cancel my subscription?</h3>
            <p>
              Open the Darkly settings panel and click &ldquo;Manage Subscription&rdquo;. This opens
              the Stripe customer portal where you can update your payment method, change your plan,
              or cancel.
            </p>

            <h3>Can I upgrade from a single app to the Suite?</h3>
            <p>
              Yes! Contact us at{' '}
              <a href="mailto:support@darklysuite.com">support@darklysuite.com</a> and
              we&apos;ll apply a prorated credit toward your bundle subscription.
            </p>

            <h3>Does Darkly work with Google Workspace?</h3>
            <p>
              Yes. Darkly works with personal Google accounts, Google Workspace, and Google Workspace
              for Education.
            </p>

            <h3>Does Darkly collect my data?</h3>
            <p>
              No. Darkly stores all settings locally using Chrome&apos;s storage API. We have no
              analytics, no tracking, and no user accounts. See our{' '}
              <Link to="/privacy">privacy policy</Link> for full details.
            </p>

            <h3>I found a bug or have a feature request</h3>
            <p>
              Email us at{' '}
              <a href="mailto:support@darklysuite.com">support@darklysuite.com</a> with
              a description of the issue or your idea. Screenshots are always helpful for bug reports.
            </p>
          </div>

          <div className="support-footer-section">
            <Shield size={20} className="support-footer-icon" />
            <p>
              Your privacy matters. Darkly never accesses your email content, documents, or
              spreadsheet data. <Link to="/privacy">Read our privacy policy</Link>.
            </p>
          </div>
        </div>
      </section>
      <Footer brandLabel="Suite" links={FOOTER_LINKS} copyrightName={SITE_NAME} />
    </>
  )
}
