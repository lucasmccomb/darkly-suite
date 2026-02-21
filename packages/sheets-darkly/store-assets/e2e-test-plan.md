# E2E Test Plan: Sheets Darkly — Fresh Install → Payment → Configuration

Run this checklist before Chrome Web Store submission.
Use a **fresh Google account** and a **production build** (`pnpm --filter sheets-darkly build`).

---

## Prerequisites

Before starting, verify these are live:

- [ ] **darklysuite.com** — Payment API deployed on Cloudflare Pages with D1 + Stripe bindings
- [ ] **darklysuite.com/api/status/00000000-0000-4000-8000-000000000000?product=sheets** — Returns `{"paid":false}` (not a 500 or DNS error). Token must be a valid UUID v4.
- [ ] **sheetsdarkly.com/privacy** — Privacy policy page is accessible
- [ ] **Stripe test mode** — Products and prices configured for sheets (monthly/yearly/lifetime)
- [ ] **Promo code** — `CWSREVIEWSHEETS2026` (or equivalent test code) created in Stripe dashboard
- [ ] **Production zip** — Built from latest main: `pnpm --filter sheets-darkly build`, then zip `dist/`

---

## Test 1: Fresh Install (No Payment)

**Setup**: Use a Chrome profile signed into the fresh Google account. No previous Darkly extension installed.

1. [ ] Load the extension as unpacked from the production `dist/` directory
2. [ ] **Verify**: Browser opens `sheetsdarkly.com/setup` in a new tab
3. [ ] **Verify**: The setup page loads correctly (not a DNS error)
4. [ ] Navigate to `docs.google.com/spreadsheets` and open any spreadsheet
5. [ ] **Verify**: Google Sheets loads normally (no crashes, no console errors)
6. [ ] **Verify**: The Darkly toolbar button appears in the Sheets header bar
7. [ ] **Verify**: The Darkly sidebar icon appears in the right sidebar (companion app strip)
8. [ ] Click the Darkly toolbar button
9. [ ] **Verify**: Dark mode does NOT activate (free user, paywall blocks it)
10. [ ] **Verify**: A paywall/upgrade prompt appears showing "Darkly for Sheets" (NOT "for Gmail")
11. [ ] Check the browser console (Right-click > Inspect > Console tab)
12. [ ] **Verify**: No errors (warnings about Pro status check are OK if the API is unreachable)

**Expected behavior for free users**: The toolbar button, sidebar icon, and paywall should be visible, but dark mode functionality should be gated behind payment. The paywall should show an "Upgrade" or "Subscribe Now" option.

---

## Test 2: Upgrade Flow (Stripe Checkout — Normal Payment)

**Setup**: Continue from Test 1 (extension installed, free user on Sheets).

1. [ ] In the paywall, click "Subscribe Now" (or equivalent payment button)
2. [ ] **Verify**: A new tab opens to `darklysuite.com/api/checkout?token=...&plan=yearly&product=sheets`
3. [ ] **Verify**: You're redirected to Stripe Checkout (stripe.com hosted page)
4. [ ] **Verify**: The checkout page shows the correct product ("Darkly for Sheets") and price
5. [ ] Complete payment using Stripe test card: `4242 4242 4242 4242`, any future expiry, any CVC, any zip
6. [ ] **Verify**: After payment, you're redirected to a success/thank-you page
7. [ ] Return to the Sheets tab
8. [ ] **Verify**: Within 30 minutes (cache TTL), or after closing and reopening the spreadsheet, dark mode becomes available
   - To speed this up: clear the extension's local storage for the `sd_pro_cache` key, then refresh Sheets

**Note**: The payment flow is: Extension → darklysuite.com/api/checkout → Stripe hosted checkout → Stripe webhook → D1 license record → Extension checks /api/status and gets `paid: true`.

---

## Test 3: Upgrade Flow (With Promo Code)

**Setup**: Fresh install (or clear extension storage to simulate a new free user).

1. [ ] Click "Subscribe Now" in the paywall
2. [ ] **Verify**: New tab opens to Stripe Checkout
3. [ ] At Stripe Checkout, locate the promo code field
4. [ ] Enter `CWSREVIEWSHEETS2026` (or the configured test code)
5. [ ] **Verify**: Discount is applied (100% off if configured as such)
6. [ ] Complete checkout with test card `4242 4242 4242 4242` (still required for `duration:once` coupons)
7. [ ] **Verify**: Redirected to success page
8. [ ] Return to Sheets tab and refresh (or clear `sd_pro_cache`)
9. [ ] **Verify**: License is created, dark mode unlocks

---

## Test 4: Pro User — Dark Mode Toggle

**Setup**: Continue from Test 2 or 3 (paid user on Sheets).

1. [ ] Click the Darkly toolbar button
2. [ ] **Verify**: Mini panel shows with On/Off toggle
3. [ ] Toggle dark mode ON
4. [ ] **Verify**: Spreadsheet background goes dark
5. [ ] **Verify**: Formula bar is styled correctly
6. [ ] **Verify**: Toolbar and menu bar are styled
7. [ ] **Verify**: Right sidebar is styled
8. [ ] **Verify**: Sheet tabs at the bottom are styled
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
5. [ ] Switch to **Light** mode
6. [ ] **Verify**: Light theme is restored (default appearance)
7. [ ] Switch to **System** mode
8. [ ] **Verify**: Dark mode matches your macOS appearance setting (System Preferences > Appearance)
9. [ ] Toggle macOS appearance (dark ↔ light)
10. [ ] **Verify**: Sheets theme updates to match
11. [ ] Switch to **Schedule** mode
12. [ ] **Verify**: Time pickers appear for start/end times
13. [ ] Set a schedule that should currently be active (e.g., dark from 6 PM to 6 AM if testing in evening)
14. [ ] **Verify**: Dark mode activates/deactivates according to the schedule
15. [ ] Switch to **Sunrise/Sunset** mode
16. [ ] **Verify**: Browser shows a geolocation permission prompt
17. [ ] Allow location access
18. [ ] **Verify**: Sunrise and sunset times are displayed
19. [ ] **Verify**: Dark mode activates/deactivates based on whether it's currently before/after sunset

### Preserve Grid Colors Toggle (Sheets-Unique)

20. [ ] Locate the "Preserve Grid Colors" toggle in settings
21. [ ] Toggle OFF: **Verify** everything inverts including the spreadsheet grid and cell backgrounds
22. [ ] Toggle ON: **Verify** spreadsheet grid/cells stay in original light colors while the rest of the UI remains dark
23. [ ] Edit some cells — **Verify** the preserved colors look correct during editing

### Theme Presets

24. [ ] Test each theme preset and verify the UI updates accordingly:
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
2. [ ] Close the Sheets tab completely
3. [ ] Open a new tab and navigate to any spreadsheet on `docs.google.com/spreadsheets`
4. [ ] **Verify**: Dark mode is still active with the same preset (preferences persisted)
5. [ ] Open a spreadsheet in a different Chrome window
6. [ ] **Verify**: Dark mode is active with the same preset there too (chrome.storage.sync)

---

## Test 8: Sheets UI Coverage

**Setup**: Pro user with dark mode ON.

Test dark mode appearance across all Sheets UI elements:

- [ ] Cell editing (click a cell, type) — text and cell border visible
- [ ] Formula bar (active and inactive states)
- [ ] Frozen rows/columns — freeze pane dividers render correctly
- [ ] Sheet tabs (bottom bar) — tab names readable, active tab distinguishable
- [ ] Right-click context menus — all items readable with proper contrast
- [ ] Menus (File, Edit, View, Insert, Format, Data, Tools, Extensions, Help)
- [ ] Toolbars (formatting toolbar, function bar)
- [ ] Conditional formatting dialog
- [ ] Chart display and chart editor
- [ ] Filter views — filter icons and dropdown menus
- [ ] Comments/notes — comment bubbles and note popups
- [ ] Color picker swatches — should show accurate colors despite inversion
- [ ] Find and replace dialog (`Ctrl+H`)
- [ ] Insert menu items (images, charts, drawings, etc.)
- [ ] Data validation dialogs
- [ ] Named ranges dialog (`Data > Named ranges`)

---

## Test 9: Edge Cases

- [ ] **Multiple Sheets tabs**: Open 2+ spreadsheet tabs — verify dark mode state is consistent across all tabs
- [ ] **Sheet switching**: Switch between sheets within a spreadsheet (bottom tabs) — verify toolbar button persists (DOM observer triggers re-injection)
- [ ] **Print/export**: Open print preview (`Ctrl+P` or File > Print) — verify extension skips print/export views (no inversion on print preview)
- [ ] **Embedded sheets (iframes)**: Verify extension skips iframes and only applies to the main Sheets UI
- [ ] **Large spreadsheet**: Open a sheet with 1000+ rows — verify no performance degradation (scrolling remains smooth)
- [ ] **Extension reload**: Go to `chrome://extensions`, click the refresh button on Darkly for Sheets — refresh the Sheets page and verify settings persist
- [ ] **Setup page does NOT reopen on reload**: After extension reload, the setup page should NOT open again (`onInstalled` should only fire for `reason: install`, not `update`)
- [ ] **Network offline**: Disconnect from the internet, refresh Sheets — verify extension doesn't crash (dark mode may not activate for new unpaid users, but paid users with cached status should still work)

---

## Blocker Checklist

If ANY of these fail, do NOT submit to Chrome Web Store:

- [ ] Extension loads without crashing Google Sheets
- [ ] Paywall shows "Darkly for Sheets" (NOT "for Gmail")
- [ ] Paywall blocks features for free users
- [ ] Normal payment flow completes successfully
- [ ] Promo code payment flow completes successfully
- [ ] Dark mode activates for paid users
- [ ] Preserve Grid Colors toggle works
- [ ] Settings persist across sessions
- [ ] No console errors that would concern a Google reviewer
- [ ] `sheetsdarkly.com/privacy` is accessible
- [ ] `darklysuite.com/api/status/{uuid-v4-token}?product=sheets` responds correctly
- [ ] Color picker swatches show accurate colors in dark mode
