import { Wordmark } from './Wordmark.tsx'

interface PromoTileProps {
  product?: string
  taglines?: string[]
}

export function PromoTile({
  product = 'for Gmail',
  taglines = [
    '\u{1F441}\uFE0F Save your eyes \u{1F441}\uFE0F',
    '\u{1F9E0} Intelligent dark mode \u{1F319}',
  ],
}: PromoTileProps) {
  return (
    <div className="promo-tile">
      <div className="promo-tile-content">
        <div className="promo-tile-brand">
          <Wordmark />
          {product && <span className="promo-tile-product">{product}</span>}
        </div>
        <div className="promo-tile-tagline">
          {taglines.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>
    </div>
  )
}
