import { Nav } from '../components/Nav.tsx'
import { Hero } from '../components/Hero.tsx'
import { Features } from '../components/Features.tsx'
import { Pricing } from '../components/Pricing.tsx'
import { FAQ } from '../components/FAQ.tsx'
import { Footer } from '../components/Footer.tsx'
import { FileText, Sunset, Clock, Settings } from 'lucide-react'

const docsFeatureItems = [
  {
    icon: <FileText size={28} color="#4285f4" strokeWidth={1.8} />,
    iconClass: 'feature-icon--sunset',
    title: 'Canvas-Aware Rendering',
    description: 'Dark mode that works with the Kix editor canvas. Document text, menus, and toolbars are all styled.',
  },
  {
    icon: <Sunset size={28} color="#8ab4f8" strokeWidth={1.8} />,
    iconClass: 'feature-icon--sync',
    title: 'Sunset Scheduling',
    description: 'Dark mode activates at sunset, light mode returns at sunrise. Uses your location to calculate the exact times each day.',
  },
  {
    icon: <Clock size={28} color="#6c5ce7" strokeWidth={1.8} />,
    iconClass: 'feature-icon--schedule',
    title: 'Schedule Mode',
    description: 'Set a daily dark mode schedule. Handles midnight wrapping automatically.',
  },
  {
    icon: <Settings size={28} color="#81c995" strokeWidth={1.8} />,
    iconClass: 'feature-icon--settings',
    title: 'In-Docs Settings',
    description: 'Configure everything without leaving Google Docs. Access settings right from the toolbar.',
  },
]

const docsFeatures = [
  'Dark mode for Google Docs',
  'Kix canvas rendering support',
  'Comment and suggestion styling',
  'OS dark mode detection',
  'Time-based scheduling',
  'Sunrise/sunset scheduling',
  'In-Docs settings panel',
  'Priority email support',
]

export function DocsPage() {
  return (
    <>
      <Nav />
      <Hero
        title="Refined dark mode<br />for Google Docs"
        subtitle="Canvas-aware dark mode that styles the document editor, comments, and toolbars for comfortable writing."
        ctaText="Get Darkly for Docs"
        ctaLink="#pricing"
      />
      <Features
        items={docsFeatureItems}
        sectionTitle="Built for documents"
        sectionSubtitle="Darkly understands the Docs editor and styles every element for comfortable writing."
      />
      <Pricing product="docs" features={docsFeatures} />
      <FAQ />
      <Footer />
    </>
  )
}
