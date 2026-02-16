/**
 * Darkly Suite — Gmail content script
 *
 * Injects Gmail dark mode using the `gd` CSS prefix (so Gmail-specific
 * override CSS works identically to the standalone Gmail Darkly extension)
 * but routes all storage through the suite's `ds_` namespace.
 */

import { claimPage } from '@darkly/core';
import { config } from './darkly.config';

const SITE_ID = 'gmail';
const CSS_PREFIX = 'gd';
const CLAIM_ID = `ds-${SITE_ID}`;

async function init(): Promise<void> {
  if (!claimPage(CLAIM_ID)) return;

  console.log(
    `[Darkly Suite] Gmail content script loaded (prefix: ${CSS_PREFIX}, storage: ${config.storageKey})`
  );

  // Placeholder: the full init will be wired up once @darkly/site-gmail
  // exports its SitePlugin and @darkly/core's createContentScript is available.
  // For now, confirm the content script loads and claims the page.
}

init().catch((err) =>
  console.error('[Darkly Suite] Gmail content script error:', err)
);
