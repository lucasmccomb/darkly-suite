import type { PricingTier } from '@darkly/landing-shared'

export const CHECKOUT_API_URL = 'https://darklysuite.com/api/checkout'
export const AUTH_API_URL = 'https://darklysuite.com/api/auth/start'

/**
 * Chrome Web Store listing URL.
 * Replace placeholder ID with real extension ID after publishing.
 */
export const STORE_URL = 'https://chromewebstore.google.com/detail/browse-darkly/PLACEHOLDER_BROWSE_ID'

export const SITE_NAME = 'Browse Darkly'

export const NAV_LINKS = [
  { to: '/#features', label: 'Features' },
  { to: '/#pricing', label: 'Pricing' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/support', label: 'Support' },
  { to: 'https://darklysuite.com/account', label: 'Account', external: true },
]

export const NAV_CTA = { to: '/#pricing', label: 'Get Browse Darkly' }

export const FOOTER_LINKS = [
  { to: STORE_URL, label: 'Chrome Web Store', external: true },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: 'mailto:support@browsedarkly.com', label: 'Contact', external: true },
]

export const BROWSE_FEATURES = [
  'Dark mode for every website',
  'Beautiful curated presets (Nord, Solarized, Monokai, and more)',
  'Per-site theme memory',
  'Smart dark mode detection — skips already-dark sites',
  'OS dark mode sync',
  'Time-based scheduling',
  'Sunrise/sunset scheduling',
  'Chrome Side Panel settings',
  'Zero telemetry — all data stays on your device',
]

export const BROWSE_FAQ = [
  {
    question: 'What data does Browse Darkly collect?',
    answer: "None. Browse Darkly stores all settings locally using Chrome's storage API (chrome.storage.sync). Your preferences sync across your Chrome browsers, but never pass through our servers. We have no analytics, no tracking, and no user accounts.",
  },
  {
    question: 'Does it work on every website?',
    answer: 'Browse Darkly works on the vast majority of websites. It intelligently detects sites that already have dark mode and skips them to avoid double-darkening. You can also whitelist or blacklist specific sites.',
  },
  {
    question: 'How does sunrise/sunset scheduling work?',
    answer: 'When you enable sunset scheduling, Browse Darkly requests your approximate location (with your permission) to calculate sunrise and sunset times. Your location is only sent to the sunrise-sunset.org API and is never stored on our servers.',
  },
  {
    question: 'Does it work across multiple devices?',
    answer: "Yes. Browse Darkly uses Chrome's built-in sync storage, so your settings automatically sync across every device where you're signed into Chrome.",
  },
  {
    question: 'Can I customize the colors?',
    answer: 'Yes! Browse Darkly ships with curated presets like Nord, Solarized, Monokai, and more. Each preset is carefully designed for readability and eye comfort across all types of websites.',
  },
  {
    question: 'What about sites that already have dark mode?',
    answer: "Browse Darkly's smart detection identifies sites that are already dark and automatically skips them. You'll never get double-darkened pages.",
  },
  {
    question: 'I reinstalled the extension and now I see the paywall. How do I restore my purchase?',
    answer: 'When you uninstall and reinstall a Chrome extension, Chrome clears its local data — including the token that links the extension to your license. To restore your purchase, click the "Already purchased? Restore" link on the paywall screen, then sign in with the Google account you used to purchase. Your license will be re-linked automatically.',
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
