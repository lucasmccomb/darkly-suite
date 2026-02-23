// @darkly/site-generic — Generic dark mode engine for arbitrary websites
// Unlike SitePlugin (Google Workspace-specific), this provides its own
// CSS filter-based dark mode system for any website.

export { GenericDarkMode } from './generic-engine';
export type { GenericDarkModeOptions } from './generic-engine';
export { isDarkSite } from './dark-site-detector';
export { DARK_SITES, isKnownDarkSite } from './dark-sites';
