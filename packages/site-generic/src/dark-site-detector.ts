import { isKnownDarkSite } from './dark-sites';

/**
 * Detects whether the current page already has a dark theme applied.
 * Uses multiple signals: known dark sites list, color-scheme meta tag,
 * CSS class patterns, and sampling background colors of key elements.
 *
 * This is used to avoid double-darkening sites that already have
 * native dark mode enabled (e.g., GitHub in dark mode, Discord, etc.).
 */
export function isDarkSite(): boolean {
  // 0. Check static list of known dark sites
  if (isKnownDarkSite(window.location.hostname)) return true;

  // 1. Check color-scheme meta tag
  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) {
    const content = meta.getAttribute('content') || '';
    if (content.includes('dark') && !content.includes('light')) return true;
  }

  // 2. Check common dark mode CSS classes on html/body
  const darkClassPatterns = [
    /\bdark\b/,
    /\bdark-mode\b/,
    /\bdark-theme\b/,
    /\btheme-dark\b/,
  ];
  const htmlClasses = document.documentElement.className;
  const bodyClasses = document.body?.className || '';
  const combinedClasses = `${htmlClasses} ${bodyClasses}`;
  if (darkClassPatterns.some((p) => p.test(combinedClasses))) return true;

  // 3. Sample background color of body
  if (document.body) {
    const bg = getComputedStyle(document.body).backgroundColor;
    const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      const [, r, g, b] = match.map(Number);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      if (luminance < 0.3) return true; // Dark background
    }
  }

  return false;
}
