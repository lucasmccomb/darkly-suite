import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Nav, Footer } from '@darkly/landing-shared'
import { NAV_LINKS, NAV_CTA, FOOTER_LINKS, SITE_NAME } from '../config.ts'

export function PrivacyPage() {
  return (
    <>
      <Nav brandLabel="Suite" links={NAV_LINKS} cta={NAV_CTA} />
      <section className="privacy">
        <div className="container">
          <Link to="/" className="privacy-back">
            <ChevronLeft size={16} />
            Back to home
          </Link>
          <h1 className="privacy-title">Privacy Policy</h1>
          <p className="privacy-updated">Last updated: July 10, 2026</p>

          <div className="privacy-content">
            <h2>Overview</h2>
            <p>
              Darkly Suite (&ldquo;Darkly&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;) is a family of Chrome extensions that apply dark mode
              themes to Google apps (Gmail, Sheets, Docs, Drive). We are committed to protecting your privacy.
              This policy covers all Darkly products: Darkly for Gmail, Darkly for Sheets, Darkly for Docs, and the
              Darkly Suite bundle (which includes Drive).
            </p>
            <p>
              <strong>The short version:</strong> Darkly stores your settings locally on your device.
              The only personal data we keep is the email address you sign in with when purchasing
              or restoring a subscription, which is stored in our license database.
            </p>

            <h2>Data We Collect</h2>
            <p>
              Darkly does not use analytics, tracking pixels, or advertising identifiers. The one
              piece of personal information we store is collected when you purchase or restore a
              subscription: you sign in with Google on darklysuite.com, and the email address from
              that sign-in is saved server-side in our license database, linked to the
              extension&apos;s anonymous device token. Beyond that:
            </p>
            <ul>
              <li>No email content or document content is read, accessed, or stored</li>
              <li>No browsing history is collected</li>
              <li>The extension itself never reads your email address or any other personal identifier</li>
              <li>No usage analytics or telemetry is sent</li>
              <li>The extension sets no cookies; darklysuite.com sets session cookies when you sign in to the account portal</li>
              <li>No data is sold or shared with third parties</li>
            </ul>

            <h2>Data Stored Locally</h2>
            <p>
              Darkly stores your theme preferences using <code>chrome.storage.sync</code>, which is
              Chrome&apos;s built-in storage mechanism. This data includes:
            </p>
            <ul>
              <li>Your selected theme mode (dark, light, or auto)</li>
              <li>Schedule preferences (time-based or sunrise/sunset)</li>
              <li>Enabled/disabled state</li>
            </ul>
            <p>
              This data syncs across your Chrome browsers when you are signed into Chrome, using
              Google&apos;s own sync infrastructure. Darkly&apos;s servers never see this data.
            </p>

            <h2>Geolocation (Optional)</h2>
            <p>
              If you enable sunrise/sunset scheduling, Darkly will request your approximate
              location through the browser&apos;s geolocation API. This location is:
            </p>
            <ul>
              <li>Used solely to calculate sunrise and sunset times via the public sunrise-sunset.org API</li>
              <li>Rounded to 1 decimal place (~11 km) and sent only to sunrise-sunset.org as approximate latitude/longitude coordinates</li>
              <li>Never sent to Darkly&apos;s servers</li>
              <li>Stored locally in Chrome&apos;s built-in storage and cached for up to 24 hours</li>
              <li>Requested only with your explicit permission via the browser&apos;s permission dialog</li>
            </ul>

            <h2>Third-Party Services</h2>
            <p>Darkly communicates with the following external services:</p>
            <ul>
              <li>
                <strong>sunrise-sunset.org</strong> -- only when you opt in to sunrise/sunset scheduling.
                Receives your approximate coordinates and returns sunrise/sunset times.
              </li>
              <li>
                <strong>darklysuite.com</strong> -- our payment API, used to validate your
                license. Routine license checks send only an anonymous device token (randomly generated
                UUID). When you purchase or restore a subscription, you sign in with Google on
                darklysuite.com and the email address from that sign-in is stored in our license
                database alongside your license.
              </li>
              <li>
                <strong>Stripe</strong> -- payment processing. You are redirected to Stripe-hosted checkout.
                Darkly does not see or store your payment details. Stripe&apos;s{' '}
                <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">privacy policy</a>{' '}
                applies.
              </li>
            </ul>

            <h2>Chrome Identity &amp; License Recovery</h2>
            <p>
              If you are signed into Chrome, your Chrome account email may be used to automatically
              recover your subscription if the local license token is lost (e.g., after a Chrome data
              reset or reinstallation). This email is sent only to darklysuite.com for license
              verification and is never stored beyond the existing license record. It is never used
              for marketing, analytics, or shared with third parties.
            </p>

            <h2>Data Security</h2>
            <p>
              Your preferences are protected by Chrome&apos;s built-in storage security. The purchase
              email in our license database is transmitted only over HTTPS, is never sold or shared,
              and is used solely to manage your subscription.
            </p>

            <h2>Children&apos;s Privacy</h2>
            <p>
              Darkly does not knowingly collect any information from children under 13.
            </p>

            <h2>Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. Changes will be reflected on this
              page with an updated &ldquo;Last updated&rdquo; date.
            </p>

            <h2>Contact</h2>
            <p>
              If you have questions about this privacy policy, contact us
              at <a href="mailto:admin@darklysuite.com">admin@darklysuite.com</a>.
            </p>
          </div>
        </div>
      </section>
      <Footer brandLabel="Suite" links={FOOTER_LINKS} copyrightName={SITE_NAME} />
    </>
  )
}
