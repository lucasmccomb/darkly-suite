/**
 * Detect if a site is currently rendering in its native dark mode.
 * Different from dark-mode-detection.ts which checks support — this checks current state.
 */

export interface NativeDarkState {
  isCurrentlyDark: boolean;
  /** Average luminance of sampled background colors (0=black, 1=white). */
  averageLuminance: number;
  /** Method that determined the state. */
  detectionMethod: 'meta' | 'class' | 'luminance' | 'unknown';
}

export function detectNativeDarkState(): NativeDarkState {
  // Method 1: color-scheme meta indicates current preference
  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta?.getAttribute('content')?.includes('dark')) {
    const lum = samplePageLuminance();
    if (lum < 0.3) {
      return { isCurrentlyDark: true, averageLuminance: lum, detectionMethod: 'meta' };
    }
  }

  // Method 2: Dark class active
  const html = document.documentElement;
  const darkPatterns = ['dark', 'dark-mode', 'dark-theme'];
  for (const cls of html.classList) {
    if (darkPatterns.some((p) => cls.toLowerCase().includes(p))) {
      const lum = samplePageLuminance();
      return { isCurrentlyDark: lum < 0.3, averageLuminance: lum, detectionMethod: 'class' };
    }
  }

  const dataTheme =
    html.getAttribute('data-theme') || html.getAttribute('data-color-scheme');
  if (dataTheme?.toLowerCase().includes('dark')) {
    const lum = samplePageLuminance();
    return { isCurrentlyDark: lum < 0.3, averageLuminance: lum, detectionMethod: 'class' };
  }

  // Method 3: Luminance sampling
  const lum = samplePageLuminance();
  return {
    isCurrentlyDark: lum < 0.25,
    averageLuminance: lum,
    detectionMethod: lum < 0.25 ? 'luminance' : 'unknown',
  };
}

function samplePageLuminance(): number {
  const elements = [
    document.body,
    document.querySelector('main'),
    document.querySelector('#app'),
    document.querySelector('#root'),
    document.querySelector('.container'),
  ].filter(Boolean) as Element[];

  if (elements.length === 0) return 0.5;

  let totalLum = 0;
  let count = 0;

  for (const el of elements) {
    const bg = getComputedStyle(el).backgroundColor;
    const lum = parseBgLuminance(bg);
    if (lum !== null) {
      totalLum += lum;
      count++;
    }
  }

  return count > 0 ? totalLum / count : 0.5;
}

function parseBgLuminance(bg: string): number | null {
  const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return null;
  const r = parseInt(match[1]) / 255;
  const g = parseInt(match[2]) / 255;
  const b = parseInt(match[3]) / 255;
  // Relative luminance (ITU-R BT.709)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
