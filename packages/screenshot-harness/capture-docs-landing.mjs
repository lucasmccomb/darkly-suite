/**
 * Capture Docs Darkly landing page screenshots using Playwright + real Google Docs.
 * Loads the Docs Darkly extension in dev mode.
 *
 * Key insight: The extension defaults to "system" mode and uses a SystemThemeDetector
 * that reads prefers-color-scheme. We use page.emulateMedia({ colorScheme }) to
 * control light/dark mode instead of trying to click the toggle.
 *
 * DOM structure (dd prefix for Docs Darkly):
 * - Toolbar button: #dd-toolbar-button (opens mini dropdown for paid users)
 * - Sidebar icon: #dd-sidebar-icon (opens full settings modal)
 * - Mini panel: .dd-mini-panel
 * - Full modal: .dd-modal-backdrop > .dd-modal-container.dd-settings-container
 * - Toggle: button.dd-settings-toggle-switch (role=switch)
 * - Mode radios: .dd-settings-mode-option with .dd-settings-mode-label text
 * - Close button: .dd-settings-close-btn
 *
 * Target images (matching existing placeholder dimensions):
 * 1. screenshots/split-view.jpg (1809x1135) - left light, right dark
 * 2. screenshots/panel-open-dark.jpg (1809x1137) - dark mode + settings panel
 * 3. screenshots/panel-views.jpg (1809x1137) - 4 panels showing modes
 * 4. setup/gear-icon-guide.png (539x284) - toolbar button area
 * 5. setup/quick-settings-guide.jpg (397x809) - settings panel overview
 */

import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXTENSION_PATH = path.resolve(__dirname, '../docs-darkly/dist');
const OUTPUT_DIR = path.resolve(__dirname, 'output/docs-landing');
const FINAL_DIR_SCREENSHOTS = path.resolve(__dirname, '../landing-docs/public/images/screenshots');
const FINAL_DIR_SETUP = path.resolve(__dirname, '../landing-docs/public/images/setup');

const GOOGLE_EMAIL = process.env.DARKLY_CAPTURE_GOOGLE_EMAIL;
const GOOGLE_PASSWORD = process.env.DARKLY_CAPTURE_GOOGLE_PASSWORD;
if (!GOOGLE_EMAIL || !GOOGLE_PASSWORD) {
  console.error('Missing DARKLY_CAPTURE_GOOGLE_EMAIL / DARKLY_CAPTURE_GOOGLE_PASSWORD env vars.');
  console.error('Use a dedicated throwaway Google account for screenshot capture, never a personal one.');
  process.exit(1);
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function closeGoogleSidebars(page) {
  const closeBtns = page.locator('div[aria-label="Close side panel"], div[aria-label="Close"], [aria-label="Close side panel"] button');
  const closeCount = await closeBtns.count();
  for (let i = 0; i < closeCount; i++) {
    const btn = closeBtns.nth(i);
    if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await btn.click();
      await sleep(500);
      console.log('  Closed a Google sidebar.');
    }
  }
  await sleep(500);
}

async function closeDarklyPanels(page) {
  // Close mini panel
  const miniPanel = page.locator('.dd-mini-panel');
  if (await miniPanel.isVisible({ timeout: 500 }).catch(() => false)) {
    await page.keyboard.press('Escape');
    await sleep(300);
  }
  // Close modal backdrop
  const modal = page.locator('.dd-modal-backdrop');
  if (await modal.isVisible({ timeout: 500 }).catch(() => false)) {
    const closeBtn = page.locator('.dd-settings-close-btn').first();
    if (await closeBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await sleep(300);
  }
}

async function waitForExtension(page) {
  for (let i = 0; i < 20; i++) {
    const active = await page.evaluate(() =>
      document.documentElement.getAttribute('data-darkly-active')
    );
    if (active) {
      console.log(`Extension active: data-darkly-active="${active}"`);
      return true;
    }
    await sleep(500);
  }
  console.log('WARNING: Extension did not inject data-darkly-active after 10s');
  return false;
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('Launching Chrome with Docs Darkly extension...');
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--window-size=1440,900',
      '--disable-blink-features=AutomationControlled',
    ],
    viewport: { width: 1440, height: 900 },
    ignoreDefaultArgs: ['--enable-automation'],
    colorScheme: 'light',
  });

  const page = context.pages()[0] || await context.newPage();

  // === LOGIN ===
  console.log('Logging into Google...');
  await page.goto('https://accounts.google.com/signin');
  await sleep(2000);
  await page.fill('input[type="email"]', GOOGLE_EMAIL);
  await page.click('#identifierNext');
  await sleep(3000);
  await page.fill('input[type="password"]', GOOGLE_PASSWORD);
  await page.click('#passwordNext');
  await sleep(5000);
  console.log('Logged in.');

  // === CREATE DOCUMENT ===
  console.log('Creating document...');
  await page.goto('https://docs.google.com/document/create');
  await sleep(8000);

  // Close Google sidebars
  console.log('Closing Google sidebars...');
  await closeGoogleSidebars(page);

  // Set title
  const titleInput = page.locator('input.docs-title-input');
  if (await titleInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await titleInput.click();
    await titleInput.fill('Q3 Marketing Strategy');
    await page.keyboard.press('Enter');
    await sleep(1000);
  }

  // Click into the document body to start typing
  const kixEditor = page.locator('.kix-appview-editor');
  if (await kixEditor.isVisible({ timeout: 5000 }).catch(() => false)) {
    await kixEditor.click();
    await sleep(500);
  }

  // Enter rich document content using keyboard shortcuts
  console.log('Entering document content...');

  // Helper to type with format
  async function typeHeading(text, level) {
    // Use Ctrl+Alt+{level} for headings in Google Docs
    await page.keyboard.down('Control');
    await page.keyboard.down('Alt');
    await page.keyboard.press(`Digit${level}`);
    await page.keyboard.up('Alt');
    await page.keyboard.up('Control');
    await sleep(200);
    await page.keyboard.type(text, { delay: 10 });
    await page.keyboard.press('Enter');
    await sleep(200);
  }

  async function typeNormal(text) {
    // Reset to normal text: Ctrl+Alt+0
    await page.keyboard.down('Control');
    await page.keyboard.down('Alt');
    await page.keyboard.press('Digit0');
    await page.keyboard.up('Alt');
    await page.keyboard.up('Control');
    await sleep(200);
    await page.keyboard.type(text, { delay: 5 });
    await page.keyboard.press('Enter');
    await sleep(100);
  }

  async function typeBold(text) {
    await page.keyboard.down('Control');
    await page.keyboard.press('b');
    await page.keyboard.up('Control');
    await page.keyboard.type(text, { delay: 5 });
    await page.keyboard.down('Control');
    await page.keyboard.press('b');
    await page.keyboard.up('Control');
  }

  // Document content
  await typeHeading('Q3 Marketing Strategy', 1);
  await typeNormal('Prepared by the Growth Team | Last updated March 2026');
  await page.keyboard.press('Enter');

  await typeHeading('Executive Summary', 1);
  await typeNormal('This document outlines our Q3 marketing strategy focused on expanding brand awareness across digital channels and optimizing conversion rates for our enterprise SaaS product line. Our team has identified three key growth areas that will drive measurable improvements in customer acquisition.');
  await page.keyboard.press('Enter');

  await typeHeading('Campaign Channels', 1);

  await typeHeading('Content Marketing', 2);
  // Bullet list
  await typeNormal('Our content strategy targets mid-funnel prospects with educational resources:');

  // Create bullet list items
  const bulletItems = [
    'Weekly blog posts targeting long-tail SEO keywords',
    'Monthly industry reports with original research data',
    'Video tutorials and product walkthroughs',
    'Customer success stories and case studies',
  ];

  for (const item of bulletItems) {
    // Use Ctrl+Shift+8 for bullet list in Google Docs
    await page.keyboard.down('Control');
    await page.keyboard.down('Shift');
    await page.keyboard.press('Digit8');
    await page.keyboard.up('Shift');
    await page.keyboard.up('Control');
    await sleep(100);
    await page.keyboard.type(item, { delay: 5 });
    await page.keyboard.press('Enter');
    await sleep(50);
  }

  // Exit list mode
  await page.keyboard.press('Enter');
  await sleep(200);

  await typeHeading('Paid Acquisition', 2);
  const paidItems = [
    'LinkedIn sponsored content targeting decision-makers',
    'Google Ads search campaigns for high-intent keywords',
    'Retargeting campaigns across display network',
    'Strategic sponsorships at industry conferences',
  ];

  for (const item of paidItems) {
    await page.keyboard.down('Control');
    await page.keyboard.down('Shift');
    await page.keyboard.press('Digit8');
    await page.keyboard.up('Shift');
    await page.keyboard.up('Control');
    await sleep(100);
    await page.keyboard.type(item, { delay: 5 });
    await page.keyboard.press('Enter');
    await sleep(50);
  }

  await page.keyboard.press('Enter');
  await sleep(200);

  await typeHeading('Budget Allocation', 1);
  await typeNormal('Total Q3 marketing budget: $425,000. The allocation below reflects our data-driven approach, emphasizing channels with the highest historical ROI while maintaining investment in emerging platforms.');
  await page.keyboard.press('Enter');

  // Insert a table via menu (Insert > Table > 4x5)
  console.log('Inserting table...');
  // Use menu: Insert > Table
  await page.click('div#docs-insert-menu', { timeout: 3000 }).catch(async () => {
    // Try menu bar approach
    const insertMenu = page.locator('#docs-insert-menu');
    if (await insertMenu.isVisible().catch(() => false)) {
      await insertMenu.click();
    }
  });
  await sleep(1000);

  // Look for "Table" option in the Insert menu
  const tableOption = page.locator('span:has-text("Table")').first();
  if (await tableOption.isVisible({ timeout: 2000 }).catch(() => false)) {
    await tableOption.hover();
    await sleep(500);

    // Click on a cell in the table size grid (4 columns x 5 rows)
    // The grid is typically .goog-dimension-picker
    const picker = page.locator('.goog-dimension-picker');
    if (await picker.isVisible({ timeout: 2000 }).catch(() => false)) {
      const pickerBox = await picker.boundingBox();
      if (pickerBox) {
        // Click at position for 4x5 (each cell is about 18px)
        const cellSize = 18;
        await page.mouse.click(
          pickerBox.x + cellSize * 3.5,
          pickerBox.y + cellSize * 4.5
        );
        await sleep(1000);
      }
    }
  } else {
    // Fallback: just press Escape and skip table
    await page.keyboard.press('Escape');
    await sleep(300);
    console.log('  Could not find table menu option, skipping table.');
  }

  // Enter table data
  const tableData = [
    ['Channel', 'Budget', 'Expected ROI', 'Timeline'],
    ['Content Marketing', '$95,000', '3.2x', 'Jul-Sep'],
    ['Paid Search', '$145,000', '4.1x', 'Jul-Sep'],
    ['Social Media', '$85,000', '2.8x', 'Jul-Aug'],
    ['Events', '$100,000', '2.5x', 'Aug-Sep'],
  ];

  // Type data into table cells (Tab moves between cells)
  for (let row = 0; row < tableData.length; row++) {
    for (let col = 0; col < tableData[row].length; col++) {
      if (row === 0) {
        // Bold headers
        await typeBold(tableData[row][col]);
      } else {
        await page.keyboard.type(tableData[row][col], { delay: 5 });
      }
      // Tab to next cell (except last cell of last row)
      if (!(row === tableData.length - 1 && col === tableData[row].length - 1)) {
        await page.keyboard.press('Tab');
        await sleep(50);
      }
    }
  }

  await sleep(2000);

  // Click outside table to deselect
  await page.keyboard.press('Escape');
  await sleep(500);

  // Scroll to top of document
  await page.keyboard.down('Control');
  await page.keyboard.press('Home');
  await page.keyboard.up('Control');
  await sleep(1000);

  // Click somewhere neutral to deselect cursor
  await page.mouse.click(400, 300);
  await sleep(300);

  console.log('Document content entered.');

  // Wait for extension
  await waitForExtension(page);
  await sleep(2000);

  // Verify current theme
  const initTheme = await page.evaluate(() =>
    document.documentElement.getAttribute('data-dd-theme')
  );
  console.log('Initial theme:', initTheme);

  // ═══════════════════════════════════════════════════════════════════
  // SCREENSHOT 1: LIGHT MODE (clean, no panels)
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n=== Screenshot 1: Light mode (for split-view left half) ===');
  await closeDarklyPanels(page);
  await sleep(300);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'light-full.png') });
  console.log('Done.');

  // ═══════════════════════════════════════════════════════════════════
  // SWITCH TO DARK MODE via prefers-color-scheme emulation
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n=== Switching to dark mode via colorScheme emulation ===');
  await page.emulateMedia({ colorScheme: 'dark' });
  await sleep(3000);

  const darkTheme = await page.evaluate(() =>
    document.documentElement.getAttribute('data-dd-theme')
  );
  console.log('Theme after dark emulation:', darkTheme);

  if (darkTheme !== 'dark') {
    console.log('Theme not dark yet. Forcing via DOM attribute...');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-dd-theme', 'dark');
      document.documentElement.style.colorScheme = 'dark';
    });
    await sleep(1000);
    const forced = await page.evaluate(() =>
      document.documentElement.getAttribute('data-dd-theme')
    );
    console.log('Theme after force:', forced);
  }

  // ═══════════════════════════════════════════════════════════════════
  // SCREENSHOT 3: DARK MODE CLEAN (for split-view right half)
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n=== Screenshot 3: Dark mode clean (for split-view right half) ===');
  await closeDarklyPanels(page);
  await sleep(300);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'dark-full.png') });
  console.log('Done.');

  // ═══════════════════════════════════════════════════════════════════
  // SCREENSHOT 2: DARK MODE WITH SETTINGS PANEL
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n=== Screenshot 2: Panel open dark ===');

  let panelOpened = false;
  const sidebarIcon = page.locator('#dd-sidebar-icon');
  if (await sidebarIcon.isVisible({ timeout: 3000 }).catch(() => false)) {
    await sidebarIcon.click();
    await sleep(1500);
    const modalVisible = await page.locator('.dd-modal-backdrop').isVisible({ timeout: 2000 }).catch(() => false);
    if (modalVisible) {
      panelOpened = true;
      console.log('Full settings modal opened via sidebar icon.');
    }
  }

  // Fallback: toolbar button -> mini panel -> "All Settings"
  if (!panelOpened) {
    const toolbarBtn = page.locator('#dd-toolbar-button');
    if (await toolbarBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await toolbarBtn.click();
      await sleep(1500);

      const miniVisible = await page.locator('.dd-mini-panel').isVisible({ timeout: 2000 }).catch(() => false);
      if (miniVisible) {
        console.log('Mini panel opened via toolbar button.');

        const allSettingsBtn = page.locator('.dd-dropdown-all-settings-btn, button:has-text("All Settings")').first();
        if (await allSettingsBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await allSettingsBtn.click();
          await sleep(1500);
          const modalVisible = await page.locator('.dd-modal-backdrop').isVisible({ timeout: 2000 }).catch(() => false);
          if (modalVisible) {
            panelOpened = true;
            console.log('Full settings modal opened via "All Settings" button.');
          }
        }

        if (!panelOpened) {
          panelOpened = true;
          console.log('Using mini panel for panel screenshot.');
        }
      }
    }
  }

  if (!panelOpened) {
    console.log('WARNING: Could not open any settings panel.');
    const ddEls = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[id*="dd-"], [class*="dd-"]'))
        .map(el => `${el.tagName}#${el.id}.${[...el.classList].join('.')}`);
    });
    console.log('Extension elements:', ddEls);
  }

  await page.screenshot({ path: path.join(OUTPUT_DIR, 'panel-open-dark.png') });
  console.log('Done.');

  // ═══════════════════════════════════════════════════════════════════
  // SCREENSHOT 5: QUICK SETTINGS GUIDE (cropped settings panel)
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n=== Screenshot 5: Quick settings guide ===');
  let settingsVisible = await page.locator('.dd-modal-container').isVisible({ timeout: 1000 }).catch(() => false);
  if (!settingsVisible) {
    console.log('  Modal closed, reopening...');
    if (await sidebarIcon.isVisible({ timeout: 1000 }).catch(() => false)) {
      await sidebarIcon.click();
      await sleep(1500);
    } else {
      const tb = page.locator('#dd-toolbar-button');
      if (await tb.isVisible().catch(() => false)) {
        await tb.click();
        await sleep(1000);
        await page.evaluate(() => {
          const btns = document.querySelectorAll('[class*="dd-"] button');
          for (const b of btns) {
            if (b.textContent?.trim() === 'All Settings') { b.click(); break; }
          }
        });
        await sleep(1500);
      }
    }
    settingsVisible = await page.locator('.dd-modal-container').isVisible({ timeout: 2000 }).catch(() => false);
  }

  if (settingsVisible) {
    const settingsBox = await page.locator('.dd-modal-container').first().boundingBox();
    if (settingsBox) {
      await page.screenshot({
        path: path.join(OUTPUT_DIR, 'quick-settings-guide.png'),
        clip: {
          x: Math.max(0, settingsBox.x - 10),
          y: Math.max(0, settingsBox.y - 10),
          width: settingsBox.width + 20,
          height: settingsBox.height + 20,
        },
      });
      console.log('Done.');
    }
  } else {
    console.log('SKIPPED - could not open settings modal.');
  }

  // ═══════════════════════════════════════════════════════════════════
  // SCREENSHOT 4: GEAR ICON GUIDE (toolbar button area)
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n=== Screenshot 4: Gear icon guide ===');
  await closeDarklyPanels(page);
  await sleep(500);

  const toolbarBtnForGuide = page.locator('#dd-toolbar-button');
  if (await toolbarBtnForGuide.isVisible({ timeout: 3000 }).catch(() => false)) {
    const btnBox = await toolbarBtnForGuide.boundingBox();
    if (btnBox) {
      const clipWidth = 400;
      const clipHeight = 200;
      await page.screenshot({
        path: path.join(OUTPUT_DIR, 'gear-icon-guide.png'),
        clip: {
          x: Math.max(0, btnBox.x + btnBox.width / 2 - clipWidth / 2),
          y: Math.max(0, btnBox.y + btnBox.height / 2 - clipHeight / 2),
          width: clipWidth,
          height: clipHeight,
        },
      });
      console.log('Done.');
    }
  } else {
    if (await sidebarIcon.isVisible({ timeout: 1000 }).catch(() => false)) {
      const iconBox = await sidebarIcon.boundingBox();
      if (iconBox) {
        await page.screenshot({
          path: path.join(OUTPUT_DIR, 'gear-icon-guide.png'),
          clip: {
            x: Math.max(0, iconBox.x - 80),
            y: Math.max(0, iconBox.y - 100),
            width: 200,
            height: 300,
          },
        });
        console.log('Done (sidebar icon).');
      }
    } else {
      console.log('SKIPPED - no button/icon visible.');
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // SCREENSHOT 6: PANEL VIEWS (each mode) - for composite
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n=== Screenshot 6: Panel mode views ===');

  let modalOpened = false;
  if (await sidebarIcon.isVisible({ timeout: 2000 }).catch(() => false)) {
    await sidebarIcon.click();
    await sleep(1500);
    modalOpened = await page.locator('.dd-modal-backdrop').isVisible({ timeout: 2000 }).catch(() => false);
  }

  if (!modalOpened) {
    const tb = page.locator('#dd-toolbar-button');
    if (await tb.isVisible().catch(() => false)) {
      await tb.click();
      await sleep(1000);
      const allBtn = await page.evaluate(() => {
        const btns = document.querySelectorAll('[class*="dd-dropdown"] button, [class*="dd-"] button');
        for (const b of btns) {
          if (b.textContent?.trim() === 'All Settings') {
            (b).click();
            return true;
          }
        }
        return false;
      });
      if (allBtn) {
        await sleep(1500);
        modalOpened = await page.locator('.dd-modal-backdrop').isVisible({ timeout: 2000 }).catch(() => false);
      }
    }
  }

  if (modalOpened) {
    console.log('Full settings modal opened for mode screenshots.');
    const modes = ['Schedule', 'Dark', 'Sunrise/Sunset', 'System'];
    for (const mode of modes) {
      const clicked = await page.evaluate((m) => {
        const labels = document.querySelectorAll('[class*="dd-settings-mode-label"]');
        for (const l of labels) {
          if (l.textContent?.trim() === m) {
            const option = l.closest('[class*="dd-settings-mode-option"]');
            if (option) {
              const radio = option.querySelector('input[type="radio"]');
              if (radio) radio.click();
              else option.click();
              return true;
            }
          }
        }
        return false;
      }, mode);

      if (clicked) {
        await sleep(800);
        const safeName = mode.toLowerCase().replace(/[\/\s]+/g, '-');

        const modalContainer = page.locator('.dd-modal-container').first();
        const modalBox = await modalContainer.boundingBox().catch(() => null);
        if (modalBox) {
          await page.screenshot({
            path: path.join(OUTPUT_DIR, `panel-${safeName}.png`),
            clip: {
              x: Math.max(0, modalBox.x - 5),
              y: Math.max(0, modalBox.y - 5),
              width: modalBox.width + 10,
              height: modalBox.height + 10,
            },
          });
          console.log(`  "${mode}" captured.`);
        }
      } else {
        console.log(`  "${mode}" NOT FOUND in DOM.`);
      }
    }
  } else {
    console.log('SKIPPED - could not open full settings modal.');
  }

  // ═══════════════════════════════════════════════════════════════════
  // COMPOSITING
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n=== Compositing final images ===');

  // 1. Split view: left half light, right half dark
  const lightFull = path.join(OUTPUT_DIR, 'light-full.png');
  const darkFull = path.join(OUTPUT_DIR, 'dark-full.png');
  const splitView = path.join(OUTPUT_DIR, 'split-view.jpg');
  if (fs.existsSync(lightFull) && fs.existsSync(darkFull)) {
    try {
      const dims = execSync(`identify -format "%wx%h" "${lightFull}"`).toString().trim();
      const [w, h] = dims.split('x').map(Number);
      const halfW = Math.floor(w / 2);

      execSync(`convert \\( "${lightFull}" -crop ${halfW}x${h}+0+0 \\) \\( "${darkFull}" -crop ${halfW}x${h}+${halfW}+0 \\) +append -quality 90 "${splitView}"`);
      console.log('  split-view.jpg created.');
    } catch (e) {
      console.log('  split-view compositing failed:', e.message);
    }
  }

  // 2. Panel views: 4 mode panels in a 2x2 grid
  const panelViewsOutput = path.join(OUTPUT_DIR, 'panel-views.jpg');
  const modeFiles = ['panel-schedule.png', 'panel-dark.png', 'panel-sunrise-sunset.png', 'panel-system.png'];
  const existingModes = modeFiles.filter(f => fs.existsSync(path.join(OUTPUT_DIR, f)));
  if (existingModes.length >= 2) {
    try {
      const filePaths = existingModes.map(f => `"${path.join(OUTPUT_DIR, f)}"`).join(' ');
      if (existingModes.length === 4) {
        execSync(`convert \\( ${filePaths.split(' ').slice(0, 2).join(' ')} +append \\) \\( ${filePaths.split(' ').slice(2, 4).join(' ')} +append \\) -append -quality 90 "${panelViewsOutput}"`);
      } else {
        execSync(`convert ${filePaths} +append -quality 90 "${panelViewsOutput}"`);
      }
      console.log('  panel-views.jpg created.');
    } catch (e) {
      console.log('  panel-views compositing failed:', e.message);
    }
  } else {
    console.log('  SKIPPED panel-views - not enough mode screenshots.');
  }

  // ═══════════════════════════════════════════════════════════════════
  // COPY TO LANDING PAGE
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n=== Copying to landing page ===');

  const copies = [
    { src: 'split-view.jpg', dest: path.join(FINAL_DIR_SCREENSHOTS, 'split-view.jpg') },
    { src: 'panel-open-dark.png', dest: path.join(FINAL_DIR_SCREENSHOTS, 'panel-open-dark.jpg'), convert: true },
    { src: 'panel-views.jpg', dest: path.join(FINAL_DIR_SCREENSHOTS, 'panel-views.jpg') },
    { src: 'gear-icon-guide.png', dest: path.join(FINAL_DIR_SETUP, 'gear-icon-guide.png') },
    { src: 'quick-settings-guide.png', dest: path.join(FINAL_DIR_SETUP, 'quick-settings-guide.jpg'), convert: true },
  ];

  for (const { src, dest, convert } of copies) {
    const srcPath = path.join(OUTPUT_DIR, src);
    if (fs.existsSync(srcPath)) {
      if (convert && dest.endsWith('.jpg')) {
        try {
          execSync(`convert "${srcPath}" -quality 90 "${dest}"`);
          console.log(`  ${src} -> ${path.basename(dest)} (converted to JPEG)`);
        } catch {
          fs.copyFileSync(srcPath, dest.replace('.jpg', '.png'));
          console.log(`  ${src} -> ${path.basename(dest).replace('.jpg', '.png')} (copy, conversion failed)`);
        }
      } else {
        fs.copyFileSync(srcPath, dest);
        console.log(`  ${src} -> ${path.basename(dest)}`);
      }
    } else {
      console.log(`  SKIPPED ${src} - file not found.`);
    }
  }

  // Final diagnostic
  const finalTheme = await page.evaluate(() => document.documentElement.getAttribute('data-dd-theme'));
  console.log('\nFinal theme:', finalTheme);

  console.log('\nAll screenshots saved to:', OUTPUT_DIR);
  console.log('Files:', fs.readdirSync(OUTPUT_DIR).sort());

  await context.close();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
