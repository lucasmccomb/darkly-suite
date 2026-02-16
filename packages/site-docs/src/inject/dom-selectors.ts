// @darkly/site-docs — Google Docs DOM selectors
// Centralized selector constants for toolbar, canvas, sidebar, and other
// Docs-specific DOM elements used by the injection modules.

/** Primary toolbar / header container */
export const TOOLBAR_SELECTOR = '#docs-header-container';

/** Toolbar button ID for the Darkly icon */
export const BUTTON_ID = 'dd-toolbar-button';

/** Companion app-switcher strip (right sidebar with Google app icons) */
export const SIDEBAR_STRIP_SELECTOR =
  '.companion-guest-app-switcher[role="tablist"]';

/** Sidebar icon ID for the Darkly icon in the companion strip */
export const SIDEBAR_ICON_ID = 'dd-sidebar-icon';

/** Kix canvas tile content — the document rendering surface */
export const KIX_CANVAS_SELECTOR = '.kix-canvas-tile-content';

/** Kix editor appview — for detecting pageless mode */
export const KIX_APPVIEW_SELECTOR = '.kix-appview-editor';

/** Kix page element — absent in pageless mode */
export const KIX_PAGE_SELECTOR = '.kix-page';

/** Pageless mode class on the editor */
export const KIX_PAGELESS_CLASS = 'kix-appview-editor-pageless';

/** Color picker swatch selectors (shared across Google Workspace) */
export const COLOR_SWATCH_SELECTORS = [
  '.goog-palette-colorswatch',
  '.docs-material-colorpalette-colorswatch',
  '.docs-material-colorpalette-cell',
] as const;

/** Collaboration cursor selectors */
export const CURSOR_SELECTORS = [
  '.kix-cursor',
  '.kix-cursor-name',
] as const;

/** Comment and suggestion panel selectors */
export const COMMENT_SELECTORS = [
  '.docos-anchoreddocoview',
  '.docos-docoview-resolve-button-container',
] as const;

/** Titlebar buttons area (injection target) */
export const TITLEBAR_BUTTONS_SELECTOR = '.docs-titlebar-buttons';

/** Revisions / "last edited" button (anchor for injection) */
export const REVISIONS_BUTTON_SELECTOR = '.docs-revisions-appbarbutton-container';
export const REVISIONS_BUTTON_FALLBACK = '#docs-revisions-appbarbutton';
