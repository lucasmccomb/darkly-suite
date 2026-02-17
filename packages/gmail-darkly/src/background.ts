// Darkly for Gmail — Background Service Worker
// Thin wiring that imports createBackgroundWorker from @darkly/core.
// InboxSDK also requires its background script to be loaded here.

import '@inboxsdk/core/background.js';
import { createBackgroundWorker } from '@darkly/core';
import { config } from './darkly.config';

createBackgroundWorker(config);
