import type { PricingTier, ComparisonFeature } from '@darkly/landing-shared'

export const CHECKOUT_API_URL = '/api/checkout'
export const AUTH_API_URL = '/api/auth/start'

/**
 * Chrome Web Store listing URLs.
 * Replace placeholder IDs with real extension IDs after publishing.
 */
export const STORE_URLS: Record<string, string> = {
  gmail: 'https://chromewebstore.google.com/detail/darkly-for-gmail/kfgkinaheobhehhcaobkehpgghipeife',
  sheets: 'https://chromewebstore.google.com/detail/darkly-for-sheets/PLACEHOLDER_SHEETS_ID',
  docs: 'https://chromewebstore.google.com/detail/darkly-for-docs/PLACEHOLDER_DOCS_ID',
  suite: 'https://chromewebstore.google.com/detail/darkly-suite/PLACEHOLDER_SUITE_ID',
}

export const SITE_NAME = 'Darkly Suite'

export const NAV_LINKS = [
  { to: '/gmail', label: 'Gmail' },
  { to: '/sheets', label: 'Sheets' },
  { to: '/docs', label: 'Docs' },
  { to: '/suite', label: 'Bundle' },
  { to: '/setup', label: 'Setup' },
  { to: '/#pricing', label: 'Pricing' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/account', label: 'Account' },
]

export const NAV_CTA = { to: '/suite', label: 'Get the Suite' }

export const FOOTER_LINKS = [
  { to: '/gmail', label: 'Gmail' },
  { to: '/sheets', label: 'Sheets' },
  { to: '/docs', label: 'Docs' },
  { to: '/suite', label: 'Bundle' },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/support', label: 'Support' },
]

export const individualTiers = (product: string): PricingTier[] => [
  {
    plan: 'Monthly',
    price: '$0.99',
    period: '/mo',
    subtitle: 'Cancel anytime',
    highlighted: false,
    cta: 'Subscribe',
    link: STORE_URLS[product] ?? `/${product}`,
  },
  {
    plan: 'Yearly',
    price: '$9.99',
    period: '/yr',
    subtitle: 'Save 16%',
    highlighted: true,
    badge: 'Best Value',
    cta: 'Subscribe',
    link: STORE_URLS[product] ?? `/${product}`,
  },
  {
    plan: 'Lifetime',
    price: '$29.99',
    period: '',
    subtitle: 'One-time payment',
    highlighted: false,
    cta: 'One-time payment',
    link: STORE_URLS[product] ?? `/${product}`,
  },
]

export const bundleTiers: PricingTier[] = [
  {
    plan: 'Monthly',
    price: '$2.99',
    period: '/mo',
    subtitle: 'Cancel anytime',
    highlighted: false,
    cta: 'Subscribe',
    link: STORE_URLS.suite,
  },
  {
    plan: 'Yearly',
    price: '$29.99',
    period: '/yr',
    subtitle: 'Save 16%',
    highlighted: true,
    badge: 'Best Value',
    cta: 'Subscribe',
    link: STORE_URLS.suite,
  },
  {
    plan: 'Lifetime',
    price: '$49.99',
    period: '',
    subtitle: 'One-time payment',
    highlighted: false,
    cta: 'One-time payment',
    link: STORE_URLS.suite,
  },
]

export const COMPARISON_FEATURES: ComparisonFeature[] = [
  { name: 'Gmail dark mode', gmail: true, sheets: false, docs: false, suite: true },
  { name: 'Sheets dark mode', gmail: false, sheets: true, docs: false, suite: true },
  { name: 'Docs dark mode', gmail: false, sheets: false, docs: true, suite: true },
  { name: 'Drive dark mode', gmail: false, sheets: false, docs: false, suite: true },
  { name: 'OS theme sync', gmail: true, sheets: true, docs: true, suite: true },
  { name: 'Time-based scheduling', gmail: true, sheets: true, docs: true, suite: true },
  { name: 'Sunrise/sunset scheduling', gmail: true, sheets: true, docs: true, suite: true },
  { name: 'Cross-device sync', gmail: true, sheets: true, docs: true, suite: true },
  { name: 'Preserve Grid Colors', gmail: false, sheets: true, docs: false, suite: true },
  { name: 'In-app settings panel', gmail: true, sheets: true, docs: true, suite: true },
  { name: 'Priority email support', gmail: true, sheets: true, docs: true, suite: true },
]

export const DEFAULT_FEATURES = [
  'Dark mode for Gmail, Sheets, Docs, and Drive',
  'OS dark mode detection',
  'Manual toggle',
  'Time-based scheduling',
  'Sunrise/sunset scheduling',
  'Cross-device sync',
  'In-app settings panel',
  'Priority email support',
]
