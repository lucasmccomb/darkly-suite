/**
 * Darkly Suite — Sheets content script
 *
 * Injects Sheets dark mode using the `sd` CSS prefix (so Sheets-specific
 * override CSS works identically to the standalone Sheets Darkly extension)
 * but routes all storage through the suite's `ds_` namespace.
 */

import { claimPage } from './conflict-detection';
import { config } from './darkly.config';

const SITE_ID = 'sheets';
const CSS_PREFIX = 'sd';
const CLAIM_ID = `ds-${SITE_ID}`;

async function init(): Promise<void> {
  if (!claimPage(CLAIM_ID)) return;

  console.log(
    `[Darkly Suite] Sheets content script loaded (prefix: ${CSS_PREFIX}, storage: ${config.storageKey})`
  );

  // Placeholder: the full init will be wired up once @darkly/site-sheets
  // exports its SitePlugin and @darkly/core's createContentScript is available.
  // For now, confirm the content script loads and claims the page.
}

init().catch((err) =>
  console.error('[Darkly Suite] Sheets content script error:', err)
);
