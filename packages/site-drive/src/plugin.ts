// @darkly/site-drive — SitePlugin implementation for Google Drive
// Dashboard-only: uses FAB injection in the header toolbar,
// CSS inversion with re-inversion for file icons and thumbnails.

import type {
  SitePlugin,
  ToolbarButtonOpts,
  KeyboardShortcutHandlers,
  PageContext,
} from '@darkly/core';
import { registerKeyboardShortcuts } from './inject/keyboard-shortcuts';

export const drivePlugin: SitePlugin = {
  siteId: 'drive',
  tabUrlPattern: 'https://drive.google.com/*',
  contentScriptMatches: ['https://drive.google.com/*'],

  getPageContext(): PageContext {
    // Drive is always a dashboard — there is no "editor" mode.
    return 'dashboard';
  },

  // Drive override CSS is loaded via the manifest css array.
  overrideStyles: 'drive-overrides.css',

  async injectToolbarButton(_opts: ToolbarButtonOpts): Promise<HTMLElement | null> {
    // Dashboard pages use FAB injection (injectFab) from @darkly/core,
    // not a toolbar button. This is a no-op for Drive.
    return null;
  },

  startDomObserver(_onReinject: () => Promise<void>): void {
    // Drive is dashboard-only and uses FAB injection which handles its own
    // observation. No additional DOM observer needed.
  },

  registerKeyboardShortcuts(handlers: KeyboardShortcutHandlers): () => void {
    return registerKeyboardShortcuts(handlers);
  },
};
