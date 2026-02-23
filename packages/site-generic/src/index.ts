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

// Shadow DOM support
export {
  setRootCustomProperties,
  ShadowStyleInjector,
  getShadowRoot,
  hasClosedShadowRootAccess,
  ShadowRootDiscovery,
  LAYER_ORDER,
  wrapInLayer,
  buildLayeredCSS,
  ShadowPerfOptimizer,
} from './shadow-dom';
export type { ShadowRootCallback, ShadowPerfOptions } from './shadow-dom';

// SPA support — stylesheet mutation interception
export { StylesheetProxy } from './spa-support';
export type { StylesheetChangeCallback } from './spa-support';

// CSS processing pipeline
export { processPageStylesheets, generateFullOverrideCSS } from './worker';
export type { ProcessedStylesheet } from './worker';

// Viewport-aware incremental processing
export { ViewportProcessor } from './viewport-processor';
export type { ViewportProcessorOptions } from './viewport-processor';

// Override decision pipeline
export { executeOverridePipeline } from './override-pipeline';
export type { OverrideStrategy, OverrideResult } from './override-pipeline';

// Site-style analysis engine
export { analyzeDarkModeSupport } from './analysis/dark-mode-detection';
export type { DarkModeAnalysis } from './analysis/dark-mode-detection';
export { detectNativeDarkState } from './analysis/native-dark-detection';
export type { NativeDarkState } from './analysis/native-dark-detection';
export { classifyComplexity } from './analysis/complexity-classifier';
export type { ComplexityLevel, ComplexityAnalysis } from './analysis/complexity-classifier';

// Security — CSS sanitization and bundle verification
export { sanitizeCSS } from './security/css-sanitizer';
export type { SanitizationResult } from './security/css-sanitizer';
export { verifyBundleSignature } from './security/signature-verifier';
export type { SignedBundle } from './security/signature-verifier';

// Breakage pattern handlers for CSS filter inversion
export {
  BREAKAGE_HANDLERS,
  generateBreakageCSS,
  generateBreakageCSSForHandlers,
} from './breakage-handlers';
export type { BreakageHandler } from './breakage-handlers';

// Privacy-safe domain reporting
export {
  hashDomain,
  reportDomain,
  getReports,
  clearReports,
} from './privacy';
export type { DomainReport } from './privacy';
