/**
 * Screenshot generation orchestrator.
 *
 * Reads a YAML config file, processes each screenshot definition through
 * the capture and composite pipeline, and writes the final PNGs to the
 * output directory.
 *
 * Usage:
 *   tsx src/pipeline/generate.ts config/example.yaml
 *   tsx src/pipeline/generate.ts config/example.yaml --parallel
 */

import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { ScreenshotConfig, ScreenshotDefinition } from '../types.js';
import { captureScreenshot } from './capture.js';
import { compositeScreenshot } from './composite.js';

const DEFAULT_OUTPUT_DIR = 'output';
const DEFAULT_VIEWPORT = { width: 1280, height: 800 };

// CWS standard image dimensions
const OUTPUT_SIZE = { width: 1280, height: 800 };

/**
 * Read and parse a YAML config file.
 */
function loadConfig(configPath: string): ScreenshotConfig {
  const absolutePath = path.isAbsolute(configPath)
    ? configPath
    : path.resolve(process.cwd(), configPath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Config file not found: ${absolutePath}`);
  }

  const raw = fs.readFileSync(absolutePath, 'utf-8');
  const parsed = parseYaml(raw) as ScreenshotConfig;

  // Basic validation
  if (!parsed.extension) {
    throw new Error('Config must specify an "extension" field');
  }

  if (!parsed.screenshots || !Array.isArray(parsed.screenshots)) {
    throw new Error('Config must specify a "screenshots" array');
  }

  if (parsed.screenshots.length === 0) {
    throw new Error('Config "screenshots" array must not be empty');
  }

  for (const shot of parsed.screenshots) {
    if (!shot.id) throw new Error('Each screenshot must have an "id"');
    if (!shot.page) throw new Error(`Screenshot "${shot.id}" must have a "page"`);
    if (!shot.title) throw new Error(`Screenshot "${shot.id}" must have a "title"`);
    if (!shot.gradient || shot.gradient.length !== 2) {
      throw new Error(
        `Screenshot "${shot.id}" must have a "gradient" with exactly 2 colors`
      );
    }
  }

  return parsed;
}

/**
 * Resolve the path to an HTML page file.
 *
 * Pages are resolved relative to the config file's directory, looking
 * first for the path as-is, then under a `pages/` subdirectory relative
 * to the package root.
 */
function resolvePagePath(page: string, configDir: string): string {
  // Try relative to config file directory
  const relToConfig = path.resolve(configDir, page);
  if (fs.existsSync(relToConfig)) {
    return relToConfig;
  }

  // Try relative to package root (two levels up from config/)
  const packageRoot = path.resolve(configDir, '..');
  const relToRoot = path.resolve(packageRoot, page);
  if (fs.existsSync(relToRoot)) {
    return relToRoot;
  }

  // Try under pages/ directory
  const underPages = path.resolve(packageRoot, 'pages', page);
  if (fs.existsSync(underPages)) {
    return underPages;
  }

  throw new Error(
    `Page file not found: "${page}". Searched:\n` +
      `  - ${relToConfig}\n` +
      `  - ${relToRoot}\n` +
      `  - ${underPages}`
  );
}

/**
 * Process a single screenshot definition through the pipeline.
 */
async function processScreenshot(
  shot: ScreenshotDefinition,
  config: ScreenshotConfig,
  configDir: string,
  outputDir: string,
  index: number,
  total: number
): Promise<void> {
  const label = `${config.extension}/${shot.id}.png`;
  console.log(`Generating ${index + 1}/${total}: ${label}`);

  const defaults = config.defaults ?? {};

  // Resolve page path
  const pagePath = resolvePagePath(shot.page, configDir);

  // Build HTML attributes
  const htmlAttributes: Record<string, string> = {
    ...(shot.htmlAttributes ?? {}),
  };

  if (shot.theme) {
    htmlAttributes['data-darkly-theme'] = shot.theme;
  }

  if (shot.preset) {
    htmlAttributes['data-darkly-preset'] = shot.preset;
  }

  // Resolve CSS paths relative to config directory
  const injectCss = shot.injectCss?.map((cssPath) =>
    path.isAbsolute(cssPath)
      ? cssPath
      : path.resolve(configDir, cssPath)
  );

  // Determine viewport
  const viewport = shot.viewport ?? defaults.viewport ?? DEFAULT_VIEWPORT;

  // Step 1: Capture screenshot with Playwright
  const screenshotBuf = await captureScreenshot({
    source: pagePath,
    viewport,
    deviceScaleFactor: 2,
    injectCss,
    htmlAttributes:
      Object.keys(htmlAttributes).length > 0 ? htmlAttributes : undefined,
    waitForFonts: true,
    waitAfterLoad: 200, // Brief pause for rendering to settle
  });

  // Step 2: Composite into marketing image
  const composited = await compositeScreenshot({
    screenshot: screenshotBuf,
    outputSize: OUTPUT_SIZE,
    gradient: shot.gradient,
    gradientAngle: shot.gradientAngle ?? defaults.gradientAngle ?? 135,
    frame: {
      enabled: true,
      url: shot.browserUrl,
      style: shot.frameStyle ?? defaults.frameStyle ?? 'macos-dark',
    },
    text: {
      title: shot.title,
      subtitle: shot.subtitle,
      position: shot.textPosition ?? defaults.textPosition ?? 'top',
      color: shot.textColor ?? defaults.textColor ?? '#ffffff',
    },
    screenshotOptions: {
      borderRadius: 12,
      shadow: true,
      padding: 60,
    },
  });

  // Step 3: Write output file
  const outputPath = path.resolve(outputDir, config.extension, `${shot.id}.png`);
  const outputSubDir = path.dirname(outputPath);

  if (!fs.existsSync(outputSubDir)) {
    fs.mkdirSync(outputSubDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, composited);
  console.log(`  -> ${outputPath}`);
}

/**
 * Main entry point: parse CLI args, load config, run pipeline.
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: tsx src/pipeline/generate.ts <config.yaml> [--parallel]');
    process.exit(1);
  }

  const configPath = args[0];
  const parallel = args.includes('--parallel');

  console.log(`Loading config: ${configPath}`);
  const config = loadConfig(configPath);
  const configDir = path.dirname(path.resolve(configPath));

  // Determine output directory (relative to package root)
  const packageRoot = path.resolve(configDir, '..');
  const outputDir = path.resolve(packageRoot, DEFAULT_OUTPUT_DIR);

  console.log(`Extension: ${config.extension}`);
  console.log(`Screenshots: ${config.screenshots.length}`);
  console.log(`Output: ${outputDir}/${config.extension}/`);
  console.log(`Mode: ${parallel ? 'parallel' : 'sequential'}`);
  console.log('---');

  const total = config.screenshots.length;

  if (parallel) {
    // Run all screenshots concurrently
    await Promise.all(
      config.screenshots.map((shot, i) =>
        processScreenshot(shot, config, configDir, outputDir, i, total)
      )
    );
  } else {
    // Run screenshots sequentially (default, easier to debug)
    for (let i = 0; i < config.screenshots.length; i++) {
      await processScreenshot(
        config.screenshots[i],
        config,
        configDir,
        outputDir,
        i,
        total
      );
    }
  }

  console.log('---');
  console.log(`Done! Generated ${total} screenshot(s) in ${outputDir}/${config.extension}/`);
}

main().catch((error) => {
  console.error('Screenshot generation failed:', error);
  process.exit(1);
});
