/**
 * SVG text overlay generator.
 *
 * Produces title and subtitle text as an SVG buffer for compositing
 * onto the final screenshot image.
 */

export interface TextOverlayOptions {
  /** Total canvas width. */
  width: number;
  /** Total canvas height. */
  height: number;
  /** Main title text. */
  title: string;
  /** Optional subtitle text. */
  subtitle?: string;
  /** Position of the text relative to the screenshot. */
  position: 'top' | 'bottom';
  /** Text color (default: #ffffff). */
  color?: string;
  /** Title font size in px (default: 28). */
  titleSize?: number;
  /** Subtitle font size in px (default: 18). */
  subtitleSize?: number;
  /** Font family (default: Inter, system-ui, sans-serif). */
  fontFamily?: string;
  /** Y offset for the text block center (used for positioning). */
  yCenter?: number;
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

/**
 * Generate an SVG buffer with title and subtitle text.
 *
 * The returned SVG spans the full canvas so it can be composited
 * at (0, 0) with the gradient background. Text is positioned
 * according to the `position` and `yCenter` options.
 */
export function generateTextOverlay(options: TextOverlayOptions): Buffer {
  const {
    width,
    height,
    title,
    subtitle,
    position,
    color = '#ffffff',
    titleSize = 28,
    subtitleSize = 18,
    fontFamily = 'Inter, -apple-system, system-ui, sans-serif',
    yCenter,
  } = options;

  // Compute vertical center of the text block
  const textBlockHeight = subtitle ? titleSize + subtitleSize + 8 : titleSize;
  let centerY: number;

  if (yCenter !== undefined) {
    centerY = yCenter;
  } else if (position === 'top') {
    // Center text in the top padding area (roughly top 80px)
    centerY = 20 + textBlockHeight / 2;
  } else {
    // Center text in the bottom padding area
    centerY = height - 20 - textBlockHeight / 2;
  }

  const titleY = subtitle ? centerY - (subtitleSize + 8) / 2 : centerY;
  const subtitleY = titleY + titleSize / 2 + 8 + subtitleSize / 2;

  // Subtle opacity for the subtitle
  const subtitleOpacity = 0.75;

  const subtitleSvg = subtitle
    ? `<text x="${width / 2}" y="${subtitleY}" text-anchor="middle" dominant-baseline="middle" font-family="${fontFamily}" font-size="${subtitleSize}" font-weight="400" fill="${color}" opacity="${subtitleOpacity}">${escapeXml(subtitle)}</text>`
    : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <text x="${width / 2}" y="${titleY}" text-anchor="middle" dominant-baseline="middle" font-family="${fontFamily}" font-size="${titleSize}" font-weight="600" fill="${color}">${escapeXml(title)}</text>
  ${subtitleSvg}
</svg>`;

  return Buffer.from(svg);
}
