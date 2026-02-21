// @darkly/site-drive — Google Drive DOM selectors
// Centralized selector constants for Drive-specific DOM elements.
// Drive is dashboard-only, so these are primarily for reference and
// future use since CSS inversion handles the visual transformation.

/** Google's global header bar — shared across Workspace dashboards */
export const HEADER_SELECTOR = 'header#gb';

/** Right-side section of the header (apps grid + avatar) */
export const RIGHT_SECTION_SELECTOR = '[data-ogsr-up]';

/** Main content area — the file list and navigation */
export const MAIN_CONTENT_SELECTOR = '[role="main"]';

/** File list container */
export const FILE_LIST_SELECTOR = '[data-view-type]';

/** Left sidebar navigation */
export const SIDEBAR_NAV_SELECTOR = '[data-target="navContainer"]';

/** Search bar container */
export const SEARCH_BAR_SELECTOR = '[role="search"]';

/** File/folder item rows */
export const FILE_ITEM_SELECTOR = '[data-id]';
