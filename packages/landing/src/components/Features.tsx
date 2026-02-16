import { Monitor, Sunset, Clock, Settings } from 'lucide-react'
import type { ReactNode } from 'react'

interface FeatureItem {
  icon: ReactNode
  iconClass: string
  title: string
  description: string
}

interface FeaturesProps {
  items?: FeatureItem[]
  sectionTitle?: string
  sectionSubtitle?: string
}

const defaultFeatures: FeatureItem[] = [
  {
    icon: <Monitor size={28} color="#8ab4f8" strokeWidth={1.8} />,
    iconClass: 'feature-icon--sync',
    title: 'OS Theme Sync',
    description: 'Automatically follows your device\'s dark mode setting. Toggle dark mode on your system and Google apps follow instantly.',
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
    description: 'Set a daily dark mode schedule. Handles midnight wrapping automatically so you never have to think about it.',
  },
  {
    icon: <Settings size={28} color="#81c995" strokeWidth={1.8} />,
    iconClass: 'feature-icon--settings',
    title: 'In-App Settings',
    description: 'Configure everything without leaving the Google app. Access the settings panel right from the toolbar with a single click.',
  },
]

export function Features({
  items = defaultFeatures,
  sectionTitle = 'Everything you need for comfortable reading',
  sectionSubtitle = 'Darkly adapts Google apps to your environment so you never have to think about it.',
}: FeaturesProps) {
  return (
    <section id="features" className="features section">
      <div className="container">
        <div className="features-header">
          <span className="section-label">Features</span>
          <h2 className="section-title">{sectionTitle}</h2>
          <p className="section-subtitle">{sectionSubtitle}</p>
        </div>
        <div className="features-grid">
          {items.map((feature) => (
            <div key={feature.title} className="feature-card">
              <div className={`feature-icon ${feature.iconClass}`}>
                {feature.icon}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.description}</p>
            </div>
          ))}
        </div>
        <div className="platforms">
          <span className="platforms-label">Works on</span>
          <div className="platforms-list">
            {['macOS', 'Windows', 'Linux', 'ChromeOS'].map((os) => (
              <span key={os} className="platform-badge">{os}</span>
            ))}
          </div>
          <p className="platforms-note">
            All features work across every platform that runs Google Chrome.
          </p>
        </div>
      </div>
    </section>
  )
}
