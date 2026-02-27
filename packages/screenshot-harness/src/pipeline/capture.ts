/**
 * Playwright screenshot capture module.
 *
 * Launches a headless Chromium instance, loads an HTML page (local file
 * or URL), optionally injects CSS and sets HTML attributes, waits for
 * fonts, and captures a high-DPI screenshot.
 */

import path from 'node:path';
import { chromium } from 'playwright';
import type { CaptureOptions } from '../types.js';

const DEFAULT_VIEWPORT = { width: 1280, height: 800 };
const DEFAULT_SCALE_FACTOR = 2;
const MAX_RETRIES = 2;

/**
 * Resolve a source path to a URL suitable for Playwright navigation.
 *
 * - Absolute or relative file paths become `file://` URLs.
 * - URLs starting with `http://` or `https://` are returned as-is.
 * - Relative paths are resolved against `cwd`.
 */
function resolveSource(source: string, cwd?: string): string {
  if (source.startsWith('http://') || source.startsWith('https://')) {
    return source;
  }

  if (source.startsWith('file://')) {
    return source;
  }

  const absolute = path.isAbsolute(source)
    ? source
    : path.resolve(cwd ?? process.cwd(), source);

  return `file://${absolute}`;
}

/**
 * Capture a screenshot of an HTML page using Playwright.
 *
 * Returns a PNG buffer at the specified viewport dimensions and DPI scale.
 */
export async function captureScreenshot(
  options: CaptureOptions
): Promise<Buffer> {
  const {
    source,
    viewport = DEFAULT_VIEWPORT,
    deviceScaleFactor = DEFAULT_SCALE_FACTOR,
    injectCss,
    htmlAttributes,
    waitForFonts = true,
    waitAfterLoad,
  } = options;

  const url = resolveSource(source);

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const browser = await chromium.launch({ headless: true });

    try {
      const context = await browser.newContext({
        viewport,
        deviceScaleFactor,
      });

      const page = await context.newPage();

      // Navigate to the page and wait for the network to settle
      await page.goto(url, { waitUntil: 'networkidle' });

      // Set HTML data attributes if provided
      if (htmlAttributes && Object.keys(htmlAttributes).length > 0) {
        await page.evaluate((attrs) => {
          const html = document.documentElement;
          for (const [key, value] of Object.entries(attrs)) {
            html.setAttribute(key, value);
          }
        }, htmlAttributes);
      }

      // Inject CSS files if provided
      if (injectCss && injectCss.length > 0) {
        for (const cssPath of injectCss) {
          const absoluteCssPath = path.isAbsolute(cssPath)
            ? cssPath
            : path.resolve(process.cwd(), cssPath);
          await page.addStyleTag({ path: absoluteCssPath });
        }
      }

      // Wait for all fonts to be loaded
      if (waitForFonts) {
        await page.evaluate(() => document.fonts.ready);
      }

      // Additional wait time for animations or rendering to settle
      if (waitAfterLoad && waitAfterLoad > 0) {
        await page.waitForTimeout(waitAfterLoad);
      }

      // Capture screenshot (viewport only, not full page)
      const buffer = await page.screenshot({
        fullPage: false,
        type: 'png',
      });

      await browser.close();
      return Buffer.from(buffer);
    } catch (error) {
      await browser.close();
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < MAX_RETRIES) {
        const delay = (attempt + 1) * 500;
        console.warn(
          `Capture attempt ${attempt + 1} failed, retrying in ${delay}ms...`,
          lastError.message
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Screenshot capture failed after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`
  );
}
