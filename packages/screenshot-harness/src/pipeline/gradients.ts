/**
 * SVG gradient background generator.
 *
 * Produces an SVG buffer containing a linear gradient that can be
 * rendered to PNG by Sharp.
 */

export interface GradientOptions {
  width: number;
  height: number;
  colors: [string, string];
  /** Gradient angle in degrees (default: 135, top-left to bottom-right). */
  angle?: number;
}

/**
 * Convert a CSS-style angle (0 = bottom-to-top, 90 = left-to-right)
 * to SVG linearGradient x1/y1/x2/y2 percentages.
 */
function angleToCoords(angleDeg: number): {
  x1: string;
  y1: string;
  x2: string;
  y2: string;
} {
  // CSS gradient angles: 0deg = bottom-to-top, 90deg = left-to-right
  // Convert to radians (CSS convention: clockwise from top)
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  const x1 = Math.round(50 - Math.cos(rad) * 50);
  const y1 = Math.round(50 - Math.sin(rad) * 50);
  const x2 = Math.round(50 + Math.cos(rad) * 50);
  const y2 = Math.round(50 + Math.sin(rad) * 50);

  return {
    x1: `${x1}%`,
    y1: `${y1}%`,
    x2: `${x2}%`,
    y2: `${y2}%`,
  };
}

/**
 * Generate an SVG buffer with a linear gradient background.
 */
export function generateGradient(options: GradientOptions): Buffer {
  const { width, height, colors, angle = 135 } = options;
  const coords = angleToCoords(angle);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="${coords.x1}" y1="${coords.y1}" x2="${coords.x2}" y2="${coords.y2}">
      <stop offset="0%" stop-color="${colors[0]}" />
      <stop offset="100%" stop-color="${colors[1]}" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)" />
</svg>`;

  return Buffer.from(svg);
}
