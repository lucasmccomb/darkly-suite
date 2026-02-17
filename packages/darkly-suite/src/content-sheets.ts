/**
 * Darkly Suite — Sheets content script
 *
 * Injects Sheets dark mode using the `sd` CSS prefix (so Sheets-specific
 * override CSS works identically to the standalone Darkly for Sheets extension)
 * but routes all storage through the suite's `ds_sheets_preferences` key.
 */

import { createContentScript, claimPage } from '@darkly/core';
import { sheetsPlugin } from '@darkly/site-sheets';
import { getSiteConfig } from './darkly.config';

const siteConfig = getSiteConfig('sheets');
const CLAIM_ID = `ds-${siteConfig.prefix}`;

async function init(): Promise<void> {
  if (!claimPage(CLAIM_ID)) return;

  // Skip dark mode in iframes (avoid double-inversion in embedded sheets)
  if (window.self !== window.top) {
    console.log('[Darkly Suite] Sheets — skipping iframe');
    return;
  }

  if (
    window.location.pathname.includes('/print') ||
    window.location.pathname.includes('/export')
  ) {
    console.log('[Darkly Suite] Sheets — skipping print/export view');
    return;
  }

  console.log(
    `[Darkly Suite] Sheets content script loaded (prefix: ${siteConfig.prefix}, storage: ${siteConfig.storageKey})`
  );

  createContentScript(siteConfig, sheetsPlugin);
}

init().catch((err) =>
  console.error('[Darkly Suite] Sheets content script error:', err)
);
