// Darkly for Gmail — Content Script Entry Point
// Thin wiring that imports createContentScript from @darkly/core
// and the gmailPlugin from @darkly/site-gmail.
// Includes conflict detection to prevent double-injection with the bundle.

import { createContentScript, claimPage } from '@darkly/core';
import { gmailPlugin } from '@darkly/site-gmail';
import { config } from './darkly.config';

const CLAIM_ID = config.prefix; // 'gd'

if (!claimPage(CLAIM_ID)) {
  if (__DEV_MODE__) {
    console.log(`[${config.productName}] Skipping — another Darkly extension is active`);
  }
} else {
  createContentScript(config, gmailPlugin);
}
