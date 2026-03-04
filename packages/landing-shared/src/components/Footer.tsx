import { Link } from 'react-router-dom'
import { Wordmark } from './Wordmark.tsx'

interface FooterLink {
  to: string
  label: string
  external?: boolean
}

interface CwsBadge {
  url: string
  label: string
}

interface FooterProps {
  brandLabel?: string
  links: FooterLink[]
  copyrightName: string
  trademarkText?: string
  cwsBadge?: CwsBadge
}

export function Footer({
  brandLabel,
  links,
  copyrightName,
  trademarkText = 'Gmail, Google Sheets, Google Docs, and Google Drive are trademarks of Google LLC. Darkly is not affiliated with or endorsed by Google.',
  cwsBadge,
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
        {cwsBadge && (
          <div className="footer-cws-badge">
            <a href={cwsBadge.url} target="_blank" rel="noopener noreferrer" className="cws-badge">
              <svg className="cws-badge-icon" viewBox="0 0 192 192" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="96" cy="96" r="88" fill="none" stroke="currentColor" strokeWidth="8" />
                <circle cx="96" cy="96" r="36" fill="none" stroke="currentColor" strokeWidth="8" />
                <path d="M28.8 144L60 96" stroke="#ea4335" strokeWidth="8" strokeLinecap="round" />
                <path d="M60 96h72" stroke="#fbbc04" strokeWidth="8" strokeLinecap="round" />
                <path d="M132 96l-36 62.4" stroke="#34a853" strokeWidth="8" strokeLinecap="round" />
              </svg>
              <span className="cws-badge-text">{cwsBadge.label}</span>
            </a>
          </div>
        )}
        <div className="footer-bottom">
          <span className="footer-copyright">&copy; {new Date().getFullYear()} {copyrightName}. All rights reserved.</span>
          <span className="footer-trademark">{trademarkText}</span>
        </div>
      </div>
    </footer>
  )
}
