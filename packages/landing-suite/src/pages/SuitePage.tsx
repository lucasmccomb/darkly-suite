import { Nav } from '../components/Nav.tsx'
import { Hero } from '../components/Hero.tsx'
import { Features } from '../components/Features.tsx'
import { Pricing } from '../components/Pricing.tsx'
import { FAQ } from '../components/FAQ.tsx'
import { Footer } from '../components/Footer.tsx'

const suiteFeatures = [
  'Dark mode for Gmail, Sheets, and Docs',
  'OS dark mode detection',
  'Manual toggle & keyboard shortcut',
  'Time-based scheduling',
  'Sunrise/sunset scheduling',
  'Cross-device sync',
  'In-app settings panel',
  'Priority email support',
]

export function SuitePage() {
  return (
    <>
      <Nav />
      <Hero
        title="The complete dark mode<br />suite for Google"
        subtitle="One extension, one license. Premium dark mode for Gmail, Sheets, and Docs with automatic scheduling and OS sync."
        ctaText="Get the Suite"
        ctaLink="#pricing"
      />
      <Features
        sectionTitle="Everything in one package"
        sectionSubtitle="The Darkly Suite gives you dark mode for all Google apps with unified settings."
      />
      <Pricing product="suite" features={suiteFeatures} />
      <FAQ />
      <Footer />
    </>
  )
}
