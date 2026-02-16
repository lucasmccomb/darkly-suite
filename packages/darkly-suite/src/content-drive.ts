/**
 * Darkly Suite — Drive content script (stub)
 *
 * Google Drive dark mode is deferred to v1.1. This stub claims the page
 * to prevent future conflicts, logs a message, and exits.
 */

import { claimPage } from '@darkly/core';

const CLAIM_ID = 'ds-drive';

function init(): void {
  if (!claimPage(CLAIM_ID)) return;

  console.log(
    '[Darkly Suite] Drive dark mode is coming in v1.1. Stub loaded.'
  );
}

init();
