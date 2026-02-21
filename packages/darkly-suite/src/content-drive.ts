/**
 * Darkly Suite — Drive content script
 *
 * Injects Drive dark mode using CSS inversion. Drive is dashboard-only,
 * so FAB injection handles the settings icon in the header toolbar.
 * Routes all storage through the suite's `ds_drive_preferences` key.
 */

import { createContentScript, claimPage } from '@darkly/core';
import { drivePlugin } from '@darkly/site-drive';
import { getSiteConfig } from './darkly.config';

const siteConfig = getSiteConfig('drive');
const CLAIM_ID = 'ds-drive';

async function init(): Promise<void> {
  if (!claimPage(CLAIM_ID)) return;

  // Skip dark mode in iframes (avoid double-inversion in embedded Drive)
  if (window.self !== window.top) {
    console.log('[Darkly Suite] Drive — skipping iframe');
    return;
  }

  console.log(
    `[Darkly Suite] Drive content script loaded (prefix: ${siteConfig.prefix}, storage: ${siteConfig.storageKey})`
  );

  createContentScript(siteConfig, drivePlugin);
}

init().catch((err) =>
  console.error('[Darkly Suite] Drive content script error:', err)
);
