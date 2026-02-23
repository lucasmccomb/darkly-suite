/**
 * CSS Processing Pipeline
 *
 * Processes stylesheet rules by extracting color declarations,
 * transforming them for dark mode, and generating override CSS.
 *
 * Can run synchronously on the main thread or be delegated to a Web Worker.
 */

import { transformColor, type ColorContext } from '../color-transform';

export interface ProcessedStylesheet {
  originalHref: string | null;
  overrideCSS: string;
  ruleCount: number;
}

/** Classify a CSS property as a color context. */
function getColorContext(property: string): ColorContext | null {
  const bgProps = [
    'background',
    'background-color',
    'background-image',
  ];
  const fgProps = [
    'color',
    'fill',
    'stroke',
    'caret-color',
    'column-rule-color',
    'text-decoration-color',
    'text-emphasis-color',
  ];
  const borderProps = [
    'border',
    'border-color',
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
    'outline-color',
    'box-shadow',
  ];

  if (bgProps.includes(property)) return 'background';
  if (fgProps.includes(property)) return 'foreground';
  if (borderProps.includes(property)) return 'border';
  return null;
}

/** Process a single CSS style rule and return override declarations. */
function processRule(rule: CSSStyleRule): string | null {
  const overrides: string[] = [];

  for (let i = 0; i < rule.style.length; i++) {
    const property = rule.style[i];
    const context = getColorContext(property);
    if (!context) continue;

    const value = rule.style.getPropertyValue(property);
    const transformed = transformColor(value, context);
    if (transformed && transformed !== value) {
      overrides.push(`  ${property}: ${transformed} !important;`);
    }
  }

  if (overrides.length === 0) return null;
  return `${rule.selectorText} {\n${overrides.join('\n')}\n}`;
}

/** Process all stylesheets on the page and return override CSS. */
export function processPageStylesheets(): ProcessedStylesheet[] {
  const results: ProcessedStylesheet[] = [];

  for (const sheet of document.styleSheets) {
    try {
      const rules = sheet.cssRules;
      const overrideRules: string[] = [];

      for (const rule of rules) {
        if (rule instanceof CSSStyleRule) {
          const override = processRule(rule);
          if (override) overrideRules.push(override);
        }
      }

      if (overrideRules.length > 0) {
        results.push({
          originalHref: sheet.href,
          overrideCSS: overrideRules.join('\n\n'),
          ruleCount: overrideRules.length,
        });
      }
    } catch {
      // CORS-blocked stylesheet — skip
    }
  }

  return results;
}

/** Process all stylesheets and return combined override CSS string. */
export function generateFullOverrideCSS(): string {
  const processed = processPageStylesheets();
  return processed.map((p) => p.overrideCSS).join('\n\n');
}
