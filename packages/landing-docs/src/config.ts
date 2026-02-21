import type { PricingTier } from '@darkly/landing-shared'

/**
 * Chrome Web Store listing URL.
 * Replace placeholder ID with real extension ID after publishing.
 */
export const STORE_URL = 'https://chromewebstore.google.com/detail/darkly-for-google-docs/PLACEHOLDER_DOCS_ID'

export const CHECKOUT_API_URL = 'https://darklysuite.com/api/checkout'

export const SITE_NAME = 'Darkly for Docs'

export const NAV_LINKS = [
  { to: '/#features', label: 'Features' },
  { to: '/#pricing', label: 'Pricing' },
  { to: '/#faq', label: 'FAQ' },
  { to: '/privacy', label: 'Privacy' },
  { to: 'https://darklysuite.com/account', label: 'Account', external: true },
]

export const NAV_CTA = { to: '/#pricing', label: 'Get Darkly for Docs' }

export const FOOTER_LINKS = [
  { to: STORE_URL, label: 'Chrome Web Store', external: true },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: 'mailto:support@docsdarkly.com', label: 'Contact', external: true },
]

export const DOCS_FEATURES = [
  'Dark mode for Google Docs',
  'Kix canvas theming',
  'Preserve Page Colors toggle',
  'OS dark mode detection',
  'Time-based scheduling',
  'Sunrise/sunset scheduling',
  'In-Docs settings panel',
  'Priority email support',
]

export const DOCS_FAQ = [
  {
    question: 'What data does Darkly collect?',
    answer: "None. Darkly stores all settings locally using Chrome's storage API (chrome.storage.sync). Your preferences sync across your Chrome browsers, but never pass through our servers. We have no analytics, no tracking, and no user accounts.",
  },
  {
    question: 'Does it work with Google Workspace?',
    answer: 'Yes. Darkly works with personal Google accounts, Google Workspace, and Google Workspace for Education.',
  },
  {
    question: 'What about my document formatting?',
    answer: 'Darkly includes a Preserve Page Colors toggle that keeps your document pages in their original light appearance while the surrounding UI goes dark. Images, drawings, and other embedded media are re-inverted so they display in their original colors.',
  },
  {
    question: 'How does sunrise/sunset scheduling work?',
    answer: 'When you enable sunset scheduling, Darkly requests your approximate location (with your permission) to calculate sunrise and sunset times. Your location is only sent to the sunrise-sunset.org API and is never stored on our servers.',
  },
  {
    question: 'Does it work across multiple devices?',
    answer: "Yes. Darkly uses Chrome's built-in sync storage, so your settings automatically sync across every device where you're signed into Chrome.",
  },
  {
    question: 'Does it affect collaboration features?',
    answer: "No. Collaboration cursors, name labels, comments, and suggestion mode highlights all render correctly in dark mode. Your co-editors' colors stay visible and accurate.",
  },
]

export const individualTiers = (): PricingTier[] => [
  {
    plan: 'Monthly',
    price: '$0.99',
    period: '/mo',
    subtitle: 'Cancel anytime',
    highlighted: false,
    cta: 'Subscribe',
    link: STORE_URL,
  },
  {
    plan: 'Yearly',
    price: '$9.99',
    period: '/yr',
    subtitle: 'Save 16%',
    highlighted: true,
    badge: 'Best Value',
    cta: 'Subscribe',
    link: STORE_URL,
  },
  {
    plan: 'Lifetime',
    price: '$29.99',
    period: '',
    subtitle: 'One-time payment',
    highlighted: false,
    cta: 'One-time payment',
    link: STORE_URL,
  },
]
