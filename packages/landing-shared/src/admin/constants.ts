export const PRODUCTS = ['gmail', 'sheets', 'docs', 'suite'] as const

export const PRODUCT_LABELS: Record<string, string> = {
  gmail: 'Darkly for Gmail',
  sheets: 'Darkly for Sheets',
  docs: 'Darkly for Docs',
  suite: 'Darkly Suite',
}

export const PRODUCT_URLS: Record<string, string> = {
  gmail: 'gmaildarkly.com',
  sheets: 'sheetsdarkly.com',
  docs: 'docsdarkly.com',
}
