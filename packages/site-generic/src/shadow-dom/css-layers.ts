/**
 * CSS @layer for organizing override hierarchy inside shadow DOM.
 *
 * Layer order (lowest to highest priority):
 * 1. base — default dark mode variables
 * 2. site-fix — site-specific overrides
 * 3. user — user customizations
 */

export const LAYER_ORDER = '@layer base, site-fix, user;';

export function wrapInLayer(
  css: string,
  layer: 'base' | 'site-fix' | 'user',
): string {
  return `@layer ${layer} {\n${css}\n}`;
}

/** Generate the complete layered CSS for a shadow root. */
export function buildLayeredCSS(options: {
  base?: string;
  siteFix?: string;
  user?: string;
}): string {
  const parts: string[] = [LAYER_ORDER];

  if (options.base) parts.push(wrapInLayer(options.base, 'base'));
  if (options.siteFix) parts.push(wrapInLayer(options.siteFix, 'site-fix'));
  if (options.user) parts.push(wrapInLayer(options.user, 'user'));

  return parts.join('\n\n');
}
