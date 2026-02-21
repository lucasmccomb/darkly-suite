# E2E Test Plan: Darkly Suite — Fresh Install > Payment > Configuration

Run this checklist before Chrome Web Store submission.
Use a **fresh Google account** and a **production build** (`pnpm --filter darkly-suite build`).

Darkly Suite is the **bundle extension** covering Gmail, Sheets, Docs, and Drive with a single subscription. This test plan covers all four apps plus cross-app behavior and conflict detection.

---

## Prerequisites

Before starting, verify these are live:

- [ ] **darklysuite.com** — Payment API deployed on Cloudflare Pages with D1 + Stripe bindings
- [ ] **darklysuite.com/api/status/00000000-0000-4000-8000-000000000000?product=suite** — Returns `{"paid":false}` (not a 500 or DNS error). Token must be a valid UUID v4.
- [ ] **darklysuite.com/privacy** — Privacy policy page is accessible
- [ ] **Stripe test mode** — Products and prices configured for suite (monthly/yearly/lifetime)
- [ ] **Promo code** — `CWSREVIEWSUITE2026` created in Stripe dashboard (100% off, `duration:once`)
- [ ] **Production zip** — Built from latest main: `pnpm --filter darkly-suite build`, then zip `dist/`
- [ ] **No standalone Darkly extensions installed** — Uninstall Gmail Darkly, Sheets Darkly, and Docs Darkly before starting (conflict detection is tested separately in Test 12)
- [ ] **Drive access** — The test Google account has access to Google Drive at drive.google.com

---

## Test 1: Fresh Install (No Payment)

**Setup**: Use a Chrome profile signed into the fresh Google account. No previous Darkly extension installed.

1. [ ] Load the extension as unpacked from the production `dist/` directory
2. [ ] **Verify**: Browser opens `darklysuite.com/setup?product=suite` in a new tab
3. [ ] **Verify**: The setup page loads correctly (not a DNS error)

### Gmail

4. [ ] Navigate to `mail.google.com`
5. [ ] **Verify**: Gmail loads normally (no crashes, no console errors)
6. [ ] **Verify**: The Darkly toolbar button appears in Gmail's toolbar area (via InboxSDK)
7. [ ] Click the Darkly toolbar button
8. [ ] **Verify**: Dark mode does NOT activate (free user, paywall blocks it)
9. [ ] **Verify**: A paywall/upgrade prompt appears showing "Darkly Suite" (NOT "for Gmail" standalone branding)
10. [ ] **Verify**: The paywall shows three plan options: Monthly ($0.99/mo), Yearly ($9.99/yr), Lifetime ($29.99)

### Sheets

11. [ ] Navigate to `docs.google.com/spreadsheets` and open any spreadsheet
12. [ ] **Verify**: Google Sheets loads normally (no crashes, no console errors)
13. [ ] **Verify**: The Darkly toolbar button appears in the Sheets header bar
14. [ ] **Verify**: The Darkly sidebar icon appears in the right sidebar (companion app strip)
15. [ ] Click the Darkly toolbar button
16. [ ] **Verify**: Dark mode does NOT activate (free user, paywall blocks it)
17. [ ] **Verify**: A paywall/upgrade prompt appears showing "Darkly Suite"

### Docs

18. [ ] Navigate to `docs.google.com/document` and open any document
19. [ ] **Verify**: Google Docs loads normally (no crashes, no console errors)
20. [ ] **Verify**: The Darkly toolbar button appears in the Docs header bar
21. [ ] **Verify**: The Darkly sidebar icon appears in the right sidebar (companion app strip)
22. [ ] Click the Darkly toolbar button
23. [ ] **Verify**: Dark mode does NOT activate (free user, paywall blocks it)
24. [ ] **Verify**: A paywall/upgrade prompt appears showing "Darkly Suite"

### Console Check

25. [ ] Check the browser console on each app (Right-click > Inspect > Console tab)
26. [ ] **Verify**: No errors on Gmail (warnings about Pro status check are OK)
27. [ ] **Verify**: No errors on Sheets
28. [ ] **Verify**: No errors on Docs
29. [ ] **Verify**: Console logs show `[Darkly Suite] Gmail content script loaded (prefix: ds, storage: ds_gmail_preferences)`
30. [ ] **Verify**: Console logs show `[Darkly Suite] Sheets content script loaded (prefix: ds, storage: ds_sheets_preferences)`
31. [ ] **Verify**: Console logs show `[Darkly Suite] Docs content script loaded (prefix: ds, storage: ds_docs_preferences)`

**Expected behavior for free users**: The toolbar button, sidebar icon, and paywall should be visible on all four apps, but dark mode functionality should be gated behind payment. The paywall should show a "Subscribe Now" option.

---

## Test 2: Upgrade Flow (Stripe Checkout — Normal Payment)

**Setup**: Continue from Test 1 (extension installed, free user).

1. [ ] On any Google app, click "Subscribe Now" in the paywall
2. [ ] **Verify**: A new tab opens to `darklysuite.com/api/checkout?token=...&plan=yearly&product=suite`
3. [ ] **Verify**: You're redirected to Stripe Checkout (stripe.com hosted page)
4. [ ] **Verify**: The checkout page shows the correct product ("Darkly Suite") and price
5. [ ] Complete payment using Stripe test card: `4242 4242 4242 4242`, any future expiry, any CVC, any zip
6. [ ] **Verify**: After payment, you're redirected to the success page at `darklysuite.com/success`
7. [ ] Return to the Gmail tab
8. [ ] **Verify**: Within 30 minutes (cache TTL), or after closing and reopening the app, dark mode becomes available
   - To speed this up: clear the extension's local storage for the `ds_pro_cache` key, then refresh the page
9. [ ] **Verify**: ONE Suite subscription grants pro access on Gmail
10. [ ] Navigate to Sheets — **Verify**: Pro access is active (no paywall)
11. [ ] Navigate to Docs — **Verify**: Pro access is active (no paywall)

**Note**: The payment flow is: Extension > darklysuite.com/api/checkout > Stripe hosted checkout > Stripe webhook > D1 license record > Extension checks /api/status and gets `paid: true`. Because all four sites share `ds_token` and `ds_pro_cache`, a single payment unlocks all apps.

---

## Test 3: Upgrade Flow (With Promo Code)

**Setup**: Fresh install (or clear extension storage to simulate a new free user).

1. [ ] Click "Subscribe Now" in the paywall on any Google app
2. [ ] **Verify**: New tab opens to Stripe Checkout
3. [ ] At Stripe Checkout, locate the promo code field
4. [ ] Enter `CWSREVIEWSUITE2026`
5. [ ] **Verify**: Discount is applied (100% off)
6. [ ] Complete checkout with test card `4242 4242 4242 4242` (still required for `duration:once` coupons)
7. [ ] **Verify**: Redirected to success page at `darklysuite.com/success`
8. [ ] Return to any Google app tab and refresh (or clear `ds_pro_cache`)
9. [ ] **Verify**: License is created, dark mode unlocks
10. [ ] **Verify**: Pro access works on Gmail, Sheets, AND Docs

---

## Test 4: Gmail Dark Mode

**Setup**: Pro user (paid via Test 2 or 3).

### Basic Toggle

1. [ ] Navigate to `mail.google.com`
2. [ ] Click the Darkly toolbar button
3. [ ] **Verify**: Dark mode activates — Gmail background turns dark, text turns light
4. [ ] **Verify**: Transition is smooth (no flash of unstyled content)
5. [ ] Click the toolbar button again to toggle off
6. [ ] **Verify**: Gmail returns to normal light theme smoothly

### Gmail UI Coverage

7. [ ] **Inbox view**: Verify email list, sidebar, top bar are all properly themed
8. [ ] **Open an email**: Click an email thread — verify the reading pane is themed
9. [ ] **Compose**: Click "Compose" — verify the compose window is themed
10. [ ] **Gmail Settings**: Click the gear icon > "See all settings" — verify Gmail's settings page is themed
11. [ ] **Search**: Use the search bar — verify search results/suggestions dropdown is themed
12. [ ] **Labels/folders**: Navigate to Starred, Sent, Drafts — verify sidebar navigation is themed
13. [ ] **Right-click menus**: Right-click on an email — verify context menus are readable
14. [ ] **Popovers**: Hover over sender names, attachment previews — verify popovers are themed
15. [ ] **Images in emails**: Open an email with images — verify images are re-inverted (show original colors, not doubly inverted)
16. [ ] **Emoji**: Verify emoji images in emails are re-inverted to show correct colors
17. [ ] **Gmail logo**: Verify the Gmail logo remains visible in the dark theme (not double-inverted)

### Settings Panel on Gmail

18. [ ] Click "All Settings" from the toolbar dropdown (InboxSDK sidebar panel)
19. [ ] **Verify**: Settings modal/sidebar appears with mode selector and preset options
20. [ ] **Verify**: On/Off toggle works
21. [ ] **Verify**: Theme mode selector shows all 5 modes: Dark, System, Default, Schedule, Sunrise/Sunset
22. [ ] **Verify**: "Manage Subscription" link is visible

---

## Test 5: Sheets Dark Mode

**Setup**: Pro user with dark mode enabled.

### Basic Toggle

1. [ ] Navigate to `docs.google.com/spreadsheets` and open any spreadsheet
2. [ ] Click the Darkly toolbar button
3. [ ] **Verify**: Mini panel shows with toggle and "All Settings" link
4. [ ] Toggle dark mode ON
5. [ ] **Verify**: Spreadsheet background goes dark
6. [ ] **Verify**: Formula bar is styled correctly
7. [ ] **Verify**: Toolbar and menu bar are styled
8. [ ] **Verify**: Right sidebar is styled
9. [ ] **Verify**: Sheet tabs at the bottom are styled
10. [ ] **Verify**: Transition is smooth
11. [ ] Toggle dark mode OFF
12. [ ] **Verify**: Everything returns to the normal light theme smoothly

### Sheets UI Coverage

13. [ ] **Cell editing** — click a cell, type — text and cell border visible
14. [ ] **Formula bar** — active and inactive states styled
15. [ ] **Frozen rows/columns** — freeze pane dividers render correctly in dark mode
16. [ ] **Sheet tabs** (bottom bar) — tab names readable, active tab distinguishable
17. [ ] **Right-click context menus** — all items readable with proper contrast
18. [ ] **Menus** — File, Edit, View, Insert, Format, Data, Tools, Extensions, Help
19. [ ] **Toolbars** — formatting toolbar, function bar
20. [ ] **Conditional formatting dialog**
21. [ ] **Chart display and chart editor** — charts re-inverted to show original colors
22. [ ] **Filter views** — filter icons and dropdown menus readable
23. [ ] **Comments/notes** — comment bubbles and note popups themed
24. [ ] **Color picker swatches** — show accurate colors despite inversion (re-inverted via CSS)
25. [ ] **Find and replace dialog** (`Ctrl/Cmd+H`)
26. [ ] **Insert menu items** — images, charts, drawings, etc.
27. [ ] **Data validation dialogs**
28. [ ] **Named ranges dialog** (`Data > Named ranges`)

### Preserve Grid Colors (Sheets-Specific)

29. [ ] Click "All Settings" from the mini panel
30. [ ] Locate the "Preserve Grid Colors" toggle in the Sheets section
31. [ ] Toggle OFF: **Verify** everything inverts including the spreadsheet grid and cell backgrounds
32. [ ] Toggle ON: **Verify** spreadsheet grid/cells stay in original light colors while the rest of the UI remains dark
33. [ ] Edit some cells with Preserve Grid Colors ON — **Verify** the preserved colors look correct during editing
34. [ ] **Verify**: Frozen rows/columns also preserve their colors when the toggle is ON

### Settings Panel on Sheets

35. [ ] **Verify**: Settings modal appears (centered overlay with backdrop)
36. [ ] **Verify**: Theme mode selector shows all 5 modes
37. [ ] **Verify**: Sheets-specific "Preserve Grid Colors" section is present
38. [ ] **Verify**: On/Off toggle, theme presets all work

---

## Test 6: Docs Dark Mode

**Setup**: Pro user with dark mode enabled.

### Basic Toggle

1. [ ] Navigate to `docs.google.com/document` and open any document
2. [ ] Click the Darkly toolbar button
3. [ ] **Verify**: Mini panel shows with toggle and "All Settings" link
4. [ ] Toggle dark mode ON
5. [ ] **Verify**: Document canvas (Kix editor area) goes dark — background inverts, text becomes light
6. [ ] **Verify**: Toolbar and menu bar go dark
7. [ ] **Verify**: Ruler goes dark (horizontal and vertical)
8. [ ] **Verify**: Right sidebar (companion app strip) goes dark
9. [ ] **Verify**: Scrollbars are styled with dark track and lighter thumb
10. [ ] **Verify**: Transition is smooth
11. [ ] Toggle dark mode OFF
12. [ ] **Verify**: Everything returns to the normal light theme smoothly

### Docs UI Coverage

13. [ ] **Document canvas / Kix editor** — text readable, page background dark
14. [ ] **Text cursor** — visible against dark background, blinking normally
15. [ ] **Text selection highlight** — selection rectangles visible with adequate contrast
16. [ ] **Paginated mode** (default) — page borders/margins visible, page breaks clearly delineated
17. [ ] **Pageless mode** (File > Page setup > Pageless) — verify dark mode works in pageless layout; no extra borders or artifacts
18. [ ] **Menu bar** — File, Edit, View, Insert, Format, Tools, Extensions, Help menus all themed
19. [ ] **Formatting toolbar** — font picker, font size, bold/italic/underline, text color, highlight color, alignment, spacing, lists, indent
20. [ ] **Right-click context menus** — all items readable with proper contrast
21. [ ] **Document outline panel** (View > Show outline) — headings readable, panel background themed
22. [ ] **Comments panel** (right sidebar) — comment threads readable, reply boxes themed, resolve buttons visible
23. [ ] **Horizontal ruler** — styled correctly, tab stops visible, margin markers visible
24. [ ] **Find and Replace** (Ctrl/Cmd+H) — dialog themed correctly, input fields readable
25. [ ] **Share dialog** — click Share button; verify dialog is themed, email input visible
26. [ ] **Link insertion/editing** — Ctrl/Cmd+K; verify popup themed
27. [ ] **Link preview popups** — hover over a link; verify preview card themed

### Color Pickers (Docs)

28. [ ] **Text color picker** — click the text color button; verify swatches are re-inverted to show accurate colors
29. [ ] **Highlight color picker** — click the highlight button; verify swatches are re-inverted
30. [ ] **Table cell background color** — right-click table > Table properties > Cell background; verify picker shows accurate colors

### Content Elements

31. [ ] **Images** — inserted images display in correct (re-inverted) colors, not doubly inverted
32. [ ] **Drawings** — Insert > Drawing; embedded drawings show correct colors
33. [ ] **Charts** — embedded Google Sheets charts show correct colors (re-inverted)
34. [ ] **Tables** — insert a table; verify cells themed correctly, borders visible
35. [ ] **Equations** — Insert > Equation; verify equation text readable
36. [ ] **Header/Footer** — Insert > Headers & footers; verify editing area themed
37. [ ] **Footnotes** — Insert > Footnote; verify footnote area themed, text readable
38. [ ] **Table of contents** — Insert > Table of contents; verify rendered correctly

### Collaboration Features

39. [ ] **Collaboration cursors** — if testing with multiple users, verify other users' colored cursors are visible and not inverted (re-inverted via CSS)
40. [ ] **Cursor name labels** — collaborator name labels stay in their original colors
41. [ ] **Comment threads** — anchored comments (.docos-anchoreddocoview) are re-inverted to show correctly
42. [ ] **Suggestion mode** — Edit > Suggesting mode; verify suggestion highlights visible and readable
43. [ ] **Suggestion accept/reject buttons** — buttons visible and functional in dark mode

### Preserve Page Colors (Docs-Specific)

44. [ ] Look for a "Preserve Page Colors" toggle in the settings panel
45. [ ] **If toggle exists**: Toggle ON — **Verify** document pages (.kix-page, .kix-canvas-tile-content) stay in original light colors while toolbar, sidebar, and surrounding UI remain dark
46. [ ] **If toggle exists**: Toggle OFF — **Verify** everything inverts including the document canvas
47. [ ] **If toggle does NOT exist**: Note as non-blocker. CSS rules are ready (`data-darkly-page="preserve"`) but the UI toggle is not yet wired. Verify the CSS works by manually setting `data-darkly-page="preserve"` on `<html>` in DevTools.

### Forced color-scheme

48. [ ] **Verify**: `document.documentElement.style.colorScheme` is `'light'` when dark mode is active on Docs (prevents Google's native dark mode from conflicting; `forceColorSchemeLight: true` in config)

### Settings Panel on Docs

49. [ ] **Verify**: Settings modal appears (centered overlay with backdrop)
50. [ ] **Verify**: Theme mode selector shows all 5 modes
51. [ ] **Verify**: On/Off toggle, theme presets all work

---

## Test 7: Cross-App Settings Independence

**Suite uses per-site storage keys** (`ds_gmail_preferences`, `ds_sheets_preferences`, `ds_docs_preferences`, `ds_drive_preferences`). Each app maintains its own preferences independently.

1. [ ] On Gmail: Set mode to **Dark**, preset to **Nord**
2. [ ] On Sheets: Set mode to **System**, preset to **Solarized Dark**
3. [ ] On Docs: Set mode to **Schedule**, preset to **Monokai**
4. [ ] On Drive: Set mode to **Dark**, preset to **Rose Pine**
5. [ ] Refresh Gmail — **Verify**: Mode is still Dark with Nord preset
6. [ ] Refresh Sheets — **Verify**: Mode is still System with Solarized Dark preset
7. [ ] Refresh Docs — **Verify**: Mode is still Schedule with Monokai preset
8. [ ] Refresh Drive — **Verify**: Mode is still Dark with Rose Pine preset
9. [ ] **Verify**: Changing settings on one app does NOT affect the other apps
10. [ ] **Verify**: All four apps share the SAME pro status (one payment unlocks all)
11. [ ] Open Chrome DevTools > Application > Storage > chrome.storage.sync
12. [ ] **Verify**: Four separate storage keys exist: `ds_gmail_preferences`, `ds_sheets_preferences`, `ds_docs_preferences`, `ds_drive_preferences`
13. [ ] **Verify**: A shared `ds_token` key exists (used for payment across all sites)
14. [ ] **Verify**: A shared `ds_pro_cache` key exists (payment cache shared across all sites)

---

## Test 8: Settings Panel — All Modes (Each App)

**Setup**: Pro user.

### Mode Switching (repeat on Gmail, Sheets, Docs, AND Drive)

For each Google app:

1. [ ] Open settings panel
2. [ ] Switch to **Dark** mode
3. [ ] **Verify**: Dark mode is always active regardless of time or OS setting
4. [ ] Switch to **Default** (Light) mode
5. [ ] **Verify**: Light theme is restored (default Google appearance)
6. [ ] Switch to **System** mode
7. [ ] **Verify**: Dark mode matches your macOS appearance setting (System Settings > Appearance)
8. [ ] Toggle macOS appearance (dark <> light)
9. [ ] **Verify**: The app's theme updates to match
10. [ ] Switch to **Schedule** mode
11. [ ] **Verify**: Time pickers appear for start/end times
12. [ ] Set a schedule that should currently be active (e.g., dark from 6 PM to 6 AM if testing in evening)
13. [ ] **Verify**: Dark mode activates/deactivates according to the schedule
14. [ ] Switch to **Sunrise/Sunset** mode
15. [ ] **Verify**: Browser shows a geolocation permission prompt (offscreen document)
16. [ ] Allow location access
17. [ ] **Verify**: Sunrise and sunset times are displayed
18. [ ] **Verify**: Dark mode activates/deactivates based on whether it's currently before/after sunset

### Theme Presets (repeat on Gmail, Sheets, Docs, AND Drive)

For each Google app:

19. [ ] Test each theme preset and verify the UI updates accordingly:
    - [ ] Default (no preset — standard dark inversion)
    - [ ] Nord
    - [ ] Solarized Dark
    - [ ] Monokai
    - [ ] Catppuccin Mocha
    - [ ] Rose Pine
20. [ ] **Verify**: Each preset applies a distinct color palette to the dark theme
21. [ ] **Verify**: Switching presets is smooth (no flash or broken intermediate state)

### Summary Checklist

- [ ] All 5 modes tested on Gmail
- [ ] All 5 modes tested on Sheets
- [ ] All 5 modes tested on Docs
- [ ] All 5 modes tested on Drive
- [ ] All 6 presets tested on Gmail
- [ ] All 6 presets tested on Sheets
- [ ] All 6 presets tested on Docs
- [ ] All 6 presets tested on Drive

---

## Test 9: Dashboard Pages

### Sheets Dashboard

1. [ ] Navigate to `docs.google.com/spreadsheets` (home/dashboard page, NOT an individual spreadsheet)
2. [ ] **Verify**: Dark mode filter applies to the dashboard page
3. [ ] **Verify**: The Darkly settings icon (FAB) appears in the dashboard header toolbar area (right-side of the global bar `#gb`)
4. [ ] Click the FAB icon
5. [ ] **Verify**: Settings modal opens
6. [ ] **Verify**: Recent spreadsheets list is readable with proper contrast
7. [ ] **Verify**: Template gallery is themed
8. [ ] **Verify**: Search bar and navigation are themed
9. [ ] Open a spreadsheet from the dashboard
10. [ ] **Verify**: Transition from dashboard to editor preserves dark mode state

### Docs Dashboard

11. [ ] Navigate to `docs.google.com/document` (home/dashboard page, NOT an individual document)
12. [ ] **Verify**: Dark mode filter applies to the dashboard page
13. [ ] **Verify**: The Darkly settings icon (FAB) appears in the dashboard header toolbar area
14. [ ] Click the FAB icon
15. [ ] **Verify**: Settings modal opens
16. [ ] **Verify**: Recent documents list is readable with proper contrast
17. [ ] **Verify**: Template gallery is themed
18. [ ] Open a document from the dashboard
19. [ ] **Verify**: Transition from dashboard to editor preserves dark mode state

### Drive Dashboard

20. [ ] Navigate to `drive.google.com` (Drive is dashboard-only)
21. [ ] **Verify**: Dark mode filter applies to the Drive dashboard
22. [ ] **Verify**: The Darkly settings icon (FAB) appears in the Drive header toolbar area
23. [ ] Click the FAB icon
24. [ ] **Verify**: Settings modal opens
25. [ ] **Verify**: File list is readable with proper contrast
26. [ ] **Verify**: Sidebar navigation is themed

### Gmail (No Dashboard Distinction)

27. [ ] Navigate to `mail.google.com` — Gmail inbox IS the main view
28. [ ] **Verify**: Darkly toolbar button appears (InboxSDK manages this)
29. [ ] **Verify**: Dark mode works on the inbox view

---

## Test 10: Subscription Management

**Setup**: Pro user.

1. [ ] On Gmail: open settings panel, find "Manage Subscription" (or equivalent link/button)
2. [ ] **Verify**: A new tab opens to Stripe's customer portal
3. [ ] **Verify**: The portal shows the active subscription details for "Darkly Suite"
4. [ ] **Do NOT cancel** — just verify the portal loads correctly
5. [ ] Close the portal tab
6. [ ] **Verify**: The same "Manage Subscription" link appears on Sheets settings panel
7. [ ] **Verify**: The same "Manage Subscription" link appears on Docs settings panel
8. [ ] **Verify**: The same "Manage Subscription" link appears on Drive settings panel

### Cancellation Flow (test LAST — this disables pro access)

9. [ ] Open Stripe customer portal from any app's settings
10. [ ] Cancel the subscription
11. [ ] Return to Gmail — clear `ds_pro_cache` — refresh
12. [ ] **Verify**: Paywall reappears on Gmail
13. [ ] Navigate to Sheets — refresh
14. [ ] **Verify**: Paywall reappears on Sheets
15. [ ] Navigate to Docs — refresh
16. [ ] **Verify**: Paywall reappears on Docs
17. [ ] Navigate to Drive — refresh
18. [ ] **Verify**: Paywall reappears on Drive
19. [ ] **Verify**: Cancellation removes pro access from ALL four apps (single subscription controls all)

---

## Test 11: Persistence Across Sessions

**Setup**: Pro user.

1. [ ] On Gmail: Set dark mode to ON with **Nord** preset
2. [ ] On Sheets: Set dark mode to ON with **Catppuccin Mocha** preset, enable "Preserve Grid Colors"
3. [ ] On Docs: Set dark mode to ON with **Rose Pine** preset
4. [ ] On Drive: Set dark mode to ON with **Monokai** preset
5. [ ] Close ALL Google tabs and close the Chrome window
6. [ ] Reopen Chrome
7. [ ] Open Gmail — **Verify**: Dark mode is active with Nord preset
8. [ ] Open Sheets — **Verify**: Dark mode is active with Catppuccin Mocha preset, Preserve Grid Colors is still ON
9. [ ] Open Docs — **Verify**: Dark mode is active with Rose Pine preset
10. [ ] Open Drive — **Verify**: Dark mode is active with Monokai preset
11. [ ] Open Gmail in a different Chrome window — **Verify**: Same settings (chrome.storage.sync)
12. [ ] Open Sheets in a different Chrome window — **Verify**: Same settings
13. [ ] Open Docs in a different Chrome window — **Verify**: Same settings
14. [ ] Open Drive in a different Chrome window — **Verify**: Same settings

---

## Test 12: Conflict Detection

**Setup**: Install a standalone Darkly extension alongside Darkly Suite.

### Standalone Gmail Darkly + Suite

1. [ ] Install Darkly for Gmail (standalone) alongside Darkly Suite
2. [ ] Open `mail.google.com`
3. [ ] **Verify**: Only ONE extension activates (first to load claims the page via `data-darkly-active` attribute on `<html>`)
4. [ ] Open DevTools Console
5. [ ] **Verify**: The second extension logs: `[Darkly] Page already claimed by "...". "..." will not inject its theme to avoid conflicts.`
6. [ ] **Verify**: No visual artifacts, double-inversion, or flickering
7. [ ] **Verify**: No duplicate settings panels or toolbar buttons
8. [ ] Open Sheets — **Verify**: Darkly Suite works normally (no standalone Sheets extension to conflict with)
9. [ ] Open Docs — **Verify**: Darkly Suite works normally

### Standalone Sheets Darkly + Suite

10. [ ] Uninstall Gmail Darkly, install Sheets Darkly (standalone) alongside Darkly Suite
11. [ ] Open `docs.google.com/spreadsheets` and open a spreadsheet
12. [ ] **Verify**: Only ONE extension activates on Sheets
13. [ ] **Verify**: Console shows conflict warning for the second extension
14. [ ] Open Gmail — **Verify**: Darkly Suite works normally
15. [ ] Open Docs — **Verify**: Darkly Suite works normally

### Standalone Docs Darkly + Suite

16. [ ] Uninstall Sheets Darkly, install Docs Darkly (standalone) alongside Darkly Suite
17. [ ] Open `docs.google.com/document` and open a document
18. [ ] **Verify**: Only ONE extension activates on Docs
19. [ ] **Verify**: Console shows conflict warning for the second extension
20. [ ] Open Gmail — **Verify**: Darkly Suite works normally
21. [ ] Open Sheets — **Verify**: Darkly Suite works normally

### All Standalones + Suite

22. [ ] Install ALL three standalone extensions alongside Darkly Suite
23. [ ] Open Gmail — **Verify**: Only one extension activates, conflict logged
24. [ ] Open Sheets — **Verify**: Only one extension activates, conflict logged
25. [ ] Open Docs — **Verify**: Only one extension activates, conflict logged
26. [ ] **Verify**: No crashes, no console errors beyond the expected conflict warnings

### Cleanup

27. [ ] Uninstall all standalone extensions
28. [ ] Refresh Gmail, Sheets, Docs
29. [ ] **Verify**: Darkly Suite works alone on all three apps with no issues
30. [ ] **Verify**: `data-darkly-active` attribute is set to `ds-gmail`, `ds-sheets`, or `ds-docs` (respectively) on each page

---

## Test 13: Drive Dark Mode

**Setup**: Pro user with Darkly Suite installed.

### Basic Toggle

1. [ ] Navigate to `drive.google.com`
2. [ ] **Verify**: The page loads normally — no crashes, no broken UI
3. [ ] **Verify**: The Darkly settings icon (FAB) appears in the Drive header toolbar area (right-side of the global bar `#gb`)
4. [ ] Click the FAB icon
5. [ ] **Verify**: Settings modal opens
6. [ ] Toggle dark mode ON
7. [ ] **Verify**: Drive background goes dark — file list, sidebar, toolbar all themed
8. [ ] **Verify**: Transition is smooth (no flash of unstyled content)
9. [ ] Toggle dark mode OFF
10. [ ] **Verify**: Drive returns to normal light theme smoothly

### Drive UI Coverage

11. [ ] **File list** — Verify file/folder rows are themed with readable text
12. [ ] **Sidebar navigation** — My Drive, Shared with me, Recent, Starred, Trash — all themed
13. [ ] **Toolbar** — New button, search bar, view toggle, sort options all themed
14. [ ] **Header** — Google account menu, apps grid, notifications area themed
15. [ ] **Right-click context menus** — Right-click a file — verify context menu is readable
16. [ ] **File previews** — Click a file to preview — verify preview panel is themed
17. [ ] **Search results** — Use the search bar — verify results dropdown is themed

### Preservation

18. [ ] **File type icons** — Verify Google Docs, Sheets, Slides, PDF icons display in their original colors (re-inverted)
19. [ ] **Folder icons** — Verify folder icons show in their original colors
20. [ ] **Thumbnails** — Verify file thumbnails display in their original colors
21. [ ] **Profile avatars** — Verify user profile photos and avatars are not inverted

### Console Check

22. [ ] Open DevTools Console
23. [ ] **Verify**: Console shows `[Darkly Suite] Drive content script loaded (prefix: ds, storage: ds_drive_preferences)`
24. [ ] **Verify**: No JavaScript errors
25. [ ] **Verify**: `data-darkly-active` attribute is set to `ds-drive` on `<html>`

### Cross-Navigation

28. [ ] Navigate from Drive to a Sheets spreadsheet — **Verify**: Darkly Suite activates normally on Sheets
29. [ ] Navigate from Drive to a Docs document — **Verify**: Darkly Suite activates normally on Docs
30. [ ] **Verify**: Drive remains fully functional — file browsing, uploads, sharing all work normally

---

## Test 14: Edge Cases

### Multiple Simultaneous Tabs

- [ ] Open Gmail, Sheets, Docs, AND Drive in separate tabs simultaneously
- [ ] **Verify**: Dark mode works independently on each tab
- [ ] **Verify**: Changing settings on one tab does not break another
- [ ] Toggle dark mode on Gmail tab — **Verify**: Sheets, Docs, and Drive tabs are unaffected
- [ ] Open 2+ Gmail tabs — **Verify**: Dark mode state is consistent across both
- [ ] Open 2+ Sheets tabs — **Verify**: Dark mode state is consistent across both
- [ ] Open 2+ Docs tabs — **Verify**: Dark mode state is consistent across both
- [ ] Open 2+ Drive tabs — **Verify**: Dark mode state is consistent across both

### Extension Reload

- [ ] Go to `chrome://extensions`, click the refresh button on Darkly Suite
- [ ] Refresh Gmail tab — **Verify**: Settings persist, dark mode reactivates
- [ ] Refresh Sheets tab — **Verify**: Settings persist, dark mode reactivates
- [ ] Refresh Docs tab — **Verify**: Settings persist, dark mode reactivates
- [ ] Refresh Drive tab — **Verify**: Settings persist, dark mode reactivates
- [ ] **Verify**: The setup page does NOT reopen on reload (`onInstalled` fires only for `reason: install`, not `update`)

### Print/Export Skipping

- [ ] On Sheets: Open print preview (`Ctrl/Cmd+P` or File > Print) — **Verify**: Extension skips print/export views (content script checks for `/print` and `/export` in path)
- [ ] On Docs: Open print preview (File > Print) — **Verify**: Extension skips print/export/preview views (content script checks for `/print`, `/export`, `/preview` in path)

### Iframe Skipping

- [ ] On Sheets: **Verify** extension skips iframes (content script checks `window.self !== window.top`)
- [ ] On Docs: **Verify** extension skips iframes (content script checks `window.self !== window.top`)

### Performance

- [ ] Open a large spreadsheet (1000+ rows) on Sheets — **Verify**: No performance degradation, scrolling remains smooth
- [ ] Open a long document (50+ pages) on Docs — **Verify**: No performance degradation, scrolling remains smooth
- [ ] Open a busy Gmail inbox (100+ emails visible) — **Verify**: No lag or jank

### Collaborative Editing

- [ ] On Sheets: Have another user edit the same spreadsheet while dark mode is active — **Verify**: Other user's edits appear correctly, no visual glitches
- [ ] On Docs: Have another user edit the same document while dark mode is active — **Verify**: Collaboration cursors visible, dark mode unaffected

### Pageless Mode (Docs)

- [ ] On Docs: Start in paginated mode with dark mode on; switch to pageless (File > Page setup > Pageless)
- [ ] **Verify**: Dark mode adjusts without errors (pageless detection in plugin.ts)
- [ ] Switch back to paginated mode — **Verify**: Dark mode adjusts correctly

### Network / Offline

- [ ] Disconnect from the internet, refresh each Google app (Gmail, Sheets, Docs, Drive)
- [ ] **Verify**: Extension doesn't crash on any app
- [ ] **Verify**: Paid users with cached `ds_pro_cache` status still have dark mode on all four apps
- [ ] **Verify**: Free users see the paywall but no errors

### Google Account Switching

- [ ] Switch to a different Google account within the same Chrome profile
- [ ] **Verify**: Extension continues to work on all four apps
- [ ] **Verify**: Payment status is tied to the extension token, not the Google account

---

## Test 15: Background Service Worker

1. [ ] Open `chrome://extensions` and click "Service worker" link for Darkly Suite
2. [ ] **Verify**: Console shows `[Darkly Suite] Background service worker initialized (4 sites)`
3. [ ] **Verify**: No errors in the service worker console
4. [ ] **Verify**: Alarms are set up for all four sites (ds-gmail-schedule-check, ds-sheets-schedule-check, ds-docs-schedule-check, ds-drive-schedule-check) when using Schedule or Sunrise/Sunset mode
5. [ ] **Verify**: Messages from Gmail tabs route to the gmail site worker
6. [ ] **Verify**: Messages from Sheets tabs route to the sheets site worker
7. [ ] **Verify**: Messages from Docs tabs route to the docs site worker
8. [ ] **Verify**: Messages from Drive tabs route to the drive site worker

---

## Blocker Checklist

If ANY of these fail, do NOT submit to Chrome Web Store:

### Installation and Setup

- [ ] Extension installs without crashing any Google app (Gmail, Sheets, Docs)
- [ ] Setup page opens at `darklysuite.com/setup?product=suite` on first install
- [ ] Setup page does NOT reopen on extension update/reload

### Payment

- [ ] Paywall shows "Darkly Suite" branding (not standalone product names)
- [ ] Paywall shows correct pricing (Monthly/Yearly/Lifetime)
- [ ] Paywall blocks dark mode for free users on ALL four apps
- [ ] Normal payment flow completes successfully
- [ ] Promo code payment flow completes successfully
- [ ] ONE subscription unlocks ALL four apps
- [ ] Cancellation revokes access on ALL four apps
- [ ] `darklysuite.com/api/status/{uuid-v4-token}?product=suite` responds correctly

### Dark Mode — Gmail

- [ ] Dark mode activates and deactivates smoothly on Gmail
- [ ] Inbox, email threads, compose, settings page all themed
- [ ] Images and emoji are re-inverted to show original colors
- [ ] InboxSDK toolbar button and sidebar panel work

### Dark Mode — Sheets

- [ ] Dark mode activates and deactivates smoothly on Sheets
- [ ] Grid cells, formula bar, sheet tabs, toolbar all themed
- [ ] Preserve Grid Colors toggle works (including frozen panes)
- [ ] Color picker swatches show accurate colors
- [ ] Chart re-inversion works

### Dark Mode — Docs

- [ ] Dark mode activates and deactivates smoothly on Docs
- [ ] Kix canvas, toolbar, ruler, document outline all themed
- [ ] Collaboration cursors stay visible and correctly colored
- [ ] Images and embedded content re-invert to show original colors
- [ ] Color picker swatches show accurate colors
- [ ] Comment threads are re-inverted correctly
- [ ] Paginated and pageless modes both work
- [ ] `color-scheme: light` is forced (no conflict with Google's native dark mode)

### Cross-App

- [ ] Per-site preferences are independent (ds_gmail_preferences, ds_sheets_preferences, ds_docs_preferences, ds_drive_preferences)
- [ ] Shared payment token works across all apps (ds_token, ds_pro_cache)
- [ ] Settings persist across browser restarts on all four apps
- [ ] Dashboard pages work on Sheets, Docs, and Drive (FAB icon injected)

### Conflict Detection

- [ ] Conflict detection works with standalone Gmail Darkly
- [ ] Conflict detection works with standalone Sheets Darkly
- [ ] Conflict detection works with standalone Docs Darkly
- [ ] No double-injection, no duplicate UI elements, no visual artifacts

### Dark Mode — Drive

- [ ] Dark mode activates and deactivates smoothly on Drive
- [ ] File list, sidebar, toolbar, header all themed
- [ ] File type icons and thumbnails are re-inverted to show original colors
- [ ] Profile avatars are preserved (not inverted)
- [ ] FAB settings icon appears in header toolbar
- [ ] Drive remains fully functional with dark mode active

### General

- [ ] No console errors on any app (except expected conflict warnings)
- [ ] No performance degradation on large documents/spreadsheets/inboxes/Drive folders
- [ ] Print/export views are skipped (no inversion on print preview)
- [ ] Iframes are skipped (no double-inversion)
- [ ] `darklysuite.com/privacy` is accessible
- [ ] Privacy: only expected network requests (`darklysuite.com/api` and `api.sunrise-sunset.org`)
- [ ] Extension permissions match manifest: `storage`, `alarms`, `offscreen`, `scripting`
- [ ] Host permissions limited to: `mail.google.com`, `docs.google.com/spreadsheets`, `docs.google.com/document`, `drive.google.com`, `darklysuite.com`, `api.sunrise-sunset.org`

---

## Dependencies

These must be resolved before running the full test plan:

- Stripe prices must be configured for suite product (monthly/yearly/lifetime)
- Promo code `CWSREVIEWSUITE2026` must be created in Stripe dashboard
- `darklysuite.com` must be deployed with working API and privacy page
