import type { ProductConfig } from '@darkly/core';

export const config: ProductConfig = {
  productId: 'gmail',
  productName: 'Darkly for Gmail',
  prefix: 'gd',
  storageKey: 'gd_preferences',
  tokenKey: 'gd_token',
  proCacheKey: 'gd_pro_cache',
  apiBase: 'https://darklysuite.com/api',
  alarmName: 'gd-schedule-check',
  tabUrlPattern: 'https://mail.google.com/*',
};
