/**
 * Sharp image compositing module.
 *
 * Takes a raw Playwright screenshot and composites it into a
 * marketing-ready CWS image with gradient background, browser chrome
 * frame, drop shadow, rounded corners, and text overlay.
 */

import sharp from 'sharp';
import type { CompositeOptions } from '../types.js';
import { generateGradient } from './gradients.js';
import { generateBrowserChrome } from './frames.js';
import { generateTextOverlay } from './text-overlay.js';

/**
 * Default layout constants.
 *
 * For a 1280x800 output with text at top:
 *   Top padding:      20px
 *   Text area:       ~60px (title 28px + subtitle 18px + spacing)
 *   Gap:              15px
 *   Browser chrome:   40px
 *   Screenshot:      ~620px (fills remaining)
 *   Bottom padding:   45px
 *   Side padding:     60px each side -> content width: 1160px
 */
const LAYOUT = {
  topPadding: 20,
  textAreaHeight: 60,
  gapAfterText: 15,
  frameHeight: 40,
  bottomPadding: 45,
  sidePadding: 60,
  defaultBorderRadius: 12,
  shadowBlur: 15,
  shadowOffsetY: 4,
  shadowOpacity: 0.4,
} as const;

/**
 * Create a rounded rectangle SVG mask for clipping.
 */
function createRoundedRectMask(
  width: number,
  height: number,
  radius: number
): Buffer {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="white" />
</svg>`;
  return Buffer.from(svg);
}

/**
 * Create a rounded rectangle mask for the bottom corners only.
 * The top edge is straight (connects flush to browser chrome).
 */
function createBottomRoundedMask(
  width: number,
  height: number,
  radius: number
): Buffer {
  // Use a path: straight top edge, rounded bottom corners
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <path d="M 0 0 L ${width} 0 L ${width} ${height - radius} Q ${width} ${height} ${width - radius} ${height} L ${radius} ${height} Q 0 ${height} 0 ${height - radius} Z" fill="white" />
</svg>`;
  return Buffer.from(svg);
}

/**
 * Round only the top-left and top-right corners of the browser chrome frame.
 */
function createTopRoundedMask(
  width: number,
  height: number,
  radius: number
): Buffer {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <path d="M ${radius} 0 L ${width - radius} 0 Q ${width} 0 ${width} ${radius} L ${width} ${height} L 0 ${height} L 0 ${radius} Q 0 0 ${radius} 0 Z" fill="white" />
</svg>`;
  return Buffer.from(svg);
}

/**
 * Composite a screenshot into a marketing-ready CWS image.
 *
 * Layer order (bottom to top):
 * 1. Gradient background
 * 2. Drop shadow
 * 3. Browser chrome frame (with rounded top corners)
 * 4. Screenshot content (with rounded bottom corners)
 * 5. Text overlay
 */
export async function compositeScreenshot(
  options: CompositeOptions
): Promise<Buffer> {
  const {
    screenshot,
    outputSize,
    gradient,
    gradientAngle = 135,
    frame,
    text,
    screenshotOptions,
  } = options;

  const borderRadius =
    screenshotOptions?.borderRadius ?? LAYOUT.defaultBorderRadius;
  const shadow = screenshotOptions?.shadow ?? true;
  const padding = screenshotOptions?.padding ?? LAYOUT.sidePadding;

  const { width: outW, height: outH } = outputSize;

  // --- Compute layout positions ---

  const contentWidth = outW - padding * 2;
  const textPosition = text?.position ?? 'top';
  const hasText = !!text;

  // Calculate vertical space
  const textAreaH = hasText ? LAYOUT.textAreaHeight : 0;
  const gapH = hasText ? LAYOUT.gapAfterText : 0;
  const frameH = frame.enabled ? LAYOUT.frameHeight : 0;

  let frameY: number;
  let contentY: number;
  let contentHeight: number;

  if (textPosition === 'top') {
    frameY = LAYOUT.topPadding + textAreaH + gapH;
    contentY = frameY + frameH;
    contentHeight = outH - contentY - LAYOUT.bottomPadding;
  } else {
    frameY = LAYOUT.topPadding;
    contentY = frameY + frameH;
    const textBottom = hasText ? LAYOUT.textAreaHeight + gapH : 0;
    contentHeight = outH - contentY - LAYOUT.bottomPadding - textBottom;
  }

  const contentX = padding;

  // --- 1. Gradient background ---

  const gradientBuf = generateGradient({
    width: outW,
    height: outH,
    colors: gradient,
    angle: gradientAngle,
  });

  // Convert the gradient SVG to a PNG base layer
  const basePng = await sharp(gradientBuf)
    .resize(outW, outH)
    .png()
    .toBuffer();

  // --- 2. Resize screenshot to content area ---

  // The screenshot was captured at 2x, so we resize to the content area
  const resizedScreenshot = await sharp(screenshot)
    .resize(contentWidth, contentHeight, { fit: 'cover', position: 'top' })
    .png()
    .toBuffer();

  // --- 3. Apply rounded bottom corners to the screenshot ---

  const cornerMask = frame.enabled
    ? createBottomRoundedMask(contentWidth, contentHeight, borderRadius)
    : createRoundedRectMask(contentWidth, contentHeight, borderRadius);

  const roundedScreenshot = await sharp(resizedScreenshot)
    .composite([
      {
        input: await sharp(cornerMask)
          .resize(contentWidth, contentHeight)
          .png()
          .toBuffer(),
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer();

  // --- 4. Browser chrome frame ---

  let chromeFramePng: Buffer | null = null;

  if (frame.enabled) {
    const chromeSvg = generateBrowserChrome({
      width: contentWidth,
      height: frameH,
      url: frame.url,
      style: frame.style ?? 'macos-dark',
    });

    // Apply rounded top corners to the frame
    const topMask = createTopRoundedMask(contentWidth, frameH, borderRadius);

    chromeFramePng = await sharp(chromeSvg)
      .resize(contentWidth, frameH)
      .composite([
        {
          input: await sharp(topMask)
            .resize(contentWidth, frameH)
            .png()
            .toBuffer(),
          blend: 'dest-in',
        },
      ])
      .png()
      .toBuffer();
  }

  // --- 5. Drop shadow ---

  let shadowPng: Buffer | null = null;

  if (shadow) {
    const shadowPadding = LAYOUT.shadowBlur * 2;
    const combinedHeight = frameH + contentHeight;
    const shadowW = contentWidth + shadowPadding * 2;
    const shadowH = combinedHeight + shadowPadding * 2;

    // Create the combined shape mask for the shadow (frame + content)
    const shadowShapeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${contentWidth}" height="${combinedHeight}">
  <rect x="0" y="0" width="${contentWidth}" height="${combinedHeight}" rx="${borderRadius}" ry="${borderRadius}" fill="black" opacity="${LAYOUT.shadowOpacity}" />
</svg>`;

    shadowPng = await sharp({
      create: {
        width: shadowW,
        height: shadowH,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        {
          input: await sharp(Buffer.from(shadowShapeSvg))
            .resize(contentWidth, combinedHeight)
            .png()
            .toBuffer(),
          top: shadowPadding,
          left: shadowPadding,
        },
      ])
      .blur(LAYOUT.shadowBlur)
      .png()
      .toBuffer();
  }

  // --- 6. Text overlay ---

  let textPng: Buffer | null = null;

  if (hasText && text) {
    // Calculate text center Y based on position
    let textCenterY: number;
    if (textPosition === 'top') {
      textCenterY =
        LAYOUT.topPadding + textAreaH / 2;
    } else {
      textCenterY = outH - LAYOUT.bottomPadding - textAreaH / 2;
    }

    const textSvg = generateTextOverlay({
      width: outW,
      height: outH,
      title: text.title,
      subtitle: text.subtitle,
      position: textPosition,
      color: text.color ?? '#ffffff',
      fontFamily: text.font,
      yCenter: textCenterY,
    });

    textPng = await sharp(textSvg).resize(outW, outH).png().toBuffer();
  }

  // --- 7. Final composite ---

  const layers: sharp.OverlayOptions[] = [];

  // Shadow layer (positioned behind the frame + screenshot)
  if (shadowPng) {
    const shadowX = contentX - LAYOUT.shadowBlur * 2;
    const shadowY = frameY - LAYOUT.shadowBlur * 2 + LAYOUT.shadowOffsetY;
    layers.push({
      input: shadowPng,
      top: Math.max(0, shadowY),
      left: Math.max(0, shadowX),
    });
  }

  // Browser chrome frame
  if (chromeFramePng) {
    layers.push({
      input: chromeFramePng,
      top: frameY,
      left: contentX,
    });
  }

  // Screenshot content
  layers.push({
    input: roundedScreenshot,
    top: contentY,
    left: contentX,
  });

  // Text overlay
  if (textPng) {
    layers.push({
      input: textPng,
      top: 0,
      left: 0,
    });
  }

  // Composite all layers onto the gradient background
  const result = await sharp(basePng).composite(layers).png().toBuffer();

  return result;
}
