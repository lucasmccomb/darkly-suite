import { Link } from 'react-router-dom'
import { ChevronLeft, Mail, Clock, Shield } from 'lucide-react'
import { Nav, Footer } from '@darkly/landing-shared'
import { NAV_LINKS, NAV_CTA, FOOTER_LINKS, SITE_NAME } from '../config.ts'

export function SupportPage() {
  return (
    <>
      <Nav links={NAV_LINKS} cta={NAV_CTA} />
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
              <a href="mailto:support@browsedarkly.com" className="support-card-link">
                support@browsedarkly.com
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
              After installing Browse Darkly from the Chrome Web Store, open any website.
              Click the Browse Darkly icon in your toolbar to toggle dark mode. If you
              haven&apos;t subscribed yet, you&apos;ll see the pricing options.
            </p>

            <h3>I subscribed but dark mode isn&apos;t working</h3>
            <p>
              Try refreshing the page (Ctrl+R / Cmd+R). If the issue persists, close and reopen the
              tab. Your subscription status is cached locally and refreshes when you return to the
              tab. If it still doesn&apos;t work, email us with your subscription details.
            </p>

            <h3>How do I manage or cancel my subscription?</h3>
            <p>
              Open the Browse Darkly side panel and click &ldquo;Manage Subscription&rdquo;. This opens
              the Stripe customer portal where you can update your payment method, change your plan,
              or cancel.
            </p>

            <h3>Can I choose different themes for different websites?</h3>
            <p>
              Yes! Browse Darkly remembers your preferred preset for each website. Open the side panel
              on any site and select the preset you want. It will be remembered for future visits.
            </p>

            <h3>Some websites look broken with dark mode</h3>
            <p>
              If a website doesn&apos;t look right, you can disable Browse Darkly for that specific site
              from the side panel. You can also try a different preset, as some work better on certain
              types of sites. If you find a consistently broken site, email us and we&apos;ll look into it.
            </p>

            <h3>Does Browse Darkly collect my data?</h3>
            <p>
              No. Browse Darkly stores all settings locally using Chrome&apos;s storage API. We have no
              analytics, no tracking, and no user accounts. See our{' '}
              <Link to="/privacy">privacy policy</Link> for full details.
            </p>

            <h3>I found a bug or have a feature request</h3>
            <p>
              Email us at{' '}
              <a href="mailto:support@browsedarkly.com">support@browsedarkly.com</a> with
              a description of the issue or your idea. Screenshots are always helpful for bug reports.
            </p>
          </div>

          <div className="support-footer-section">
            <Shield size={20} className="support-footer-icon" />
            <p>
              Your privacy matters. Browse Darkly never accesses your page content or browsing
              history. <Link to="/privacy">Read our privacy policy</Link>.
            </p>
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
