/**
 * Color Transformation Engine for dark mode.
 *
 * Parses CSS color values, converts to HSL, applies context-aware
 * lightness transformations, and outputs formatted CSS color strings.
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
  a: number;
}

export type ColorContext = 'background' | 'foreground' | 'border';

/** Common named CSS colors (subset of the full 140+ list). */
const NAMED_COLORS: Record<string, RGB> = {
  white: { r: 255, g: 255, b: 255, a: 1 },
  black: { r: 0, g: 0, b: 0, a: 1 },
  red: { r: 255, g: 0, b: 0, a: 1 },
  green: { r: 0, g: 128, b: 0, a: 1 },
  blue: { r: 0, g: 0, b: 255, a: 1 },
  yellow: { r: 255, g: 255, b: 0, a: 1 },
  cyan: { r: 0, g: 255, b: 255, a: 1 },
  magenta: { r: 255, g: 0, b: 255, a: 1 },
  gray: { r: 128, g: 128, b: 128, a: 1 },
  grey: { r: 128, g: 128, b: 128, a: 1 },
  orange: { r: 255, g: 165, b: 0, a: 1 },
  purple: { r: 128, g: 0, b: 128, a: 1 },
  pink: { r: 255, g: 192, b: 203, a: 1 },
  brown: { r: 165, g: 42, b: 42, a: 1 },
  navy: { r: 0, g: 0, b: 128, a: 1 },
  teal: { r: 0, g: 128, b: 128, a: 1 },
  silver: { r: 192, g: 192, b: 192, a: 1 },
  maroon: { r: 128, g: 0, b: 0, a: 1 },
  olive: { r: 128, g: 128, b: 0, a: 1 },
  lime: { r: 0, g: 255, b: 0, a: 1 },
  aqua: { r: 0, g: 255, b: 255, a: 1 },
  transparent: { r: 0, g: 0, b: 0, a: 0 },
};

/** Parse a hex color string (3, 4, 6, or 8 digits). */
function parseHex(hex: string): RGB | null {
  // Strip leading #
  const h = hex.slice(1);
  let r: number, g: number, b: number, a: number;

  if (h.length === 3) {
    r = parseInt(h[0] + h[0], 16);
    g = parseInt(h[1] + h[1], 16);
    b = parseInt(h[2] + h[2], 16);
    a = 1;
  } else if (h.length === 4) {
    r = parseInt(h[0] + h[0], 16);
    g = parseInt(h[1] + h[1], 16);
    b = parseInt(h[2] + h[2], 16);
    a = parseInt(h[3] + h[3], 16) / 255;
  } else if (h.length === 6) {
    r = parseInt(h.slice(0, 2), 16);
    g = parseInt(h.slice(2, 4), 16);
    b = parseInt(h.slice(4, 6), 16);
    a = 1;
  } else if (h.length === 8) {
    r = parseInt(h.slice(0, 2), 16);
    g = parseInt(h.slice(2, 4), 16);
    b = parseInt(h.slice(4, 6), 16);
    a = parseInt(h.slice(6, 8), 16) / 255;
  } else {
    return null;
  }

  if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a)) return null;
  return { r, g, b, a };
}

/** Parse rgb() or rgba() functional notation. */
function parseRgbFunc(value: string): RGB | null {
  const match = value.match(
    /^rgba?\(\s*([\d.]+)\s*[,/\s]\s*([\d.]+)\s*[,/\s]\s*([\d.]+)(?:\s*[,/\s]\s*([\d.]+%?))?\s*\)$/
  );
  if (!match) return null;

  const r = parseFloat(match[1]);
  const g = parseFloat(match[2]);
  const b = parseFloat(match[3]);
  let a = 1;
  if (match[4] !== undefined) {
    a = match[4].endsWith('%')
      ? parseFloat(match[4]) / 100
      : parseFloat(match[4]);
  }

  if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a)) return null;
  if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) return null;
  return { r, g, b, a: Math.max(0, Math.min(1, a)) };
}

/** Parse hsl() or hsla() functional notation. */
function parseHslFunc(value: string): RGB | null {
  const match = value.match(
    /^hsla?\(\s*([\d.]+)\s*[,/\s]\s*([\d.]+)%\s*[,/\s]\s*([\d.]+)%(?:\s*[,/\s]\s*([\d.]+%?))?\s*\)$/
  );
  if (!match) return null;

  const h = parseFloat(match[1]);
  const s = parseFloat(match[2]) / 100;
  const l = parseFloat(match[3]) / 100;
  let a = 1;
  if (match[4] !== undefined) {
    a = match[4].endsWith('%')
      ? parseFloat(match[4]) / 100
      : parseFloat(match[4]);
  }

  if (isNaN(h) || isNaN(s) || isNaN(l) || isNaN(a)) return null;
  return { ...hslToRgb({ h, s, l, a: Math.max(0, Math.min(1, a)) }) };
}

/**
 * Parse a CSS color value into an RGB object.
 * Supports: hex (3/4/6/8), rgb(), rgba(), hsl(), hsla(), named colors.
 */
export function parseColor(value: string): RGB | null {
  const trimmed = value.trim().toLowerCase();

  // Named color
  if (NAMED_COLORS[trimmed]) {
    return { ...NAMED_COLORS[trimmed] };
  }

  // Hex
  if (trimmed.startsWith('#')) {
    return parseHex(trimmed);
  }

  // hsl/hsla (check before rgb since both use parentheses)
  if (trimmed.startsWith('hsl')) {
    return parseHslFunc(trimmed);
  }

  // rgb/rgba
  if (trimmed.startsWith('rgb')) {
    return parseRgbFunc(trimmed);
  }

  return null;
}

/** Convert RGB [0-255] to HSL [h: 0-360, s: 0-1, l: 0-1]. */
export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l, a: rgb.a };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  if (max === r) {
    h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  } else if (max === g) {
    h = ((b - r) / d + 2) / 6;
  } else {
    h = ((r - g) / d + 4) / 6;
  }

  return { h: h * 360, s, l, a: rgb.a };
}

/** Convert HSL [h: 0-360, s: 0-1, l: 0-1] to RGB [0-255]. */
export function hslToRgb(hsl: HSL): RGB {
  const { h, s, l, a } = hsl;

  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v, a };
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hNorm = h / 360;

  return {
    r: Math.round(hue2rgb(p, q, hNorm + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hNorm) * 255),
    b: Math.round(hue2rgb(p, q, hNorm - 1 / 3) * 255),
    a,
  };
}

/** Format an RGB value as a CSS color string. */
export function formatRgb(rgb: RGB): string {
  const r = Math.max(0, Math.min(255, Math.round(rgb.r)));
  const g = Math.max(0, Math.min(255, Math.round(rgb.g)));
  const b = Math.max(0, Math.min(255, Math.round(rgb.b)));
  const a = Math.max(0, Math.min(1, rgb.a));

  if (a < 1) {
    return `rgba(${r}, ${g}, ${b}, ${parseFloat(a.toFixed(3))})`;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

/** Linear interpolation. */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Apply dark mode transformation to an HSL color based on context.
 *
 * - background: light backgrounds (L >= 0.5) map to [0.08, 0.2]; dark kept mostly unchanged
 * - foreground: dark text (L <= 0.5) map to [0.75, 0.95]
 * - border: simple inversion, map to [0.2, 0.4]
 */
function transformHsl(hsl: HSL, context: ColorContext): HSL {
  const { h, s, l, a } = hsl;

  switch (context) {
    case 'background': {
      if (l >= 0.5) {
        // Light background → dark: map [0.5, 1.0] to [0.2, 0.08]
        const t = (l - 0.5) / 0.5;
        return { h, s, l: lerp(0.2, 0.08, t), a };
      }
      // Already dark background — leave mostly unchanged
      return { h, s, l, a };
    }

    case 'foreground': {
      if (l <= 0.5) {
        // Dark text → light: map [0.0, 0.5] to [0.95, 0.75]
        const t = l / 0.5;
        return { h, s, l: lerp(0.95, 0.75, t), a };
      }
      // Already light text — leave mostly unchanged
      return { h, s, l, a };
    }

    case 'border': {
      // Map lightness into [0.2, 0.4] range via simple inversion
      const inverted = 1 - l;
      return { h, s, l: lerp(0.2, 0.4, inverted), a };
    }

    default:
      return { h, s, l, a };
  }
}

/**
 * Transform a CSS color value for dark mode.
 * Main entry: parse → HSL → transform → RGB → format.
 *
 * Returns null if the value cannot be parsed as a color.
 */
export function transformColor(
  value: string,
  context: ColorContext
): string | null {
  const rgb = parseColor(value);
  if (!rgb) return null;

  // Fully transparent colors don't need transformation
  if (rgb.a === 0) return value;

  const hsl = rgbToHsl(rgb);
  const transformed = transformHsl(hsl, context);
  const result = hslToRgb(transformed);
  return formatRgb(result);
}
