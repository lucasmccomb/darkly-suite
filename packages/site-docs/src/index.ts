// @darkly/site-docs — Docs-specific SitePlugin
// Kix canvas injection, toolbar selectors, docs-overrides.css

export { docsPlugin } from './plugin';
export { injectToolbarButton, waitForElement, removeToolbarButton } from './inject/toolbar';
export { startCanvasObserver } from './inject/canvas-observer';
export {
  TOOLBAR_SELECTOR,
  BUTTON_ID,
  SIDEBAR_STRIP_SELECTOR,
  SIDEBAR_ICON_ID,
  KIX_CANVAS_SELECTOR,
  KIX_APPVIEW_SELECTOR,
  KIX_PAGE_SELECTOR,
  KIX_PAGELESS_CLASS,
  COLOR_SWATCH_SELECTORS,
  CURSOR_SELECTORS,
  COMMENT_SELECTORS,
} from './inject/dom-selectors';
