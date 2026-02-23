/**
 * CSS Custom Property Fast Path
 *
 * For modern sites that use CSS variables for colors, we can theme the entire
 * site by overriding :root custom properties — zero per-rule processing.
 *
 * Steps:
 * 1. Scan computed styles on :root for custom properties
 * 2. Identify which ones contain color values
 * 3. Transform them using the color engine
 * 4. Inject overrides via a single <style> element
 */

import { parseColor, transformColor } from './color-transform';

export interface CssVarOverride {
  property: string;
  originalValue: string;
  transformedValue: string;
}

/** Check if a CSS value looks like a color. */
function isColorValue(value: string): boolean {
  const trimmed = value.trim();
  return (
    trimmed.startsWith('#') ||
    trimmed.startsWith('rgb') ||
    trimmed.startsWith('hsl') ||
    parseColor(trimmed) !== null
  );
}

/** Scan :root for CSS custom properties containing color values. */
export function scanRootColorVars(): CssVarOverride[] {
  const overrides: CssVarOverride[] = [];

  // Get all custom properties from stylesheets
  // (getComputedStyle doesn't enumerate custom property names)
  const customProps = new Map<string, string>();

  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule instanceof CSSStyleRule && rule.selectorText === ':root') {
          for (let i = 0; i < rule.style.length; i++) {
            const prop = rule.style[i];
            if (prop.startsWith('--')) {
              customProps.set(prop, rule.style.getPropertyValue(prop).trim());
            }
          }
        }
      }
    } catch {
      // CORS-blocked stylesheet — skip
    }
  }

  for (const [prop, value] of customProps) {
    if (isColorValue(value)) {
      const transformed = transformColor(value, 'background');
      if (transformed && transformed !== value) {
        overrides.push({
          property: prop,
          originalValue: value,
          transformedValue: transformed,
        });
      }
    }
  }

  return overrides;
}

/** Generate a CSS string that overrides :root color variables. */
export function generateVarOverrideCSS(overrides: CssVarOverride[]): string {
  if (overrides.length === 0) return '';

  const declarations = overrides
    .map((o) => `  ${o.property}: ${o.transformedValue} !important;`)
    .join('\n');

  return `:root {\n${declarations}\n}`;
}

/** Attempt the fast path: scan, transform, return CSS. Returns null if no vars found. */
export function attemptCssVarFastPath(): string | null {
  const overrides = scanRootColorVars();
  if (overrides.length === 0) return null;
  const css = generateVarOverrideCSS(overrides);
  return css || null;
}
