/**
 * Darkly Suite — Docs content script
 *
 * Injects Docs dark mode using the `dd` CSS prefix (so Docs-specific
 * override CSS works identically to the standalone Docs Darkly extension)
 * but routes all storage through the suite's `ds_docs_preferences` key.
 */

import { createContentScript, claimPage } from '@darkly/core';
import { docsPlugin } from '@darkly/site-docs';
import { getSiteConfig } from './darkly.config';

const siteConfig = getSiteConfig('docs');
const CLAIM_ID = `ds-${siteConfig.prefix}`;

async function init(): Promise<void> {
  if (!claimPage(CLAIM_ID)) return;

  // Skip dark mode in iframes (avoid double-inversion in embedded docs)
  if (window.self !== window.top) {
    console.log('[Darkly Suite] Docs — skipping iframe');
    return;
  }

  if (
    window.location.pathname.includes('/print') ||
    window.location.pathname.includes('/export') ||
    window.location.pathname.includes('/preview')
  ) {
    console.log('[Darkly Suite] Docs — skipping print/export/preview view');
    return;
  }

  console.log(
    `[Darkly Suite] Docs content script loaded (prefix: ${siteConfig.prefix}, storage: ${siteConfig.storageKey})`
  );

  createContentScript(siteConfig, docsPlugin);
}

init().catch((err) =>
  console.error('[Darkly Suite] Docs content script error:', err)
);
