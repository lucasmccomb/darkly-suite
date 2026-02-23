/**
 * Classify a site's CSS complexity to determine the best theming strategy.
 *
 * Complexity levels:
 * - simple: Few stylesheets, mostly CSS variables -> fast path likely works
 * - moderate: Multiple stylesheets, some inline styles -> needs processing
 * - complex: Many stylesheets, lots of inline styles, shadow DOM -> full pipeline
 */

export type ComplexityLevel = 'simple' | 'moderate' | 'complex';

export interface ComplexityAnalysis {
  level: ComplexityLevel;
  stylesheetCount: number;
  totalRuleCount: number;
  inlineStyleCount: number;
  shadowRootCount: number;
  cssVariableCount: number;
  /** Recommended strategy based on complexity. */
  recommendedStrategy: 'css-vars' | 'full-processing' | 'filter-only';
}

export function classifyComplexity(): ComplexityAnalysis {
  let stylesheetCount = 0;
  let totalRuleCount = 0;
  let cssVariableCount = 0;

  for (const sheet of document.styleSheets) {
    stylesheetCount++;
    try {
      totalRuleCount += sheet.cssRules.length;
      for (const rule of sheet.cssRules) {
        if (rule instanceof CSSStyleRule) {
          for (let i = 0; i < rule.style.length; i++) {
            if (rule.style[i].startsWith('--')) cssVariableCount++;
          }
        }
      }
    } catch {
      /* CORS — cross-origin stylesheets block cssRules access */
    }
  }

  const inlineStyleCount = document.querySelectorAll('[style]').length;

  // Count shadow roots (open only — closed roots need chrome.dom API)
  let shadowRootCount = 0;
  const walker = document.createTreeWalker(
    document.documentElement,
    NodeFilter.SHOW_ELEMENT,
  );
  let node = walker.nextNode();
  while (node) {
    if ((node as Element).shadowRoot) shadowRootCount++;
    node = walker.nextNode();
  }

  // Classify
  let level: ComplexityLevel;
  let recommendedStrategy: 'css-vars' | 'full-processing' | 'filter-only';

  if (cssVariableCount > 10 && totalRuleCount < 500) {
    level = 'simple';
    recommendedStrategy = 'css-vars';
  } else if (
    totalRuleCount < 2000 &&
    inlineStyleCount < 100 &&
    shadowRootCount < 5
  ) {
    level = 'moderate';
    recommendedStrategy = 'full-processing';
  } else {
    level = 'complex';
    recommendedStrategy = totalRuleCount > 5000 ? 'filter-only' : 'full-processing';
  }

  return {
    level,
    stylesheetCount,
    totalRuleCount,
    inlineStyleCount,
    shadowRootCount,
    cssVariableCount,
    recommendedStrategy,
  };
}
