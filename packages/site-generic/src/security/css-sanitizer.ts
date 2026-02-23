/**
 * Client-side CSS sanitization pipeline.
 *
 * Validates CSS from external sources (override bundles, R2 CDN)
 * before injection. Removes potentially dangerous constructs.
 */

export interface SanitizationResult {
  css: string;
  removed: string[];
  isClean: boolean;
}

/** Dangerous CSS patterns to strip. */
const DANGEROUS_PATTERNS: Array<{ pattern: RegExp; description: string }> = [
  { pattern: /url\s*\(\s*['"]?javascript:/gi, description: 'javascript: URL' },
  { pattern: /url\s*\(\s*['"]?data:text\/html/gi, description: 'data:text/html URL' },
  { pattern: /expression\s*\(/gi, description: 'CSS expression()' },
  { pattern: /-moz-binding\s*:/gi, description: '-moz-binding' },
  { pattern: /behavior\s*:/gi, description: 'behavior property' },
  { pattern: /@import\s+url/gi, description: '@import url' },
  { pattern: /@import\s+['"]/gi, description: '@import string' },
];

/** Maximum CSS size in bytes (1MB). */
const MAX_CSS_SIZE = 1024 * 1024;

export function sanitizeCSS(input: string): SanitizationResult {
  const removed: string[] = [];

  // Size check
  if (input.length > MAX_CSS_SIZE) {
    return { css: '', removed: ['Exceeded maximum size limit'], isClean: false };
  }

  let css = input;

  // Remove dangerous patterns
  for (const { pattern, description } of DANGEROUS_PATTERNS) {
    if (pattern.test(css)) {
      removed.push(description);
      // Reset lastIndex since we tested with the global regex above
      pattern.lastIndex = 0;
      css = css.replace(pattern, '/* removed */');
    }
  }

  // Validate by parsing through the browser's CSS parser
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    // Re-serialize from the parsed sheet (browser strips anything it doesn't understand)
    const rules = Array.from(sheet.cssRules).map((r) => r.cssText);
    css = rules.join('\n');
  } catch {
    removed.push('Failed CSS parser validation');
    return { css: '', removed, isClean: false };
  }

  return { css, removed, isClean: removed.length === 0 };
}
