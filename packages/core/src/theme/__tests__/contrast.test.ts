import { PRESETS, DEFAULT_DARK_VARIABLES } from '../presets';

// --- WCAG 2.1 contrast ratio helpers ---

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(...hexToRgb(hex1));
  const l2 = relativeLuminance(...hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// --- Theme data ---
// In the monorepo, CSS variables use the canonical --darkly-* prefix.
// The webpack prefix loader transforms these at build time per product.

const ALL_THEMES: Record<string, Record<string, string>> = {
  'Default Dark': { ...DEFAULT_DARK_VARIABLES },
  ...Object.fromEntries(
    Object.entries(PRESETS).map(([, preset]) => [preset.label, { ...preset.variables }])
  ),
};

// --- Contrast pairings ---
// WCAG AA: 4.5:1 for normal text, 3:1 for large text / UI components
// Uses --darkly-* canonical prefix (parameterized, not hardcoded gd)

interface ContrastPairing {
  fg: string;
  bg: string;
  label: string;
  minRatio: number;
}

const PAIRINGS: ContrastPairing[] = [
  // Primary text on all backgrounds
  { fg: '--darkly-text-primary', bg: '--darkly-bg-primary', label: 'body text on primary bg', minRatio: 4.5 },
  { fg: '--darkly-text-primary', bg: '--darkly-bg-secondary', label: 'body text on sidebar bg', minRatio: 4.5 },
  { fg: '--darkly-text-primary', bg: '--darkly-bg-surface', label: 'body text on surface/card bg', minRatio: 4.5 },
  { fg: '--darkly-text-primary', bg: '--darkly-bg-hover', label: 'body text on hover bg', minRatio: 4.5 },
  { fg: '--darkly-text-primary', bg: '--darkly-compose-bg', label: 'body text on compose bg', minRatio: 4.5 },
  { fg: '--darkly-text-primary', bg: '--darkly-unread-bg', label: 'body text on unread row bg', minRatio: 4.5 },
  { fg: '--darkly-text-primary', bg: '--darkly-read-bg', label: 'body text on read row bg', minRatio: 4.5 },
  { fg: '--darkly-text-primary', bg: '--darkly-selected-bg', label: 'body text on selected row bg', minRatio: 4.5 },

  // Secondary text on common backgrounds
  { fg: '--darkly-text-secondary', bg: '--darkly-bg-primary', label: 'secondary text on primary bg', minRatio: 4.5 },
  { fg: '--darkly-text-secondary', bg: '--darkly-bg-secondary', label: 'secondary text on sidebar bg', minRatio: 4.5 },

  // Link text on common backgrounds
  { fg: '--darkly-text-link', bg: '--darkly-bg-primary', label: 'link text on primary bg', minRatio: 4.5 },
  { fg: '--darkly-text-link', bg: '--darkly-bg-surface', label: 'link text on surface bg', minRatio: 4.5 },

  // Accent as UI component color (3:1 threshold per WCAG for non-text)
  { fg: '--darkly-accent', bg: '--darkly-bg-primary', label: 'accent on primary bg (UI)', minRatio: 3 },
];

// --- Tests ---

describe('WCAG AA contrast compliance', () => {
  for (const [themeName, vars] of Object.entries(ALL_THEMES)) {
    describe(themeName, () => {
      for (const pairing of PAIRINGS) {
        const fgHex = vars[pairing.fg];
        const bgHex = vars[pairing.bg];

        // Skip pairings with non-hex values (e.g. rgba shadows)
        if (!fgHex?.startsWith('#') || !bgHex?.startsWith('#')) continue;

        it(`${pairing.label}: ${pairing.fg} on ${pairing.bg} >= ${pairing.minRatio}:1`, () => {
          const ratio = contrastRatio(fgHex, bgHex);
          expect(ratio).toBeGreaterThanOrEqual(pairing.minRatio);
        });
      }
    });
  }
});
