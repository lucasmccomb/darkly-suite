import { Nav } from '../components/Nav.tsx'
import { Hero } from '../components/Hero.tsx'
import { Features } from '../components/Features.tsx'
import { Pricing } from '../components/Pricing.tsx'
import { FAQ } from '../components/FAQ.tsx'
import { Footer } from '../components/Footer.tsx'

const gmailFeatures = [
  'Dark mode for Gmail',
  'OS dark mode detection',
  'Manual toggle & keyboard shortcut',
  'Time-based scheduling',
  'Sunrise/sunset scheduling',
  'Cross-device sync',
  'In-Gmail settings panel',
  'Priority email support',
]

export function GmailPage() {
  return (
    <>
      <Nav />
      <Hero
        title="Intelligent dark mode<br />for Gmail"
        subtitle="Automatically switch your Gmail theme to an optimized dark mode based on your machine's OS, sunset/sunrise, or a custom schedule."
        ctaText="Get Darkly for Gmail"
        ctaLink="#pricing"
      />
      <Features
        sectionTitle="Built for Gmail, designed for comfort"
        sectionSubtitle="Darkly transforms every part of Gmail with carefully crafted dark styling."
      />
      <Pricing product="gmail" features={gmailFeatures} />
      <FAQ />
      <Footer />
    </>
  )
}
