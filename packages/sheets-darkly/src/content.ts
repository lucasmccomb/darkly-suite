// Sheets Darkly — Content Script Entry Point
// Thin wiring that imports createContentScript from @darkly/core
// and the sheetsPlugin from @darkly/site-sheets.

import { createContentScript } from '@darkly/core';
import { sheetsPlugin } from '@darkly/site-sheets';
import { config } from './darkly.config';

// Skip dark mode in iframes (avoid double-inversion in embedded sheets)
if (window.self !== window.top) {
  console.log('[Sheets Darkly] Skipping \u2014 running inside iframe');
} else if (
  window.location.pathname.includes('/print') ||
  window.location.pathname.includes('/export')
) {
  console.log('[Sheets Darkly] Skipping \u2014 print/export view');
} else {
  createContentScript(config, sheetsPlugin);
}
