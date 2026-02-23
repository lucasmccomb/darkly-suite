/**
 * Top 10 breakage pattern handlers for CSS filter inversion.
 *
 * These handle the most common visual artifacts when using
 * filter: invert() hue-rotate() on web pages.
 */

export interface BreakageHandler {
  name: string;
  /** CSS selector matching elements that need fixing. */
  selector: string;
  /** CSS to apply as a fix. */
  css: string;
}

/**
 * Top 10 breakage patterns and their fixes.
 * Applied via <style> injection when filter mode is active.
 */
export const BREAKAGE_HANDLERS: BreakageHandler[] = [
  {
    name: 'images-reinvert',
    selector: 'img, picture source',
    css: 'filter: invert(1) hue-rotate(180deg) !important;',
  },
  {
    name: 'video-reinvert',
    selector: 'video, video *',
    css: 'filter: invert(1) hue-rotate(180deg) !important;',
  },
  {
    name: 'canvas-reinvert',
    selector: 'canvas',
    css: 'filter: invert(1) hue-rotate(180deg) !important;',
  },
  {
    name: 'svg-reinvert',
    selector: 'svg:not([class*="icon"]):not([class*="logo"]):not([width="1"]):not([height="1"])',
    css: 'filter: invert(1) hue-rotate(180deg) !important;',
  },
  {
    name: 'background-image-reinvert',
    selector: '[style*="background-image"]:not([role="presentation"])',
    css: 'filter: invert(1) hue-rotate(180deg) !important;',
  },
  {
    name: 'iframe-reinvert',
    selector: 'iframe, embed, object',
    css: 'filter: invert(1) hue-rotate(180deg) !important;',
  },
  {
    name: 'favicon-reinvert',
    selector: 'link[rel*="icon"]',
    css: 'filter: invert(1) hue-rotate(180deg) !important;',
  },
  {
    name: 'input-fix',
    selector:
      'input[type="color"], input[type="range"], input[type="date"], input[type="datetime-local"], input[type="time"]',
    css: 'filter: invert(1) hue-rotate(180deg) !important;',
  },
  {
    name: 'map-reinvert',
    selector:
      '.mapboxgl-map, .leaflet-container, [class*="google-map"], [class*="gm-style"]',
    css: 'filter: invert(1) hue-rotate(180deg) !important;',
  },
  {
    name: 'code-highlight-fix',
    selector:
      'pre code, .highlight, .hljs, .prism-code, [class*="CodeMirror"], [class*="monaco-editor"]',
    css: 'filter: invert(1) hue-rotate(180deg) !important;',
  },
];

/** Generate CSS for all breakage handlers. */
export function generateBreakageCSS(): string {
  return BREAKAGE_HANDLERS.map(
    (h) => `/* ${h.name} */\n${h.selector} { ${h.css} }`,
  ).join('\n\n');
}

/** Generate CSS for specific handlers by name. */
export function generateBreakageCSSForHandlers(names: string[]): string {
  const selected = BREAKAGE_HANDLERS.filter((h) => names.includes(h.name));
  return selected
    .map((h) => `/* ${h.name} */\n${h.selector} { ${h.css} }`)
    .join('\n\n');
}
