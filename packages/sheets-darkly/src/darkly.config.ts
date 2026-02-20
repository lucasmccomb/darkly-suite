import type { ProductConfig } from '@darkly/core';

export const config: ProductConfig = {
  productId: 'sheets',
  productName: 'Darkly for Sheets',
  prefix: 'sd',
  storageKey: 'sd_preferences',
  tokenKey: 'sd_token',
  proCacheKey: 'sd_pro_cache',
  apiBase: 'https://darklysuite.com/api',
  siteBase: 'https://sheetsdarkly.com',
  alarmName: 'sd-schedule-check',
  tabUrlPattern: 'https://docs.google.com/spreadsheets/*',
};
