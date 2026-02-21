import type { ProductConfig, SiteId } from '@darkly/core';

/** Suite-level config — used for payment, token, and pro-cache (shared across all sites). */
export const config: ProductConfig = {
  productId: 'suite',
  productName: 'Darkly Suite',
  prefix: 'ds',
  storageKey: 'ds_preferences',
  tokenKey: 'ds_token',
  proCacheKey: 'ds_pro_cache',
  apiBase: 'https://darklysuite.com/api',
  siteBase: 'https://darklysuite.com',
  alarmName: 'ds-schedule-check',
  tabUrlPattern: 'https://mail.google.com/*',
  sites: ['gmail', 'sheets', 'docs', 'drive'],
};

/**
 * Per-site config metadata for the bundle.
 * Each site gets its own storage key (ds_{site}_preferences) and alarm,
 * but shares the suite's `ds` CSS prefix, token, and payment.
 */
interface SiteConfigEntry {
  siteId: SiteId;
  storageKey: string;
  alarmName: string;
  tabUrlPattern: string;
}

export const siteConfigs: Record<SiteId, SiteConfigEntry> = {
  gmail: {
    siteId: 'gmail',
    storageKey: 'ds_gmail_preferences',
    alarmName: 'ds-gmail-schedule-check',
    tabUrlPattern: 'https://mail.google.com/*',
  },
  sheets: {
    siteId: 'sheets',
    storageKey: 'ds_sheets_preferences',
    alarmName: 'ds-sheets-schedule-check',
    tabUrlPattern: 'https://docs.google.com/spreadsheets/*',
  },
  docs: {
    siteId: 'docs',
    storageKey: 'ds_docs_preferences',
    alarmName: 'ds-docs-schedule-check',
    tabUrlPattern: 'https://docs.google.com/document/*',
  },
  drive: {
    siteId: 'drive',
    storageKey: 'ds_drive_preferences',
    alarmName: 'ds-drive-schedule-check',
    tabUrlPattern: 'https://drive.google.com/*',
  },
};

/**
 * Build a full ProductConfig for a specific site within the bundle.
 * Inherits suite-level payment/token config but uses per-site storage and prefix.
 */
export function getSiteConfig(siteId: SiteId): ProductConfig {
  const site = siteConfigs[siteId];
  return {
    productId: 'suite',
    productName: `Darkly Suite (${siteId})`,
    prefix: config.prefix, // Unified 'ds' prefix — CSS is built with ds- at compile time
    storageKey: site.storageKey,
    tokenKey: config.tokenKey,
    proCacheKey: config.proCacheKey,
    apiBase: config.apiBase,
    siteBase: config.siteBase,
    alarmName: site.alarmName,
    tabUrlPattern: site.tabUrlPattern,
    sites: config.sites,
    // Docs and Drive require forced light color-scheme to prevent Google's native dark mode
    forceColorSchemeLight: siteId === 'docs' || siteId === 'drive',
  };
}
