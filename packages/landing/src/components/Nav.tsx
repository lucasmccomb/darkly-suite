import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Wordmark } from './Wordmark.tsx'

export function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 40)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
      <div className="nav-inner">
        <Link to="/" className="nav-brand">
          <Wordmark /> <span className="nav-suite-label">Suite</span>
        </Link>
        <div className="nav-links">
          <Link to="/gmail">Gmail</Link>
          <Link to="/sheets">Sheets</Link>
          <Link to="/docs">Docs</Link>
          <Link to="/suite">Bundle</Link>
          <Link to="/setup">Setup</Link>
          <a href="/#pricing">Pricing</a>
          <Link to="/privacy">Privacy</Link>
        </div>
        <div className="nav-cta">
          <Link to="/suite" className="btn btn-primary">
            <span className="btn-label">Get the Suite</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
