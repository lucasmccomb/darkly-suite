// @darkly/site-docs — SitePlugin implementation for Google Docs
// Custom DOM injection for toolbar, sidebar, and canvas observation.

import type {
  SitePlugin,
  ToolbarButtonOpts,
  SidebarIconOpts,
  ThemeEngine,
  ProductConfig,
} from '@darkly/core';
import { injectToolbarButton } from './inject/toolbar';
import { startCanvasObserver } from './inject/canvas-observer';

let _prefix = 'dd';

export const docsPlugin: SitePlugin = {
  siteId: 'docs',
  tabUrlPattern: 'https://docs.google.com/document/*',
  contentScriptMatches: ['https://docs.google.com/document/*'],

  // Docs override CSS is loaded via the manifest css array.
  overrideStyles: 'docs-overrides.css',

  async init(_engine: ThemeEngine, config: ProductConfig): Promise<void> {
    _prefix = config.prefix;
  },

  async injectToolbarButton(opts: ToolbarButtonOpts): Promise<HTMLElement | null> {
    return injectToolbarButton(
      { onClick: opts.onAllSettings },
      _prefix,
    );
  },

  injectSidebarIcon(_opts: SidebarIconOpts): void {
    // Sidebar icon injection is handled by the extension package's content script
    // (docs-darkly) which wires up the settings modal. The site package
    // provides the inject/toolbar module; the extension package handles
    // the full sidebar + settings panel wiring.
  },

  startDomObserver(onReinject: () => Promise<void>): void {
    startCanvasObserver(() => {
      onReinject();
    });
  },
};
