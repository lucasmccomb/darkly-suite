import { useState, useCallback, useEffect } from 'react'
import { X } from 'lucide-react'

interface ScreenshotImage {
  src: string
  alt: string
}

function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose} aria-label="Close">
        <X size={24} />
      </button>
      <img
        className="lightbox-image"
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}

export function HeroScreenshots({ images }: { images: ScreenshotImage[] }) {
  const [lightboxImg, setLightboxImg] = useState<ScreenshotImage | null>(null)
  const closeLightbox = useCallback(() => setLightboxImg(null), [])

  if (images.length === 0) return null
  return (
    <>
      <div className="hero-screenshots">
        {images.map((img) => (
          <div key={img.src} className="hero-screenshot" onClick={() => setLightboxImg(img)}>
            <img src={img.src} alt={img.alt} loading="eager" />
          </div>
        ))}
      </div>
      {lightboxImg && <Lightbox src={lightboxImg.src} alt={lightboxImg.alt} onClose={closeLightbox} />}
    </>
  )
}

export function FeatureScreenshots({ images }: { images: ScreenshotImage[] }) {
  const [lightboxImg, setLightboxImg] = useState<ScreenshotImage | null>(null)
  const closeLightbox = useCallback(() => setLightboxImg(null), [])

  if (images.length === 0) return null
  return (
    <>
      <div className="feature-screenshots">
        {images.map((img) => (
          <div key={img.src} className="feature-screenshot" onClick={() => setLightboxImg(img)}>
            <img src={img.src} alt={img.alt} loading="lazy" />
          </div>
        ))}
      </div>
      {lightboxImg && <Lightbox src={lightboxImg.src} alt={lightboxImg.alt} onClose={closeLightbox} />}
    </>
  )
}

export type { ScreenshotImage }
