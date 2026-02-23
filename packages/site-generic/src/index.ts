// @darkly/site-generic — Generic dark mode engine for arbitrary websites
// Unlike SitePlugin (Google Workspace-specific), this provides its own
// CSS filter-based dark mode system for any website.

export { GenericDarkMode } from './generic-engine';
export type { GenericDarkModeOptions } from './generic-engine';
export { isDarkSite } from './dark-site-detector';
export { DARK_SITES, isKnownDarkSite } from './dark-sites';
export { parseFixDirectives, parseFixBundle } from './fix-parser';
export type {
  FixDirectiveType,
  CssDirective,
  HideDirective,
  InvertDirective,
  VarDirective,
  SkipDirective,
  FixDirective,
  SiteFix,
} from './fix-parser';
export { applyFixDirectives } from './fix-applier';

// Color transformation engine
export {
  parseColor,
  rgbToHsl,
  hslToRgb,
  formatRgb,
  transformColor,
} from './color-transform';
export type { RGB, HSL, ColorContext } from './color-transform';

// CSS custom property fast path
export {
  scanRootColorVars,
  generateVarOverrideCSS,
  attemptCssVarFastPath,
} from './css-var-fast-path';
export type { CssVarOverride } from './css-var-fast-path';

// IndexedDB persistent cache
export {
  hashString,
  getCachedCSS,
  setCachedCSS,
  clearExpiredCache,
} from './css-cache';
export type { CacheEntry } from './css-cache';

// adoptedStyleSheets injection layer
export { StylesheetInjector } from './stylesheet-injector';
