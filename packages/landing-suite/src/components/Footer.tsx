import { Link } from 'react-router-dom'
import { Wordmark } from './Wordmark.tsx'

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <Wordmark /> <span className="footer-suite-label">Suite</span>
          </div>
          <div className="footer-links">
            <Link to="/gmail">Gmail</Link>
            <Link to="/sheets">Sheets</Link>
            <Link to="/docs">Docs</Link>
            <Link to="/suite">Bundle</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/support">Support</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span className="footer-copyright">&copy; {new Date().getFullYear()} Darkly Suite. All rights reserved.</span>
          <span className="footer-trademark">Gmail, Google Sheets, Google Docs, and Google Drive are trademarks of Google LLC. Darkly is not affiliated with or endorsed by Google.</span>
        </div>
      </div>
    </footer>
  )
}
