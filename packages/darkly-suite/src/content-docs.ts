/**
 * Darkly Suite — Docs content script
 *
 * Injects Docs dark mode using the `dd` CSS prefix (so Docs-specific
 * override CSS works identically to the standalone Docs Darkly extension)
 * but routes all storage through the suite's `ds_` namespace.
 */

import { claimPage } from '@darkly/core';
import { config } from './darkly.config';

const SITE_ID = 'docs';
const CSS_PREFIX = 'dd';
const CLAIM_ID = `ds-${SITE_ID}`;

async function init(): Promise<void> {
  if (!claimPage(CLAIM_ID)) return;

  console.log(
    `[Darkly Suite] Docs content script loaded (prefix: ${CSS_PREFIX}, storage: ${config.storageKey})`
  );

  // Placeholder: the full init will be wired up once @darkly/site-docs
  // exports its SitePlugin and @darkly/core's createContentScript is available.
  // For now, confirm the content script loads and claims the page.
}

init().catch((err) =>
  console.error('[Darkly Suite] Docs content script error:', err)
);
