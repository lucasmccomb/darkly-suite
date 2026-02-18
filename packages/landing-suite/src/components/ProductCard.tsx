import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'

interface ProductCardProps {
  name: string
  description: string
  icon: ReactNode
  link: string
  price: string
  onClick?: () => void
}

export function ProductCard({ name, description, icon, link, price, onClick }: ProductCardProps) {
  if (onClick) {
    return (
      <button type="button" className="product-card" onClick={onClick}>
        <div className="product-card-icon">{icon}</div>
        <h3 className="product-card-name">{name}</h3>
        <p className="product-card-desc">{description}</p>
        <div className="product-card-footer">
          <span className="product-card-price">From {price}</span>
          <ArrowRight size={16} />
        </div>
      </button>
    )
  }

  return (
    <Link to={link} className="product-card">
      <div className="product-card-icon">{icon}</div>
      <h3 className="product-card-name">{name}</h3>
      <p className="product-card-desc">{description}</p>
      <div className="product-card-footer">
        <span className="product-card-price">From {price}</span>
        <ArrowRight size={16} />
      </div>
    </Link>
  )
}
