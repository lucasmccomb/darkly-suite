import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Nav, Footer } from '@darkly/landing-shared'
import { NAV_LINKS, NAV_CTA, FOOTER_LINKS, SITE_NAME } from '../config.ts'

export function PrivacyPage() {
  return (
    <>
      <Nav links={NAV_LINKS} cta={NAV_CTA} />
      <section className="privacy">
        <div className="container">
          <Link to="/" className="privacy-back">
            <ChevronLeft size={16} />
            Back to home
          </Link>
          <h1 className="privacy-title">Privacy Policy</h1>
          <p className="privacy-updated">Last updated: February 22, 2026</p>

          <div className="privacy-content">
            <h2>Overview</h2>
            <p>
              Browse Darkly (&ldquo;Browse Darkly&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;) is a Chrome extension that applies
              dark mode themes to websites. We are committed to protecting your privacy.
            </p>
            <p>
              <strong>The short version:</strong> Browse Darkly does not collect, store, or transmit any personal data.
              All settings are stored locally on your device using Chrome&apos;s built-in storage API.
            </p>

            <h2>Data We Collect</h2>
            <p>
              Browse Darkly does not collect any personal information. We do not have user accounts, analytics,
              tracking pixels, or any server-side data storage. Specifically:
            </p>
            <ul>
              <li>No page content is read, accessed, or stored</li>
              <li>No browsing history is collected</li>
              <li>No personal identifiers are gathered</li>
              <li>No usage analytics or telemetry is sent</li>
              <li>No cookies are set by Browse Darkly</li>
              <li>No data is sold or shared with third parties</li>
            </ul>

            <h2>Data Stored Locally</h2>
            <p>
              Browse Darkly stores your theme preferences using <code>chrome.storage.sync</code>, which is
              Chrome&apos;s built-in storage mechanism. This data includes:
            </p>
            <ul>
              <li>Your selected theme preset and mode (dark, light, or auto)</li>
              <li>Per-site theme preferences</li>
              <li>Schedule preferences (time-based or sunrise/sunset)</li>
              <li>Enabled/disabled state</li>
            </ul>
            <p>
              This data syncs across your Chrome browsers when you are signed into Chrome, using
              Google&apos;s own sync infrastructure. Browse Darkly&apos;s servers never see this data.
            </p>

            <h2>Geolocation (Optional)</h2>
            <p>
              If you enable sunrise/sunset scheduling, Browse Darkly will request your approximate
              location through the browser&apos;s geolocation API. This location is:
            </p>
            <ul>
              <li>Used solely to calculate sunrise and sunset times via the public sunrise-sunset.org API</li>
              <li>Sent only to sunrise-sunset.org as latitude/longitude coordinates</li>
              <li>Never sent to Browse Darkly&apos;s servers</li>
              <li>Stored locally in Chrome&apos;s built-in storage and cached for up to 24 hours</li>
              <li>Requested only with your explicit permission via the browser&apos;s permission dialog</li>
            </ul>

            <h2>Chrome Extension Permissions</h2>
            <p>Browse Darkly requests the following Chrome permissions:</p>
            <ul>
              <li><strong>storage</strong> — to save your theme preferences locally</li>
              <li><strong>alarms</strong> — to schedule dark mode transitions at specific times</li>
              <li><strong>offscreen</strong> — to detect your OS dark mode setting</li>
              <li><strong>scripting</strong> — to apply the dark theme to websites</li>
              <li><strong>activeTab</strong> — to inject dark mode styles into the current tab</li>
              <li><strong>sidePanel</strong> — to provide settings through Chrome&apos;s Side Panel</li>
            </ul>

            <h2>Third-Party Services</h2>
            <p>Browse Darkly communicates with the following external services:</p>
            <ul>
              <li>
                <strong>sunrise-sunset.org</strong> — only when you opt in to sunrise/sunset scheduling.
                Receives your approximate coordinates and returns sunrise/sunset times.
              </li>
              <li>
                <strong>darklysuite.com</strong> — our payment API, used to validate your
                license. An anonymous device token (randomly generated UUID) is sent to check license status.
                No personal information is transmitted.
              </li>
              <li>
                <strong>Stripe</strong> — payment processing. You are redirected to Stripe-hosted checkout.
                Browse Darkly does not see or store your payment details. Stripe&apos;s{' '}
                <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">privacy policy</a>{' '}
                applies.
              </li>
            </ul>

            <h2>Data Security</h2>
            <p>
              Since Browse Darkly does not collect or transmit personal data, the security risk is minimal.
              Your preferences are protected by Chrome&apos;s built-in storage security.
            </p>

            <h2>Children&apos;s Privacy</h2>
            <p>
              Browse Darkly does not knowingly collect any information from children under 13.
            </p>

            <h2>Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. Changes will be reflected on this
              page with an updated &ldquo;Last updated&rdquo; date.
            </p>

            <h2>Contact</h2>
            <p>
              If you have questions about this privacy policy, contact us
              at <a href="mailto:support@browsedarkly.com">support@browsedarkly.com</a>.
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
