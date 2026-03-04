/**
 * Chrome Web Store listing URLs.
 * Replace placeholder IDs with real extension IDs after publishing.
 */
export const STORE_URLS = {
  gmail: 'https://chromewebstore.google.com/detail/darkly-for-gmail/kfgkinaheobhehhcaobkehpgghipeife',
  sheets: 'https://chromewebstore.google.com/detail/darkly-for-sheets/PLACEHOLDER_SHEETS_ID',
  docs: 'https://chromewebstore.google.com/detail/darkly-for-docs/PLACEHOLDER_DOCS_ID',
  suite: 'https://chromewebstore.google.com/detail/darkly-suite/PLACEHOLDER_SUITE_ID',
} as const

export type ProductId = keyof typeof STORE_URLS
