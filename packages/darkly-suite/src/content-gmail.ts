/**
 * Darkly Suite — Gmail content script
 *
 * Injects Gmail dark mode using the `gd` CSS prefix (so Gmail-specific
 * override CSS works identically to the standalone Darkly for Gmail extension)
 * but routes all storage through the suite's `ds_gmail_preferences` key.
 */

import { createContentScript, claimPage } from '@darkly/core';
import { gmailPlugin } from '@darkly/site-gmail';
import { getSiteConfig } from './darkly.config';

const siteConfig = getSiteConfig('gmail');
const CLAIM_ID = `ds-${siteConfig.prefix}`;

async function init(): Promise<void> {
  if (!claimPage(CLAIM_ID)) return;

  console.log(
    `[Darkly Suite] Gmail content script loaded (prefix: ${siteConfig.prefix}, storage: ${siteConfig.storageKey})`
  );

  createContentScript(siteConfig, gmailPlugin);
}

init().catch((err) =>
  console.error('[Darkly Suite] Gmail content script error:', err)
);
