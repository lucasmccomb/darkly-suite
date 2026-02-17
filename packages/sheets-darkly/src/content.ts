// Darkly for Sheets — Content Script Entry Point
// Thin wiring that imports createContentScript from @darkly/core
// and the sheetsPlugin from @darkly/site-sheets.
// Includes conflict detection to prevent double-injection with the bundle.

import { createContentScript, claimPage } from '@darkly/core';
import { sheetsPlugin } from '@darkly/site-sheets';
import { config } from './darkly.config';

const CLAIM_ID = config.prefix; // 'sd'

// Skip dark mode in iframes (avoid double-inversion in embedded sheets)
if (window.self !== window.top) {
  console.log('[Darkly for Sheets] Skipping — running inside iframe');
} else if (
  window.location.pathname.includes('/print') ||
  window.location.pathname.includes('/export')
) {
  console.log('[Darkly for Sheets] Skipping — print/export view');
} else if (!claimPage(CLAIM_ID)) {
  console.log(`[${config.productName}] Skipping — another Darkly extension is active`);
} else {
  createContentScript(config, sheetsPlugin);
}
