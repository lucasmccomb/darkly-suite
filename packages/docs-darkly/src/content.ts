// Darkly for Docs — Content Script Entry Point
// Thin wiring that imports createContentScript from @darkly/core
// and the docsPlugin from @darkly/site-docs.
// Includes conflict detection to prevent double-injection with the bundle.

import { createContentScript, claimPage } from '@darkly/core';
import { docsPlugin } from '@darkly/site-docs';
import { config } from './darkly.config';

const CLAIM_ID = config.prefix; // 'dd'

// Skip dark mode in iframes (avoid double-inversion in embedded docs)
if (window.self !== window.top) {
  if (__DEV_MODE__) {
    console.log('[Darkly for Docs] Skipping — running inside iframe');
  }
} else if (
  window.location.pathname.includes('/print') ||
  window.location.pathname.includes('/export') ||
  window.location.pathname.includes('/preview')
) {
  if (__DEV_MODE__) {
    console.log('[Darkly for Docs] Skipping — print/export/preview view');
  }
} else if (!claimPage(CLAIM_ID)) {
  if (__DEV_MODE__) {
    console.log(`[${config.productName}] Skipping — another Darkly extension is active`);
  }
} else {
  createContentScript(config, docsPlugin);
}
