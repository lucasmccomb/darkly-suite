import type { ProductConfig } from '@darkly/core';

export const config: ProductConfig = {
  productId: 'sheets',
  productName: 'Sheets Darkly',
  prefix: 'sd',
  storageKey: 'sd_preferences',
  tokenKey: 'sd_token',
  proCacheKey: 'sd_pro_cache',
  apiBase: 'https://darklysuite.com/api',
  alarmName: 'sd-schedule-check',
  tabUrlPattern: 'https://docs.google.com/spreadsheets/*',
};
