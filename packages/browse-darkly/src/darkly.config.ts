import type { ProductConfig } from '@darkly/core';

export const config: ProductConfig = {
  productId: 'browse',
  productName: 'Browse Darkly',
  prefix: 'bd',
  storageKey: 'bd_preferences',
  tokenKey: 'bd_token',
  proCacheKey: 'bd_pro_cache',
  apiBase: 'https://darklysuite.com/api',
  siteBase: 'https://browsedarkly.com',
  alarmName: 'bd-schedule-check',
  tabUrlPattern: 'https://*/*',
};
