import type { ProductConfig } from '@darkly/core';

export const config: ProductConfig = {
  productId: 'suite',
  productName: 'Darkly Suite',
  prefix: 'ds',
  storageKey: 'ds_preferences',
  tokenKey: 'ds_token',
  proCacheKey: 'ds_pro_cache',
  apiBase: 'https://darklysuite.com/api',
  alarmName: 'ds-schedule-check',
  tabUrlPattern: 'https://mail.google.com/*',
  sites: ['gmail', 'sheets', 'docs'],
};
