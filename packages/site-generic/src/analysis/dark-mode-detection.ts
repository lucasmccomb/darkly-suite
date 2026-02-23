/**
 * Analyze a site's CSS to detect if it has built-in dark mode support.
 *
 * Detection signals:
 * 1. prefers-color-scheme media queries in stylesheets
 * 2. color-scheme meta tag or CSS property
 * 3. Dark class toggles (html.dark, [data-theme="dark"], etc.)
 * 4. CSS custom properties following dark mode naming conventions
 */

export interface DarkModeAnalysis {
  hasPrefersDarkScheme: boolean;
  hasColorSchemeMeta: boolean;
  hasColorSchemeCSS: boolean;
  hasDarkClassToggle: boolean;
  hasDarkModeVariables: boolean;
  /** Overall confidence that the site supports native dark mode (0-1). */
  confidence: number;
  signals: string[];
}

export function analyzeDarkModeSupport(): DarkModeAnalysis {
  const signals: string[] = [];
  let score = 0;

  // 1. Check for prefers-color-scheme media queries
  const hasPrefersDarkScheme = checkPrefersColorScheme();
  if (hasPrefersDarkScheme) {
    score += 0.4;
    signals.push('prefers-color-scheme: dark in CSS');
  }

  // 2. Check color-scheme meta
  const hasColorSchemeMeta = !!document.querySelector(
    'meta[name="color-scheme"][content*="dark"]',
  );
  if (hasColorSchemeMeta) {
    score += 0.3;
    signals.push('color-scheme meta tag');
  }

  // 3. Check color-scheme CSS property
  const rootCS = getComputedStyle(document.documentElement).colorScheme;
  const hasColorSchemeCSS = rootCS.includes('dark');
  if (hasColorSchemeCSS) {
    score += 0.3;
    signals.push('color-scheme CSS property');
  }

  // 4. Check dark class toggles
  const hasDarkClassToggle = checkDarkClassToggle();
  if (hasDarkClassToggle) {
    score += 0.2;
    signals.push('Dark class toggle on html/body');
  }

  // 5. Check dark mode variable naming conventions
  const hasDarkModeVariables = checkDarkModeVariables();
  if (hasDarkModeVariables) {
    score += 0.1;
    signals.push('Dark mode CSS variable conventions');
  }

  return {
    hasPrefersDarkScheme,
    hasColorSchemeMeta,
    hasColorSchemeCSS,
    hasDarkClassToggle,
    hasDarkModeVariables,
    confidence: Math.min(score, 1),
    signals,
  };
}

function checkPrefersColorScheme(): boolean {
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (
          rule instanceof CSSMediaRule &&
          rule.conditionText?.includes('prefers-color-scheme')
        ) {
          return true;
        }
      }
    } catch {
      /* CORS — cross-origin stylesheets block cssRules access */
    }
  }
  return false;
}

function checkDarkClassToggle(): boolean {
  const html = document.documentElement;
  const body = document.body;
  const darkPatterns = ['dark', 'dark-mode', 'dark-theme', 'theme-dark', 'night'];

  for (const el of [html, body]) {
    if (!el) continue;
    for (const cls of el.classList) {
      if (darkPatterns.some((p) => cls.toLowerCase().includes(p))) return true;
    }
    const theme =
      el.getAttribute('data-theme') || el.getAttribute('data-color-scheme');
    if (theme?.toLowerCase().includes('dark')) return true;
  }
  return false;
}

function checkDarkModeVariables(): boolean {
  const darkVarPatterns = [
    '--dark',
    '--theme-dark',
    '--color-scheme',
    '--bg-dark',
    '--background-dark',
  ];
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule instanceof CSSStyleRule) {
          for (let i = 0; i < rule.style.length; i++) {
            const prop = rule.style[i];
            if (
              prop.startsWith('--') &&
              darkVarPatterns.some((p) => prop.includes(p))
            ) {
              return true;
            }
          }
        }
      }
    } catch {
      /* CORS — cross-origin stylesheets block cssRules access */
    }
  }
  return false;
}
