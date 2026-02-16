// @darkly/site-sheets — Google Sheets DOM selectors
// Centralized selector constants for toolbar, grid, sidebar, and other
// Sheets-specific DOM elements used by the injection modules.

/** Primary toolbar / header container */
export const TOOLBAR_SELECTOR = '#docs-header-container';

/** Toolbar button ID for the Darkly icon */
export const BUTTON_ID = 'sd-toolbar-button';

/** Companion app-switcher strip (right sidebar with Google app icons) */
export const SIDEBAR_STRIP_SELECTOR =
  '.companion-guest-app-switcher[role="tablist"]';

/** Sidebar icon ID for the Darkly icon in the companion strip */
export const SIDEBAR_ICON_ID = 'sd-sidebar-icon';

/** Waffle grid container — the main spreadsheet canvas area */
export const WAFFLE_GRID_SELECTOR = '#waffle-grid-container';

/** Frozen pane selectors for Preserve Grid Colors */
export const FROZEN_PANE_SELECTORS = [
  '.frozen-left-pane',
  '.frozen-top-pane',
  '.frozen-corner-pane',
] as const;

/** Color picker swatch selectors */
export const COLOR_SWATCH_SELECTORS = [
  '.goog-palette-colorswatch',
  '.docs-material-colorpalette-colorswatch',
  '.docs-material-colorpalette-cell',
] as const;

/** Titlebar buttons area (injection target) */
export const TITLEBAR_BUTTONS_SELECTOR = '.docs-titlebar-buttons';

/** Revisions / "last edited" button (anchor for injection) */
export const REVISIONS_BUTTON_SELECTOR = '.docs-revisions-appbarbutton-container';
export const REVISIONS_BUTTON_FALLBACK = '#docs-revisions-appbarbutton';
