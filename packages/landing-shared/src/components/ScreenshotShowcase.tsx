interface ScreenshotImage {
  src: string
  alt: string
}

export function HeroScreenshots({ images }: { images: ScreenshotImage[] }) {
  if (images.length === 0) return null
  return (
    <div className="hero-screenshots">
      {images.map((img) => (
        <div key={img.src} className="hero-screenshot">
          <img src={img.src} alt={img.alt} loading="eager" />
        </div>
      ))}
    </div>
  )
}

export function FeatureScreenshots({ images }: { images: ScreenshotImage[] }) {
  if (images.length === 0) return null
  return (
    <div className="feature-screenshots">
      {images.map((img) => (
        <div key={img.src} className="feature-screenshot">
          <img src={img.src} alt={img.alt} loading="lazy" />
        </div>
      ))}
    </div>
  )
}

export type { ScreenshotImage }
