import type { PricingTier } from '@darkly/landing-shared'

/**
 * Chrome Web Store listing URL.
 * Replace placeholder ID with real extension ID after publishing.
 */
export const STORE_URL = 'https://chromewebstore.google.com/detail/darkly-for-gmail/PLACEHOLDER_GMAIL_ID'

export const CHECKOUT_API_URL = 'https://darklysuite.com/api/checkout'
export const AUTH_API_URL = 'https://darklysuite.com/api/auth/start'

export const SITE_NAME = 'Darkly for Gmail'

export const NAV_LINKS = [
  { to: '/#features', label: 'Features' },
  { to: '/#pricing', label: 'Pricing' },
  { to: '/#faq', label: 'FAQ' },
  { to: '/privacy', label: 'Privacy' },
  { to: 'https://darklysuite.com/account', label: 'Account', external: true },
]

export const NAV_CTA = { to: '/#pricing', label: 'Get Darkly for Gmail' }

export const FOOTER_LINKS = [
  { to: STORE_URL, label: 'Chrome Web Store', external: true },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: 'mailto:support@gmaildarkly.com', label: 'Contact', external: true },
]

export const GMAIL_FEATURES = [
  'Dark mode for Gmail',
  'OS dark mode detection',
  'Manual toggle',
  'Time-based scheduling',
  'Sunrise/sunset scheduling',
  'Cross-device sync',
  'Settings panel in Gmail',
  'Priority email support',
]

export const GMAIL_FAQ = [
  {
    question: 'What data does Darkly collect?',
    answer: "None. Darkly stores all settings locally using Chrome's storage API (chrome.storage.sync). Your preferences sync across your Chrome browsers, but never pass through our servers. We have no analytics, no tracking, and no user accounts.",
  },
  {
    question: 'Does it work with Google Workspace?',
    answer: 'Yes. Darkly works with personal Gmail accounts, Google Workspace, and Google Workspace for Education.',
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
    question: 'Can I customize the colors?',
    answer: "Darkly's dark theme was carefully designed for readability and eye comfort. While custom color options aren't available yet, the theme is optimized to look great in all lighting conditions.",
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
