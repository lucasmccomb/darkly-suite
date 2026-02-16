// Gmail Darkly — Content Script Entry Point
// Thin wiring that imports createContentScript from @darkly/core
// and the gmailPlugin from @darkly/site-gmail.

import { createContentScript } from '@darkly/core';
import { gmailPlugin } from '@darkly/site-gmail';
import { config } from './darkly.config';

createContentScript(config, gmailPlugin);
