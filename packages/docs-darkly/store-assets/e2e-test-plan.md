# E2E Test Plan: Docs Darkly — Fresh Install > Payment > Configuration

Run this checklist before Chrome Web Store submission.
Use a **fresh Google account** and a **production build** (`pnpm --filter docs-darkly build`).

---

## Prerequisites

Before starting, verify these are live:

- [ ] **darklysuite.com** — Payment API deployed on Cloudflare Pages with D1 + Stripe bindings
- [ ] **darklysuite.com/api/status/00000000-0000-4000-8000-000000000000?product=docs** — Returns `{"paid":false}` (not a 500 or DNS error). Token must be a valid UUID v4.
- [ ] **docsdarkly.com/privacy** — Privacy policy page is accessible
- [ ] **Stripe test mode** — Products and prices configured for docs (monthly/yearly/lifetime)
- [ ] **Promo code** — `CWSREVIEWDOCS2026` created in Stripe dashboard (100% off, `duration:once`)
- [ ] **Production zip** — Built from latest main: `pnpm --filter docs-darkly build`, then zip `dist/`

---

## Test 1: Fresh Install (No Payment)

**Setup**: Use a Chrome profile signed into the fresh Google account. No previous Darkly extension installed.

1. [ ] Load the extension as unpacked from the production `dist/` directory
2. [ ] **Verify**: Browser opens `docsdarkly.com/setup?product=docs` in a new tab
3. [ ] **Verify**: The setup page loads correctly (not a DNS error)
4. [ ] Navigate to `docs.google.com/document` and open any document
5. [ ] **Verify**: Google Docs loads normally (no crashes, no console errors)
6. [ ] **Verify**: The Darkly toolbar button appears in the Docs header bar (near the revision history / last edited area)
7. [ ] **Verify**: The Darkly sidebar icon appears in the right sidebar (companion app-switcher strip)
8. [ ] Click the Darkly toolbar button
9. [ ] **Verify**: Dark mode does NOT activate (free user, paywall blocks it)
10. [ ] **Verify**: A paywall/upgrade prompt appears showing "Darkly for Docs" (NOT "for Gmail" or "for Sheets")
11. [ ] **Verify**: The paywall shows three plan options: Monthly ($0.99/mo), Yearly ($9.99/yr), Lifetime ($29.99)
12. [ ] **Verify**: The "Subscribe Now" button is visible
13. [ ] Check the browser console (Right-click > Inspect > Console tab)
14. [ ] **Verify**: No errors (warnings about Pro status check are OK if the API is unreachable)

**Expected behavior for free users**: The toolbar button, sidebar icon, and paywall should be visible, but dark mode functionality should be gated behind payment. The paywall should show a "Subscribe Now" option.

---

## Test 2: Upgrade Flow (Stripe Checkout — Normal Payment)

**Setup**: Continue from Test 1 (extension installed, free user on Docs).

1. [ ] In the paywall, click "Subscribe Now" (or equivalent payment button)
2. [ ] **Verify**: A new tab opens to `darklysuite.com/api/checkout?token=...&plan=yearly&product=docs`
3. [ ] **Verify**: You're redirected to Stripe Checkout (stripe.com hosted page)
4. [ ] **Verify**: The checkout page shows the correct product ("Darkly for Docs") and price
5. [ ] Complete payment using Stripe test card: `4242 4242 4242 4242`, any future expiry, any CVC, any zip
6. [ ] **Verify**: After payment, you're redirected to the success page at `docsdarkly.com/success`
7. [ ] Return to the Docs tab
8. [ ] **Verify**: Within 30 minutes (cache TTL), or after closing and reopening the document, dark mode becomes available
   - To speed this up: clear the extension's local storage for the `dd_pro_cache` key, then refresh Docs

**Note**: The payment flow is: Extension > darklysuite.com/api/checkout > Stripe hosted checkout > Stripe webhook > D1 license record > Extension checks /api/status and gets `paid: true`.

---

## Test 3: Upgrade Flow (With Promo Code)

**Setup**: Fresh install (or clear extension storage to simulate a new free user).

1. [ ] Click "Subscribe Now" in the paywall
2. [ ] **Verify**: New tab opens to Stripe Checkout
3. [ ] At Stripe Checkout, locate the promo code field
4. [ ] Enter `CWSREVIEWDOCS2026`
5. [ ] **Verify**: Discount is applied (100% off)
6. [ ] Complete checkout with test card `4242 4242 4242 4242` (still required for `duration:once` coupons)
7. [ ] **Verify**: Redirected to success page at `docsdarkly.com/success`
8. [ ] Return to Docs tab and refresh (or clear `dd_pro_cache`)
9. [ ] **Verify**: License is created, dark mode unlocks

---

## Test 4: Pro User — Dark Mode Toggle

**Setup**: Continue from Test 2 or 3 (paid user on Docs).

1. [ ] Click the Darkly toolbar button
2. [ ] **Verify**: Mini panel shows with On/Off toggle
3. [ ] Toggle dark mode ON
4. [ ] **Verify**: Document canvas (Kix editor area) goes dark — background inverts, text becomes light
5. [ ] **Verify**: Toolbar and menu bar go dark
6. [ ] **Verify**: Ruler goes dark (horizontal and vertical)
7. [ ] **Verify**: Right sidebar (companion app strip) goes dark
8. [ ] **Verify**: Scrollbars are styled with dark track and lighter thumb
9. [ ] **Verify**: Transition is smooth (no flash of unstyled content)
10. [ ] Toggle dark mode OFF
11. [ ] **Verify**: Everything returns to the normal light theme
12. [ ] **Verify**: Transition is smooth (no jarring flash)

---

## Test 5: Pro User — Settings Panel

**Setup**: Continue from Test 4.

### Mode Switching

1. [ ] Click the sidebar icon or "All Settings" from the mini panel
2. [ ] **Verify**: Settings modal appears (centered overlay with backdrop)
3. [ ] Switch to **Dark** mode
4. [ ] **Verify**: Dark mode is always active regardless of time or OS setting
5. [ ] Switch to **Default** (Light) mode
6. [ ] **Verify**: Light theme is restored (default Google Docs appearance)
7. [ ] Switch to **System** mode
8. [ ] **Verify**: Dark mode matches your macOS appearance setting (System Settings > Appearance)
9. [ ] Toggle macOS appearance (dark <> light)
10. [ ] **Verify**: Docs theme updates to match
11. [ ] Switch to **Schedule** mode
12. [ ] **Verify**: Time pickers appear for start/end times
13. [ ] Set a schedule that should currently be active (e.g., dark from 6 PM to 6 AM if testing in evening)
14. [ ] **Verify**: Dark mode activates/deactivates according to the schedule
15. [ ] Switch to **Sunrise/Sunset** mode
16. [ ] **Verify**: Browser shows a geolocation permission prompt (offscreen document creates it)
17. [ ] Allow location access
18. [ ] **Verify**: Sunrise and sunset times are displayed
19. [ ] **Verify**: Dark mode activates/deactivates based on whether it's currently before/after sunset

### Preserve Page Colors (Docs-Specific)

CSS support exists for this feature via `data-darkly-page="preserve"`. A UI toggle may not be implemented yet. Test as follows:

20. [ ] Look for a "Preserve Page Colors" toggle in the settings panel
21. [ ] **If toggle exists**: Toggle ON — **Verify** the document pages (.kix-page, .kix-canvas-tile-content) stay in their original light colors while the toolbar, sidebar, and surrounding UI remain dark
22. [ ] **If toggle exists**: Toggle OFF — **Verify** everything inverts including the document canvas
23. [ ] **If toggle does NOT exist**: Note this as a non-blocker observation. The CSS rules are ready but the UI toggle is not yet wired. Verify the CSS works by manually setting `data-darkly-page="preserve"` on `<html>` in DevTools and confirming the canvas re-inverts.

### Theme Presets

24. [ ] Test each theme preset and verify the UI updates accordingly:
    - [ ] Default (no preset — standard dark inversion)
    - [ ] Nord
    - [ ] Solarized Dark
    - [ ] Monokai
    - [ ] Catppuccin Mocha
    - [ ] Rose Pine
25. [ ] **Verify**: Each preset applies a distinct color palette to the dark theme
26. [ ] **Verify**: Switching presets is smooth (no flash or broken intermediate state)

---

## Test 6: Pro User — Manage Subscription

**Setup**: Continue from Test 5.

1. [ ] In the settings panel, find "Manage Subscription" (or equivalent link/button)
2. [ ] **Verify**: A new tab opens to Stripe's customer portal
3. [ ] **Verify**: The portal shows the active subscription details
4. [ ] **Do NOT cancel** — just verify the portal loads correctly
5. [ ] Close the portal tab

---

## Test 7: Persistence Across Sessions

**Setup**: Continue from Test 6.

1. [ ] Set dark mode to ON with a specific theme preset (e.g., Nord)
2. [ ] Close the Docs tab completely
3. [ ] Open a new tab and navigate to any document on `docs.google.com/document`
4. [ ] **Verify**: Dark mode is still active with the same preset (preferences persisted)
5. [ ] Open a document in a different Chrome window
6. [ ] **Verify**: Dark mode is active with the same preset there too (chrome.storage.sync)

---

## Test 8: Docs UI Coverage

**Setup**: Pro user with dark mode ON.

Test dark mode appearance across all Google Docs UI elements:

### Document Canvas (Kix Editor)

- [ ] **Document canvas / Kix editor** — text readable, page background dark (or preserved if toggle is on)
- [ ] **Text cursor** — visible against dark background, blinking normally
- [ ] **Text selection highlight** — selection rectangles visible with adequate contrast
- [ ] **Paginated mode** (default) — page borders/margins visible, page breaks clearly delineated
- [ ] **Pageless mode** (File > Page setup > Pageless) — verify dark mode works in pageless layout; no extra borders or artifacts

### Toolbar and Menus

- [ ] **Menu bar** — File, Edit, View, Insert, Format, Tools, Extensions, Help menus all themed
- [ ] **File menu** — all items readable with proper contrast
- [ ] **Edit menu** — Undo, Redo, Cut, Copy, Paste, Find and replace
- [ ] **View menu** — Show outline, Show ruler, Full screen
- [ ] **Insert menu** — Image, Table, Drawing, Chart, Horizontal line, Footnote, Header/Footer, Table of contents, Link, Emoji, Special characters
- [ ] **Format menu** — Text, Paragraph styles, Align & indent, Line & paragraph spacing, Columns, Bullets & numbering, Headers & footers, Page numbers
- [ ] **Tools menu** — Spelling and grammar, Word count, Review suggested edits, Compare documents, Citations, Explore, Linked objects, Dictionary, Translate, Accessibility
- [ ] **Extensions menu** — Add-ons, Apps Script
- [ ] **Help menu** — all items readable
- [ ] **Formatting toolbar** — font picker, font size, bold/italic/underline/strikethrough buttons, text color, highlight color, alignment, line spacing, lists, indent
- [ ] **Right-click context menus** — all items readable with proper contrast

### Sidebars and Panels

- [ ] **Document outline panel** (View > Show outline) — headings readable, panel background themed
- [ ] **Explore panel** (Tools > Explore) — if available, verify theming
- [ ] **Comments panel** (right sidebar) — comment threads readable, reply boxes themed, resolve buttons visible
- [ ] **Companion app-switcher strip** (right sidebar with Google app icons) — themed correctly

### Ruler

- [ ] **Horizontal ruler** — styled correctly, tab stops visible, margin markers visible
- [ ] **Vertical ruler** (if visible in print layout) — styled correctly

### Dialogs and Popups

- [ ] **Find and Replace** (Ctrl/Cmd+H) — dialog themed correctly, input fields readable
- [ ] **Word count** (Tools > Word count) — popup themed
- [ ] **Page setup** (File > Page setup) — dialog themed, orientation/margin options visible
- [ ] **Share dialog** — click Share button; verify dialog is themed, email input visible
- [ ] **Link insertion/editing** — Ctrl/Cmd+K or Insert > Link; verify popup themed
- [ ] **Link preview popups** — hover over a link; verify preview card themed
- [ ] **Image options dialog** — click an image, then "Image options"; verify panel themed
- [ ] **Table properties** — right-click a table > Table properties; verify dialog themed
- [ ] **Special characters** (Insert > Special characters) — verify grid dialog themed
- [ ] **Emoji picker** (Insert > Emoji) — verify picker themed

### Color Pickers

- [ ] **Text color picker** — click the text color button (A with color bar); verify swatches are re-inverted to show accurate colors
- [ ] **Highlight color picker** — click the highlight button; verify swatches are re-inverted to show accurate colors
- [ ] **Table cell background color** — in a table, right-click > Table properties > Cell background color; verify color picker shows accurate colors

### Content Elements

- [ ] **Images** — inserted images display in correct (re-inverted) colors, not doubly inverted
- [ ] **Drawings** — Insert > Drawing; embedded drawings show correct colors
- [ ] **Charts** — embedded Google Sheets charts show correct colors (re-inverted)
- [ ] **Tables** — insert a table; verify cells themed correctly, borders visible
- [ ] **Horizontal lines** — Insert > Horizontal line; verify line visible against dark background
- [ ] **Equations** — Insert > Equation; verify equation text readable

### Document Structure

- [ ] **Header area** — Insert > Headers & footers > Header; verify editing area themed
- [ ] **Footer area** — Insert > Headers & footers > Footer; verify editing area themed
- [ ] **Footnotes** — Insert > Footnote; verify footnote area at bottom of page themed, footnote text readable
- [ ] **Table of contents** — Insert > Table of contents; verify it renders correctly with proper link styling
- [ ] **Page break rendering** — Insert > Break > Page break; verify page breaks visible with clear separation

### Collaboration Features

- [ ] **Collaboration cursors** — if testing with multiple users, verify other users' colored cursors are visible and not inverted (re-inverted via CSS)
- [ ] **Cursor name labels** — collaborator name labels stay in their original colors
- [ ] **Comment threads** — anchored comments (.docos-anchoreddocoview) are re-inverted to show correctly
- [ ] **Comment resolve button** — resolve button container visible and functional
- [ ] **Suggestion mode** — Edit > Suggesting mode; verify suggestion highlights visible and readable (green for additions, red/strikethrough for deletions)
- [ ] **Suggestion accept/reject buttons** — buttons visible and functional in dark mode

### Spelling and Grammar

- [ ] **Red/blue underlines** — spelling (red) and grammar (blue) underlines visible against dark background
- [ ] **Correction popups** — right-click a misspelled word; verify suggestion popup themed

---

## Test 9: Edge Cases

- [ ] **Multiple Docs tabs** — open 2+ documents; verify dark mode state is consistent across all tabs
- [ ] **Document switching** — navigate between documents within Docs; verify toolbar button persists (DOM observer re-injection via `startCanvasObserver`)
- [ ] **Print/export** — File > Print; verify extension skips print preview (content script checks for `/print`, `/export`, `/preview` in path)
- [ ] **Iframe skip** — embedded Docs iframes should be skipped; the content script checks `window.self !== window.top`
- [ ] **Embedded content** — documents with images, charts, and drawings; verify images are re-inverted (show correct colors, not doubly inverted)
- [ ] **Long documents** — open a document with 50+ pages; verify no performance degradation (scrolling remains smooth, no layout jank)
- [ ] **Documents with many images** — open a document with 20+ images; verify all images re-invert correctly and no lag
- [ ] **Document with embedded Sheets chart** — insert or open a doc with a linked chart; verify chart is re-inverted to show original colors
- [ ] **Extension reload** — chrome://extensions > click refresh button on Darkly for Docs; refresh the Docs page; verify settings persist
- [ ] **Setup page does NOT reopen on reload** — after extension reload, the setup page should NOT open again (`onInstalled` fires only for `reason: install`, not `update`)
- [ ] **Network offline** — disconnect from the internet, refresh Docs; verify extension doesn't crash (paid users with cached `dd_pro_cache` status should still have dark mode)
- [ ] **Collaborative editing** — have another user edit the same document while dark mode is active; verify dark mode works while others edit, cursors visible
- [ ] **Pageless mode transition** — start in paginated mode with dark mode on; switch to pageless (File > Page setup > Pageless); verify dark mode adjusts without errors (pageless detection in plugin.ts)
- [ ] **color-scheme forced to light** — verify `document.documentElement.style.colorScheme` is `'light'` when dark mode is active (prevents Google's native dark mode from conflicting; `forceColorSchemeLight: true` in config)


---

## Test 10: Dashboard Page

**Setup**: Navigate to `docs.google.com/document/` (home/dashboard page).

1. [ ] **Verify**: Dark mode filter applies to the dashboard page
2. [ ] **Verify**: The Darkly settings icon (FAB) appears in the dashboard header toolbar area (right-side of the global bar header)
3. [ ] Click the FAB icon
4. [ ] **Verify**: Settings modal opens
5. [ ] **Verify**: Recent documents list is readable with proper contrast
6. [ ] **Verify**: Template gallery is themed
7. [ ] **Verify**: Search bar and navigation are themed
8. [ ] **Verify**: No broken injections or console errors on dashboard
9. [ ] Open a document from the dashboard
10. [ ] **Verify**: Transition from dashboard to editor preserves dark mode state
11. [ ] Navigate back to dashboard (Docs home icon or browser back)
12. [ ] **Verify**: Dashboard remains in dark mode

---

## Test 11: Conflict Detection

**Setup**: Install both Darkly for Docs (standalone) and Darkly Suite (bundle) extensions.

1. [ ] Install Darkly Suite alongside Docs Darkly
2. [ ] Open Google Docs document
3. [ ] **Verify**: Only ONE extension activates (first to load claims the page via `data-darkly-active` attribute on `<html>`)
4. [ ] Open DevTools Console
5. [ ] **Verify**: The second extension logs a conflict warning: `[Darkly] Page already claimed by "..." . "..." will not inject its theme to avoid conflicts.`
6. [ ] **Verify**: No visual artifacts, double-inversion, or flickering from the conflict
7. [ ] Uninstall Darkly Suite
8. [ ] Refresh the Docs page
9. [ ] **Verify**: Docs Darkly works alone with no issues

---

## Blocker Checklist

If ANY of these fail, do NOT submit to Chrome Web Store:

- [ ] Extension loads without crashing Google Docs
- [ ] Paywall shows "Darkly for Docs" (NOT "for Gmail" or "for Sheets")
- [ ] Paywall blocks features for free users
- [ ] Normal payment flow completes successfully
- [ ] Promo code payment flow completes successfully
- [ ] Dark mode activates for paid users
- [ ] Settings persist across sessions
- [ ] No console errors that would concern a Google reviewer
- [ ] `docsdarkly.com/privacy` is accessible
- [ ] `darklysuite.com/api/status/{uuid-v4-token}?product=docs` responds correctly
- [ ] Color picker swatches show accurate colors in dark mode (re-inverted, not doubly inverted)
- [ ] Collaboration cursors stay visible and correctly colored
- [ ] Images and embedded content re-invert to show original colors
- [ ] Extension does not affect other Google apps (Sheets, Gmail)
- [ ] Uninstall is clean — no leftover `data-darkly-active` attribute, no residual styles after disabling
- [ ] Performance: no noticeable lag on standard documents
- [ ] Privacy: no unexpected network requests (only `darklysuite.com/api` and `api.sunrise-sunset.org`)
- [ ] Dashboard page FAB icon works correctly
- [ ] Pageless mode works correctly with dark mode
- [ ] `color-scheme: light` is forced (no conflict with Google's native dark mode)

---

## Dependencies

These issues must be resolved before running the full test plan:

- #296 — `siteBase` must point to `docsdarkly.com`
- #297 — Stripe prices must be configured for Docs
- #306 — `docsdarkly.com` landing page must be deployed
- #310 — Promo code `CWSREVIEWDOCS2026` must be created in Stripe
