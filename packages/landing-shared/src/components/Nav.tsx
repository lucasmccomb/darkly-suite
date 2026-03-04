import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Wordmark } from './Wordmark.tsx'

interface NavLink {
  to: string
  label: string
  external?: boolean
}

interface NavCta {
  to: string
  label: string
  external?: boolean
}

interface NavProps {
  brandLabel?: string
  links: NavLink[]
  cta: NavCta
}

export function Nav({ brandLabel, links, cta }: NavProps) {
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
          <Wordmark /> {brandLabel && <span className="nav-suite-label">{brandLabel}</span>}
        </Link>
        <div className="nav-links">
          {links.map((link) =>
            link.external ? (
              <a key={link.to} href={link.to}>{link.label}</a>
            ) : (
              <Link key={link.to} to={link.to}>{link.label}</Link>
            )
          )}
        </div>
        <div className="nav-cta">
          {cta.external ? (
            <a href={cta.to} className="btn btn-primary" target="_blank" rel="noopener noreferrer">
              <span className="btn-label">{cta.label}</span>
            </a>
          ) : (
            <Link to={cta.to} className="btn btn-primary">
              <span className="btn-label">{cta.label}</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
