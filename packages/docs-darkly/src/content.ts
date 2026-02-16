// Docs Darkly — Content Script Entry Point
// Thin wiring that imports createContentScript from @darkly/core
// and the docsPlugin from @darkly/site-docs.

import { createContentScript } from '@darkly/core';
import { docsPlugin } from '@darkly/site-docs';
import { config } from './darkly.config';

// Skip dark mode in iframes (avoid double-inversion in embedded docs)
if (window.self !== window.top) {
  console.log('[Docs Darkly] Skipping \u2014 running inside iframe');
} else if (
  window.location.pathname.includes('/print') ||
  window.location.pathname.includes('/export') ||
  window.location.pathname.includes('/preview')
) {
  console.log('[Docs Darkly] Skipping \u2014 print/export/preview view');
} else {
  createContentScript(config, docsPlugin);
}
