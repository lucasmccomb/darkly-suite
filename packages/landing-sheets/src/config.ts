import type { PricingTier } from '@darkly/landing-shared'

/**
 * Chrome Web Store listing URL.
 * Replace placeholder ID with real extension ID after publishing.
 */
export const STORE_URL = 'https://chromewebstore.google.com/detail/darkly-for-google-sheets/PLACEHOLDER_SHEETS_ID'

export const CHECKOUT_API_URL = 'https://darklysuite.com/api/checkout'
export const AUTH_API_URL = 'https://darklysuite.com/api/auth/start'

export const SITE_NAME = 'Darkly for Sheets'

export const NAV_LINKS = [
  { to: '/#features', label: 'Features' },
  { to: '/#pricing', label: 'Pricing' },
  { to: '/#faq', label: 'FAQ' },
  { to: '/privacy', label: 'Privacy' },
  { to: 'https://darklysuite.com/account', label: 'Account', external: true },
]

export const NAV_CTA = { to: '/#pricing', label: 'Get Darkly for Sheets' }

export const FOOTER_LINKS = [
  { to: STORE_URL, label: 'Chrome Web Store', external: true },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: 'mailto:support@sheetsdarkly.com', label: 'Contact', external: true },
]

export const SHEETS_FEATURES = [
  'Dark mode for Google Sheets',
  'Grid and cell-aware styling',
  'Formula bar dark mode',
  'OS dark mode detection',
  'Time-based scheduling',
  'Sunrise/sunset scheduling',
  'In-Sheets settings panel',
  'Priority email support',
]

export const SHEETS_FAQ = [
  {
    question: 'What data does Darkly collect?',
    answer: "None. Darkly stores all settings locally using Chrome's storage API (chrome.storage.sync). Your preferences sync across your Chrome browsers, but never pass through our servers. We have no analytics, no tracking, and no user accounts.",
  },
  {
    question: 'Does it work with Google Workspace?',
    answer: 'Yes. Darkly works with personal Google accounts, Google Workspace, and Google Workspace for Education.',
  },
  {
    question: 'What about my spreadsheet colors?',
    answer: 'Darkly includes a Preserve Grid Colors toggle that keeps your cell background colors, conditional formatting, and data bars intact while the surrounding UI goes dark. Color picker swatches also show their true colors so you always pick the right shade.',
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
    question: 'How do I toggle dark mode?',
    answer: 'You can toggle dark mode from the toolbar button in Google Sheets, or use the sidebar icon for quick access to the full settings panel.',
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
