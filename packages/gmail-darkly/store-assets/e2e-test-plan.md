# E2E Test Plan: Gmail Darkly — Fresh Install → Payment → Configuration

Run this checklist before Chrome Web Store submission.
Use a **fresh Google account** and a **production build** (`pnpm --filter gmail-darkly build`).

---

## Prerequisites

Before starting, verify these are live:

- [ ] **darklysuite.com** — Payment API deployed on Cloudflare Pages with D1 + Stripe bindings
- [ ] **darklysuite.com/api/status/{any-token}?product=gmail** — Returns `{"paid":false}` (not a 500 or DNS error)
- [ ] **gmaildarkly.com** — Landing page live with working `/privacy` page
- [ ] **Stripe test mode** — Products and prices configured for gmail (monthly/yearly/lifetime)
- [ ] **Production zip** — Built from latest main: `pnpm --filter gmail-darkly build`, then zip `dist/`

---

## Test 1: Fresh Install (No Payment)

**Setup**: Use a Chrome profile signed into the fresh Google account. No previous Darkly extension installed.

1. [ ] Load the extension as unpacked from the production `dist/` directory
2. [ ] **Verify**: Browser opens `gmaildarkly.com/setup?product=gmail` in a new tab
3. [ ] **Verify**: The setup page loads correctly (not a DNS error)
4. [ ] Navigate to `mail.google.com`
5. [ ] **Verify**: Gmail loads normally (no crashes, no console errors)
6. [ ] **Verify**: The Darkly toolbar button appears in Gmail's toolbar area
7. [ ] Click the Darkly toolbar button
8. [ ] **Verify**: Dark mode does NOT activate (free user, paywall blocks it)
9. [ ] **Verify**: A settings panel or upgrade prompt appears
10. [ ] Check the browser console (Right-click > Inspect > Console tab)
11. [ ] **Verify**: No errors (warnings about Pro status check are OK if the API is unreachable)

**Expected behavior for free users**: The toolbar button and settings panel should be visible, but dark mode functionality should be gated behind payment. The settings panel should show an "Upgrade" option.

---

## Test 2: Upgrade Flow (Stripe Checkout)

**Setup**: Continue from Test 1 (extension installed, free user on Gmail).

1. [ ] In the settings panel, click "Upgrade" (or equivalent payment button)
2. [ ] **Verify**: A new tab opens to `darklysuite.com/api/checkout?token=...&plan=yearly&product=gmail`
3. [ ] **Verify**: You're redirected to Stripe Checkout (stripe.com hosted page)
4. [ ] **Verify**: The checkout page shows the correct product ("Darkly for Gmail") and price
5. [ ] Complete payment using Stripe test card: `4242 4242 4242 4242`, any future expiry, any CVC, any zip
6. [ ] **Verify**: After payment, you're redirected to a success/thank-you page
7. [ ] Return to the Gmail tab
8. [ ] **Verify**: Within 30 minutes (cache TTL), or after closing and reopening Gmail, dark mode becomes available
   - To speed this up: clear the extension's local storage for the `gd_pro_cache` key, then refresh Gmail

**Note**: The payment flow is: Extension → darklysuite.com/api/checkout → Stripe hosted checkout → Stripe webhook → D1 license record → Extension checks /api/status and gets `paid: true`.

---

## Test 3: Pro User — Dark Mode Toggle

**Setup**: Continue from Test 2 (paid user on Gmail).

1. [ ] Click the Darkly toolbar button
2. [ ] **Verify**: Dark mode activates — Gmail background turns dark, text turns light
3. [ ] **Verify**: No flash of unstyled content (smooth transition)
4. [ ] **Verify**: Email list items are styled correctly (readable text, proper contrast)
5. [ ] Click the toolbar button again
6. [ ] **Verify**: Dark mode deactivates — Gmail returns to normal light theme
7. [ ] **Verify**: Transition is smooth (no jarring flash)

---

## Test 4: Pro User — Settings Panel

**Setup**: Continue from Test 3.

1. [ ] Open the settings panel (click "All Settings" or equivalent in the toolbar dropdown)
2. [ ] **Verify**: Settings modal appears with mode options
3. [ ] Switch to **Schedule mode**
4. [ ] **Verify**: Time pickers appear for start/end times
5. [ ] Set a schedule that should currently be active (e.g., dark from 6 PM to 6 AM if testing in evening)
6. [ ] **Verify**: Dark mode activates according to the schedule
7. [ ] Switch to **OS sync mode**
8. [ ] **Verify**: Dark mode matches your macOS appearance setting (System Preferences > Appearance)
9. [ ] Switch macOS to the opposite mode (dark ↔ light)
10. [ ] **Verify**: Gmail theme updates to match
11. [ ] Switch to **Sunrise/sunset mode**
12. [ ] **Verify**: Browser shows a geolocation permission prompt
13. [ ] Allow location access
14. [ ] **Verify**: Dark mode activates/deactivates based on whether it's currently before/after sunset
15. [ ] Check the console for any errors during all mode switches

---

## Test 5: Pro User — Manage Subscription

**Setup**: Continue from Test 4.

1. [ ] In the settings panel, find the "Manage Subscription" link/button
2. [ ] **Verify**: A new tab opens to Stripe's customer portal
3. [ ] **Verify**: The portal shows the active subscription details
4. [ ] **Do NOT cancel** — just verify the portal loads correctly
5. [ ] Close the portal tab

---

## Test 6: Persistence Across Sessions

**Setup**: Continue from Test 5.

1. [ ] Set dark mode to ON (manual toggle)
2. [ ] Close the Gmail tab completely
3. [ ] Open a new tab and navigate to `mail.google.com`
4. [ ] **Verify**: Dark mode is still active (preferences persisted)
5. [ ] Open Gmail in a different Chrome window
6. [ ] **Verify**: Dark mode is active there too (chrome.storage.sync)

---

## Test 7: Extension Reload / Update Simulation

**Setup**: Continue from Test 6.

1. [ ] Go to `chrome://extensions`
2. [ ] Click the refresh button (circular arrow) on Darkly for Gmail
3. [ ] Return to Gmail tab and refresh the page
4. [ ] **Verify**: Dark mode is still active (preferences survived extension reload)
5. [ ] **Verify**: Pro status is still active (payment survived extension reload)
6. [ ] **Verify**: The setup page does NOT open again (onInstalled should only fire for `reason: install`, not `update`)

---

## Test 8: Gmail UI Coverage

**Setup**: Pro user with dark mode ON.

1. [ ] **Inbox view**: Verify email list, sidebar, top bar are all properly themed
2. [ ] **Open an email**: Click an email and verify the reading pane is themed
3. [ ] **Compose**: Click "Compose" and verify the compose window is themed
4. [ ] **Settings**: Click the gear icon > "See all settings" and verify Gmail's settings page is themed
5. [ ] **Search**: Use the search bar and verify search results/suggestions are themed
6. [ ] **Labels/folders**: Navigate to Starred, Sent, Drafts — verify sidebar navigation is themed
7. [ ] **Right-click menus**: Right-click on an email — verify context menus are readable
8. [ ] **Popovers**: Hover over sender names, attachment previews — verify popovers are themed
9. [ ] **Profile photo modal**: Click your profile photo (top right) — note if the modal/iframe has issues (known issue #137: inverted photo)

---

## Test 9: Edge Cases

1. [ ] **Multiple Gmail tabs**: Open Gmail in 2+ tabs — verify dark mode state is consistent across all tabs
2. [ ] **Gmail loading spinner**: Refresh Gmail — verify no white flash while Gmail loads
3. [ ] **Slow network**: Throttle network in DevTools (Slow 3G) — verify extension handles slow API response gracefully
4. [ ] **API down**: Disconnect network, refresh Gmail — verify extension doesn't crash (should fall back gracefully, dark mode may not activate for free users)

---

## Blocker Checklist

If any of these fail, do NOT submit to Chrome Web Store:

- [ ] Extension loads without crashing Gmail
- [ ] Paywall blocks features for free users
- [ ] Payment flow completes successfully (Stripe test mode)
- [ ] Dark mode activates for paid users
- [ ] Settings persist across sessions
- [ ] No console errors that would concern a Google reviewer
- [ ] `gmaildarkly.com/privacy` is accessible
- [ ] `darklysuite.com/api/status` endpoint responds correctly
