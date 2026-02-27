/**
 * SVG browser chrome frame generator.
 *
 * Produces a macOS-style browser title bar with traffic lights and
 * an optional URL bar. The output is an SVG buffer that Sharp can
 * composite onto the final image.
 */

import type { FrameStyle } from '../types.js';

export interface BrowserChromeOptions {
  /** Width of the frame (matches content width). */
  width: number;
  /** Height of the title bar (default: 40). */
  height?: number;
  /** URL text shown in the address bar. */
  url?: string;
  /** Visual style of the frame. */
  style: FrameStyle;
}

interface StyleConfig {
  bg: string;
  urlBarBg: string;
  urlTextColor: string;
  borderBottom: string;
}

const STYLES: Record<FrameStyle, StyleConfig> = {
  'macos-dark': {
    bg: '#2d2d2d',
    urlBarBg: '#1a1a1a',
    urlTextColor: '#999999',
    borderBottom: '#1a1a1a',
  },
  'macos-light': {
    bg: '#e8e8e8',
    urlBarBg: '#ffffff',
    urlTextColor: '#666666',
    borderBottom: '#d0d0d0',
  },
};

// Traffic light positions and colors
const TRAFFIC_LIGHTS = [
  { cx: 20, color: '#ff5f57' }, // Close (red)
  { cx: 40, color: '#febc2e' }, // Minimize (yellow)
  { cx: 60, color: '#28c840' }, // Maximize (green)
] as const;

const TRAFFIC_LIGHT_RADIUS = 6;

/**
 * Generate an SVG buffer of a macOS-style browser title bar.
 */
export function generateBrowserChrome(options: BrowserChromeOptions): Buffer {
  const { width, height = 40, url, style } = options;
  const config = STYLES[style];
  const centerY = height / 2;

  // Traffic lights SVG
  const trafficLightsSvg = TRAFFIC_LIGHTS.map(
    (light) =>
      `<circle cx="${light.cx}" cy="${centerY}" r="${TRAFFIC_LIGHT_RADIUS}" fill="${light.color}" />`
  ).join('\n    ');

  // URL bar (centered, takes up middle ~60% of the bar)
  const urlBarWidth = Math.min(width * 0.5, 500);
  const urlBarHeight = 24;
  const urlBarX = (width - urlBarWidth) / 2;
  const urlBarY = (height - urlBarHeight) / 2;
  const urlBarRadius = 6;

  const urlBarSvg = url
    ? `<rect x="${urlBarX}" y="${urlBarY}" width="${urlBarWidth}" height="${urlBarHeight}" rx="${urlBarRadius}" ry="${urlBarRadius}" fill="${config.urlBarBg}" />
    <text x="${width / 2}" y="${centerY + 1}" text-anchor="middle" dominant-baseline="middle" font-family="Inter, -apple-system, system-ui, sans-serif" font-size="12" fill="${config.urlTextColor}">${escapeXml(url)}</text>`
    : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${config.bg}" />
  <line x1="0" y1="${height}" x2="${width}" y2="${height}" stroke="${config.borderBottom}" stroke-width="1" />
  <g>
    ${trafficLightsSvg}
  </g>
  ${urlBarSvg}
</svg>`;

  return Buffer.from(svg);
}

/** Escape special XML characters in text content. */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
