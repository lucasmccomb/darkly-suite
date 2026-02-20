import type { ProductConfig } from '@darkly/core';

export const config: ProductConfig = {
  productId: 'docs',
  productName: 'Darkly for Docs',
  prefix: 'dd',
  storageKey: 'dd_preferences',
  tokenKey: 'dd_token',
  proCacheKey: 'dd_pro_cache',
  apiBase: 'https://darklysuite.com/api',
  siteBase: 'https://docsdarkly.com',
  alarmName: 'dd-schedule-check',
  tabUrlPattern: 'https://docs.google.com/document/*',
  forceColorSchemeLight: true,
};
