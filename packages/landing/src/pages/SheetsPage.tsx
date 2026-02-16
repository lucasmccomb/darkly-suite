import { Nav } from '../components/Nav.tsx'
import { Hero } from '../components/Hero.tsx'
import { Features } from '../components/Features.tsx'
import { Pricing } from '../components/Pricing.tsx'
import { FAQ } from '../components/FAQ.tsx'
import { Footer } from '../components/Footer.tsx'
import { Table2, Sunset, Clock, Settings } from 'lucide-react'

const sheetsFeatureItems = [
  {
    icon: <Table2 size={28} color="#81c995" strokeWidth={1.8} />,
    iconClass: 'feature-icon--settings',
    title: 'Grid-Aware Styling',
    description: 'Dark mode that understands the Sheets grid. Cells, headers, formula bar, and toolbar are all styled for readability.',
  },
  {
    icon: <Sunset size={28} color="#f28b82" strokeWidth={1.8} />,
    iconClass: 'feature-icon--sunset',
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
    icon: <Settings size={28} color="#8ab4f8" strokeWidth={1.8} />,
    iconClass: 'feature-icon--sync',
    title: 'In-Sheets Settings',
    description: 'Configure everything without leaving Google Sheets. Access settings right from the toolbar.',
  },
]

const sheetsFeatures = [
  'Dark mode for Google Sheets',
  'Grid and cell-aware styling',
  'Formula bar dark mode',
  'OS dark mode detection',
  'Time-based scheduling',
  'Sunrise/sunset scheduling',
  'In-Sheets settings panel',
  'Priority email support',
]

export function SheetsPage() {
  return (
    <>
      <Nav />
      <Hero
        title="Comfortable dark mode<br />for Google Sheets"
        subtitle="Grid-aware dark mode that styles cells, headers, and the formula bar without affecting your spreadsheet data."
        ctaText="Get Sheets Darkly"
        ctaLink="#pricing"
      />
      <Features
        items={sheetsFeatureItems}
        sectionTitle="Designed for spreadsheets"
        sectionSubtitle="Darkly understands the Sheets layout and styles every element for comfortable use."
      />
      <Pricing product="sheets" features={sheetsFeatures} />
      <FAQ />
      <Footer />
    </>
  )
}
