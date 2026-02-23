/**
 * Override Decision Flow
 *
 * Orchestrates the dark mode strategy selection:
 * 1. Check IndexedDB cache -> inject if hit
 * 2. Try CSS variable fast path -> use if found
 * 3. Fall back to full CSS processing
 * 4. Cache the result for next visit
 *
 * The GPU filter runs as instant visual feedback while this pipeline executes.
 */

import { getCachedCSS, setCachedCSS, hashString } from './css-cache';
import { attemptCssVarFastPath } from './css-var-fast-path';
import { generateFullOverrideCSS } from './worker/css-processor';

export type OverrideStrategy =
  | 'cached'
  | 'css-vars'
  | 'full-processing'
  | 'filter-only';

export interface OverrideResult {
  strategy: OverrideStrategy;
  css: string | null;
  processingTimeMs: number;
}

/** Collect all stylesheet content for hashing. */
function collectCSSContent(): string {
  const parts: string[] = [];
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        parts.push(rule.cssText);
      }
    } catch {
      // CORS-blocked — use href as fingerprint
      if (sheet.href) parts.push(sheet.href);
    }
  }
  return parts.join('');
}

/**
 * Execute the override decision pipeline.
 * Returns the strategy used and the override CSS (if any).
 */
export async function executeOverridePipeline(
  domain: string,
): Promise<OverrideResult> {
  const start = performance.now();

  // Step 1: Check IndexedDB cache
  const cssContent = collectCSSContent();
  const cssHash = hashString(cssContent);

  const cached = await getCachedCSS(domain, cssHash);
  if (cached) {
    return {
      strategy: 'cached',
      css: cached,
      processingTimeMs: performance.now() - start,
    };
  }

  // Step 2: Try CSS variable fast path
  const varCSS = attemptCssVarFastPath();
  if (varCSS) {
    // Cache the result
    await setCachedCSS(domain, cssHash, varCSS);
    return {
      strategy: 'css-vars',
      css: varCSS,
      processingTimeMs: performance.now() - start,
    };
  }

  // Step 3: Full CSS processing
  const fullCSS = generateFullOverrideCSS();
  if (fullCSS) {
    await setCachedCSS(domain, cssHash, fullCSS);
    return {
      strategy: 'full-processing',
      css: fullCSS,
      processingTimeMs: performance.now() - start,
    };
  }

  // Step 4: No overrides found — filter stays
  return {
    strategy: 'filter-only',
    css: null,
    processingTimeMs: performance.now() - start,
  };
}
