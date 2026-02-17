// Darkly for Sheets — Background Service Worker
// Thin wiring that imports createBackgroundWorker from @darkly/core.

import { createBackgroundWorker } from '@darkly/core';
import { config } from './darkly.config';

createBackgroundWorker(config);
