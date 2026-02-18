import { Link } from 'react-router-dom'
import { Wordmark } from './Wordmark.tsx'

interface FooterLink {
  to: string
  label: string
  external?: boolean
}

interface FooterProps {
  brandLabel?: string
  links: FooterLink[]
  copyrightName: string
  trademarkText?: string
}

export function Footer({
  brandLabel,
  links,
  copyrightName,
  trademarkText = 'Gmail, Google Sheets, and Google Docs are trademarks of Google LLC. Darkly is not affiliated with or endorsed by Google.',
}: FooterProps) {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <Wordmark /> {brandLabel && <span className="footer-suite-label">{brandLabel}</span>}
          </div>
          <div className="footer-links">
            {links.map((link) =>
              link.external ? (
                <a key={link.to} href={link.to}>{link.label}</a>
              ) : (
                <Link key={link.to} to={link.to}>{link.label}</Link>
              )
            )}
          </div>
        </div>
        <div className="footer-bottom">
          <span className="footer-copyright">&copy; {new Date().getFullYear()} {copyrightName}. All rights reserved.</span>
          <span className="footer-trademark">{trademarkText}</span>
        </div>
      </div>
    </footer>
  )
}
