// @darkly/site-sheets — SitePlugin implementation for Google Sheets
// Custom DOM injection for toolbar, sidebar, and grid observation.

import React from 'react';
import type {
  SitePlugin,
  ToolbarButtonOpts,
  SidebarIconOpts,
  ThemeEngine,
  ProductConfig,
} from '@darkly/core';
import { injectToolbarButton } from './inject/toolbar';
import { startGridObserver } from './inject/grid-observer';
import { SheetsSettingsSection } from './ui/SheetsSettingsSection';

let _prefix = 'sd';

export const sheetsPlugin: SitePlugin = {
  siteId: 'sheets',
  tabUrlPattern: 'https://docs.google.com/spreadsheets/*',
  contentScriptMatches: ['https://docs.google.com/spreadsheets/*'],

  // Sheets override CSS is loaded via the manifest css array.
  overrideStyles: 'sheets-overrides.css',

  async init(_engine: ThemeEngine, config: ProductConfig): Promise<void> {
    _prefix = config.prefix;

    // Apply saved per-site preferences (e.g., preserve grid attribute) on load
    const siteKey = `${_prefix}_site_sheets`;
    const result = await chrome.storage.sync.get(siteKey);
    const stored = result[siteKey];
    if (stored?.preserveGridColors) {
      document.documentElement.setAttribute(`data-${_prefix}-grid`, 'preserve');
    }
  },

  async injectToolbarButton(opts: ToolbarButtonOpts): Promise<HTMLElement | null> {
    return injectToolbarButton(
      { onClick: opts.onAllSettings },
      _prefix,
    );
  },

  injectSidebarIcon(_opts: SidebarIconOpts): void {
    // Sidebar icon injection is handled by the extension package's content script
    // (sheets-darkly) which wires up the settings modal. The site package
    // provides the inject/toolbar module; the extension package handles
    // the full sidebar + settings panel wiring.
  },

  startDomObserver(onReinject: () => Promise<void>): void {
    startGridObserver(() => {
      onReinject();
    });
  },

  renderProductSection(): React.ReactNode {
    return React.createElement(SheetsSettingsSection);
  },
};
