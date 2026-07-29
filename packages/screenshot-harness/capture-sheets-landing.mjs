/**
 * Capture Sheets Darkly landing page screenshots using Playwright + real Google Sheets.
 * Loads the Sheets Darkly extension in dev mode.
 *
 * Key insight: The extension defaults to "system" mode and uses a SystemThemeDetector
 * that reads prefers-color-scheme. We use page.emulateMedia({ colorScheme }) to
 * control light/dark mode instead of trying to click the toggle.
 *
 * DOM structure:
 * - Toolbar button: #sd-toolbar-button (opens mini dropdown for paid users)
 * - Sidebar icon: #sd-sidebar-icon (opens full settings modal)
 * - Mini panel: .sd-mini-panel
 * - Full modal: .sd-modal-backdrop > .sd-modal-container.sd-settings-container
 * - Toggle: button.sd-settings-toggle-switch (role=switch)
 * - Mode radios: .sd-settings-mode-option with .sd-settings-mode-label text
 * - Close button: .sd-settings-close-btn
 *
 * Target images (matching existing Gmail placeholders):
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
const EXTENSION_PATH = path.resolve(__dirname, '../sheets-darkly/dist');
const OUTPUT_DIR = path.resolve(__dirname, 'output/sheets-landing');
const FINAL_DIR_SCREENSHOTS = path.resolve(__dirname, '../landing-sheets/public/images/screenshots');
const FINAL_DIR_SETUP = path.resolve(__dirname, '../landing-sheets/public/images/setup');

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
  const miniPanel = page.locator('.sd-mini-panel');
  if (await miniPanel.isVisible({ timeout: 500 }).catch(() => false)) {
    await page.keyboard.press('Escape');
    await sleep(300);
  }
  // Close modal backdrop
  const modal = page.locator('.sd-modal-backdrop');
  if (await modal.isVisible({ timeout: 500 }).catch(() => false)) {
    const closeBtn = page.locator('.sd-settings-close-btn').first();
    if (await closeBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await sleep(300);
  }
}

async function removeConvertToTablePopup(page) {
  const removed = await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent?.includes('Convert to table')) {
        // Walk up to find the floating popup container
        let el = node.parentElement;
        while (el && el !== document.body) {
          const style = getComputedStyle(el);
          if (style.position === 'absolute' || style.position === 'fixed') {
            el.remove();
            return true;
          }
          el = el.parentElement;
        }
        // If no positioned container found, just hide the closest containing div
        if (node.parentElement) {
          const closest = node.parentElement.closest('div[style*="position"]') || node.parentElement.parentElement?.parentElement;
          if (closest) { closest.style.display = 'none'; return true; }
        }
        break;
      }
    }
    return false;
  });
  if (removed) console.log('  Removed "Convert to table" popup from DOM.');
}

async function waitForExtension(page) {
  // Wait for extension to inject by checking for its attribute
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

  console.log('Launching Chrome with Sheets Darkly extension...');
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
    // Start in light mode (extension defaults to system mode)
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

  // === CREATE SPREADSHEET ===
  console.log('Creating spreadsheet...');
  await page.goto('https://docs.google.com/spreadsheets/create');
  await sleep(8000);

  // Close Google sidebars (Tables, Explore, etc.)
  console.log('Closing Google sidebars...');
  await closeGoogleSidebars(page);

  // Set title
  const titleInput = page.locator('input.docs-title-input');
  if (await titleInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await titleInput.click();
    await titleInput.fill('Q1 Budget Planning');
    await page.keyboard.press('Enter');
    await sleep(1000);
  }

  // Enter sample data
  const sampleData = [
    ['Name', 'Department', 'Role', 'Q1 Target', 'Q1 Actual', 'Variance', 'Status'],
    ['Sarah Chen', 'Engineering', 'Senior Dev', '$45,000', '$42,800', '-$2,200', 'On Track'],
    ['Alex Rivera', 'Design', 'Lead Designer', '$32,000', '$31,500', '-$500', 'On Track'],
    ['Jordan Kim', 'Marketing', 'Content Mgr', '$28,000', '$29,200', '$1,200', 'Over Budget'],
    ['Taylor Brooks', 'Sales', 'Account Exec', '$52,000', '$48,900', '-$3,100', 'On Track'],
    ['Morgan Lee', 'Engineering', 'DevOps', '$38,000', '$37,200', '-$800', 'On Track'],
    ['Casey Williams', 'Product', 'PM', '$35,000', '$36,800', '$1,800', 'Over Budget'],
    ['Jamie Patel', 'Finance', 'Analyst', '$25,000', '$24,100', '-$900', 'On Track'],
    ['Avery Scott', 'Engineering', 'Frontend Dev', '$42,000', '$41,500', '-$500', 'On Track'],
    ['Riley Johnson', 'HR', 'Recruiter', '$22,000', '$21,800', '-$200', 'On Track'],
    ['Quinn Martinez', 'Design', 'UX Research', '$30,000', '$28,400', '-$1,600', 'On Track'],
    ['Dakota Nguyen', 'Engineering', 'Backend Dev', '$44,000', '$43,200', '-$800', 'On Track'],
    ['Skyler Thompson', 'Marketing', 'SEO Specialist', '$26,000', '$27,100', '$1,100', 'Over Budget'],
    ['Reese Campbell', 'Sales', 'Sales Mgr', '$48,000', '$46,500', '-$1,500', 'On Track'],
    ['Emerson Park', 'Product', 'UX Writer', '$24,000', '$23,600', '-$400', 'On Track'],
  ];

  // Go to cell A1
  await page.keyboard.down('Control');
  await page.keyboard.press('Home');
  await page.keyboard.up('Control');
  await sleep(500);

  for (const row of sampleData) {
    for (let i = 0; i < row.length; i++) {
      await page.keyboard.type(row[i], { delay: 5 });
      if (i < row.length - 1) await page.keyboard.press('Tab');
    }
    await page.keyboard.press('Enter');
    await sleep(50);
  }
  await sleep(2000);
  await page.keyboard.press('Escape');
  await sleep(1000);
  console.log('Data entered.');

  // Dismiss "Convert to table" popup if present
  console.log('Dismissing popups...');

  // Method 1: Find the X dismiss icon next to "Convert to table" text
  // The popup has a structure like: [icon] "Convert to table" [dropdown arrow] [X button]
  const dismissClicked = await page.evaluate(() => {
    // Look for any element containing "Convert to table"
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent?.includes('Convert to table')) {
        // Found the text; now find the X/close button nearby
        const container = node.parentElement?.closest('div');
        if (container) {
          // The X is typically the last clickable element in the container
          const parent = container.parentElement;
          if (parent) {
            const allClickable = parent.querySelectorAll('div[role="button"], span[role="button"], button');
            // Click the last one (likely the X dismiss)
            const lastBtn = allClickable[allClickable.length - 1];
            if (lastBtn) {
              lastBtn.click();
              return 'clicked-last';
            }
          }
        }
        break;
      }
    }
    return null;
  });
  if (dismissClicked) {
    console.log(`  Dismissed "Convert to table" popup (${dismissClicked}).`);
    await sleep(500);
  }

  // Method 2: Try Playwright locator for the X icon
  if (!dismissClicked) {
    try {
      const xBtn = page.locator('div:has(> span:text("Convert to table")) div[role="button"]').last();
      if (await xBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await xBtn.click();
        await sleep(500);
        console.log('  Dismissed via Playwright locator.');
      }
    } catch { /* ignore */ }
  }

  // Press Escape multiple times to dismiss any remaining popups
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Escape');
    await sleep(200);
  }

  // Navigate to an empty cell far from data to clear selection
  // Use keyboard shortcut to go to a specific cell
  await page.keyboard.down('Control');
  await page.keyboard.press('Home');
  await page.keyboard.up('Control');
  await sleep(300);
  // Now click on cell A1 to have a clean selection at the top-left
  await page.mouse.click(50, 135);
  await sleep(300);

  // Wait for extension to fully initialize
  await waitForExtension(page);
  await sleep(2000);

  // Verify current theme
  const initTheme = await page.evaluate(() =>
    document.documentElement.getAttribute('data-sd-theme')
  );
  console.log('Initial theme:', initTheme);

  // ═══════════════════════════════════════════════════════════════════
  // SCREENSHOT 1: LIGHT MODE (clean, no panels)
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n=== Screenshot 1: Light mode (for split-view left half) ===');
  await closeDarklyPanels(page);
  // Remove "Convert to table" popup from DOM entirely (only needed for clean screenshots)
  await removeConvertToTablePopup(page);
  await sleep(300);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'light-full.png') });
  console.log('Done.');

  // ═══════════════════════════════════════════════════════════════════
  // SWITCH TO DARK MODE via prefers-color-scheme emulation
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n=== Switching to dark mode via colorScheme emulation ===');
  await page.emulateMedia({ colorScheme: 'dark' });
  await sleep(3000); // Give SystemThemeDetector time to react

  const darkTheme = await page.evaluate(() =>
    document.documentElement.getAttribute('data-sd-theme')
  );
  console.log('Theme after dark emulation:', darkTheme);

  if (darkTheme !== 'dark') {
    console.log('Theme not dark yet. Forcing via DOM attribute...');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-sd-theme', 'dark');
      document.documentElement.style.colorScheme = 'dark';
    });
    await sleep(1000);
    const forced = await page.evaluate(() =>
      document.documentElement.getAttribute('data-sd-theme')
    );
    console.log('Theme after force:', forced);
  }

  // ═══════════════════════════════════════════════════════════════════
  // SCREENSHOT 3: DARK MODE CLEAN (for split-view right half)
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n=== Screenshot 3: Dark mode clean (for split-view right half) ===');
  await closeDarklyPanels(page);
  await removeConvertToTablePopup(page);
  await sleep(300);
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'dark-full.png') });
  console.log('Done.');

  // ═══════════════════════════════════════════════════════════════════
  // SCREENSHOT 2: DARK MODE WITH SETTINGS PANEL
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n=== Screenshot 2: Panel open dark ===');

  // Try opening the full settings modal via sidebar icon first
  let panelOpened = false;
  const sidebarIcon = page.locator('#sd-sidebar-icon');
  if (await sidebarIcon.isVisible({ timeout: 3000 }).catch(() => false)) {
    await sidebarIcon.click();
    await sleep(1500);
    const modalVisible = await page.locator('.sd-modal-backdrop').isVisible({ timeout: 2000 }).catch(() => false);
    if (modalVisible) {
      panelOpened = true;
      console.log('Full settings modal opened via sidebar icon.');
    }
  }

  // Fallback: toolbar button -> mini panel -> "All Settings"
  if (!panelOpened) {
    const toolbarBtn = page.locator('#sd-toolbar-button');
    if (await toolbarBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await toolbarBtn.click();
      await sleep(1500);

      // Check if mini panel appeared
      const miniVisible = await page.locator('.sd-mini-panel').isVisible({ timeout: 2000 }).catch(() => false);
      if (miniVisible) {
        console.log('Mini panel opened via toolbar button.');

        // Try clicking "All Settings" to get the full modal
        const allSettingsBtn = page.locator('.sd-dropdown-all-settings-btn, button:has-text("All Settings")').first();
        if (await allSettingsBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await allSettingsBtn.click();
          await sleep(1500);
          const modalVisible = await page.locator('.sd-modal-backdrop').isVisible({ timeout: 2000 }).catch(() => false);
          if (modalVisible) {
            panelOpened = true;
            console.log('Full settings modal opened via "All Settings" button.');
          }
        }

        if (!panelOpened) {
          // Use the mini panel screenshot instead
          panelOpened = true;
          console.log('Using mini panel for panel screenshot.');
        }
      }
    }
  }

  if (!panelOpened) {
    console.log('WARNING: Could not open any settings panel.');
    // Debug: dump extension elements
    const sdEls = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[id*="sd-"], [class*="sd-"]'))
        .map(el => `${el.tagName}#${el.id}.${[...el.classList].join('.')}`);
    });
    console.log('Extension elements:', sdEls);
  }

  await page.screenshot({ path: path.join(OUTPUT_DIR, 'panel-open-dark.png') });
  console.log('Done.');

  // ═══════════════════════════════════════════════════════════════════
  // SCREENSHOT 5: QUICK SETTINGS GUIDE (cropped settings panel)
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n=== Screenshot 5: Quick settings guide ===');
  // The modal should still be open from screenshot 2; if not, reopen it
  let settingsVisible = await page.locator('.sd-modal-container').isVisible({ timeout: 1000 }).catch(() => false);
  if (!settingsVisible) {
    console.log('  Modal closed, reopening...');
    // Try sidebar icon
    if (await sidebarIcon.isVisible({ timeout: 1000 }).catch(() => false)) {
      await sidebarIcon.click();
      await sleep(1500);
    } else {
      // Try toolbar -> All Settings
      const tb = page.locator('#sd-toolbar-button');
      if (await tb.isVisible().catch(() => false)) {
        await tb.click();
        await sleep(1000);
        await page.evaluate(() => {
          const btns = document.querySelectorAll('[class*="sd-"] button');
          for (const b of btns) {
            if (b.textContent?.trim() === 'All Settings') { b.click(); break; }
          }
        });
        await sleep(1500);
      }
    }
    settingsVisible = await page.locator('.sd-modal-container').isVisible({ timeout: 2000 }).catch(() => false);
  }

  if (settingsVisible) {
    const settingsBox = await page.locator('.sd-modal-container').first().boundingBox();
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
  // Close panels first so the toolbar area is clear
  await closeDarklyPanels(page);
  await sleep(500);

  const toolbarBtnForGuide = page.locator('#sd-toolbar-button');
  if (await toolbarBtnForGuide.isVisible({ timeout: 3000 }).catch(() => false)) {
    const btnBox = await toolbarBtnForGuide.boundingBox();
    if (btnBox) {
      // Capture a region showing the toolbar button with surrounding context
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
    // Try sidebar icon
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

  // Open the full settings modal
  let modalOpened = false;
  if (await sidebarIcon.isVisible({ timeout: 2000 }).catch(() => false)) {
    await sidebarIcon.click();
    await sleep(1500);
    modalOpened = await page.locator('.sd-modal-backdrop').isVisible({ timeout: 2000 }).catch(() => false);
  }

  if (!modalOpened) {
    // Try via toolbar -> mini panel -> All Settings
    const tb = page.locator('#sd-toolbar-button');
    if (await tb.isVisible().catch(() => false)) {
      await tb.click();
      await sleep(1000);
      // Click "All Settings"
      const allBtn = await page.evaluate(() => {
        const btns = document.querySelectorAll('[class*="sd-dropdown"] button, [class*="sd-"] button');
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
        modalOpened = await page.locator('.sd-modal-backdrop').isVisible({ timeout: 2000 }).catch(() => false);
      }
    }
  }

  if (modalOpened) {
    console.log('Full settings modal opened for mode screenshots.');
    const modes = ['Schedule', 'Dark', 'Sunrise/Sunset', 'System'];
    for (const mode of modes) {
      // Click the mode via evaluate (more reliable)
      const clicked = await page.evaluate((m) => {
        const labels = document.querySelectorAll('[class*="sd-settings-mode-label"]');
        for (const l of labels) {
          if (l.textContent?.trim() === m) {
            const option = l.closest('[class*="sd-settings-mode-option"]');
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

        // Capture the modal
        const modalContainer = page.locator('.sd-modal-container').first();
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
      // Get image dimensions
      const dims = execSync(`identify -format "%wx%h" "${lightFull}"`).toString().trim();
      const [w, h] = dims.split('x').map(Number);
      const halfW = Math.floor(w / 2);

      // Crop left half from light, right half from dark, combine
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
        // 2x2 grid
        execSync(`convert \\( ${filePaths.split(' ').slice(0, 2).join(' ')} +append \\) \\( ${filePaths.split(' ').slice(2, 4).join(' ')} +append \\) -append -quality 90 "${panelViewsOutput}"`);
      } else {
        // Horizontal strip
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
  const finalTheme = await page.evaluate(() => document.documentElement.getAttribute('data-sd-theme'));
  console.log('\nFinal theme:', finalTheme);

  console.log('\nAll screenshots saved to:', OUTPUT_DIR);
  console.log('Files:', fs.readdirSync(OUTPUT_DIR).sort());

  await context.close();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
