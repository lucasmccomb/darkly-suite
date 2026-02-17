# CLAUDE.md — Darkly Suite Monorepo

## Project Overview

Unified pnpm workspace monorepo that builds **4 Chrome extensions** (Gmail Darkly, Sheets Darkly, Docs Darkly, Darkly Suite bundle) from shared code, served by a **unified landing page and payment backend** at **darklysuite.com**.

## Quick Start

```bash
pnpm install                    # Install all dependencies
pnpm -r build                   # Build everything
pnpm dev:gmail                  # Dev mode for Gmail extension
pnpm dev:sheets                 # Dev mode for Sheets extension
pnpm dev:docs                   # Dev mode for Docs extension
pnpm dev:suite                  # Dev mode for Darkly Suite bundle
pnpm dev:landing                # Dev mode for landing page
```

## Pre-Push Verification

```bash
pnpm -r lint && pnpm -r type-check && pnpm -r test && pnpm -r build
```

All checks must pass before pushing. CI runs the same checks.

## Commands

| Command | Purpose |
|---------|---------|
| `pnpm -r lint` | Lint all packages |
| `pnpm -r type-check` | TypeScript check all packages |
| `pnpm -r test` | Run all tests |
| `pnpm -r build` | Build all packages |
| `pnpm dev:{product}` | Dev mode for specific extension |
| `pnpm clean` | Remove all dist/ directories |

## Package Structure

```
packages/
  core/                  @darkly/core — shared theme engine, storage, payment, UI
  site-gmail/            @darkly/site-gmail — Gmail-specific (InboxSDK, overrides)
  site-sheets/           @darkly/site-sheets — Sheets-specific (Waffle grid, overrides)
  site-docs/             @darkly/site-docs — Docs-specific (Kix canvas, overrides)
  gmail-darkly/          Individual Gmail extension
  sheets-darkly/         Individual Sheets extension
  docs-darkly/           Individual Docs extension
  darkly-suite/          Darkly Suite bundle extension
  landing/               darklysuite.com (Vite + React + Cloudflare Pages)
```

## Architecture: How Code Sharing Works

### The Prefix System

Each extension has a unique CSS prefix to prevent conflicts:

| Extension | Prefix | Example CSS class | Storage key |
|-----------|--------|-------------------|-------------|
| Gmail Darkly | `gd` | `.gd-settings-toggle` | `gd_preferences` |
| Sheets Darkly | `sd` | `.sd-settings-toggle` | `sd_preferences` |
| Docs Darkly | `dd` | `.dd-settings-toggle` | `dd_preferences` |
| Darkly Suite | `ds` | `.ds-settings-toggle` | `ds_gmail_preferences` |

### Three prefix resolution strategies:

1. **CSS files** → Build-time webpack loader transforms `darkly-*` → `{prefix}-*`
2. **React JSX** → Runtime `DarklyProvider` context + `usePrefix()` hook
3. **Non-React TS** → `ProductConfig` injection at construction

### Package dependencies:

```
gmail-darkly  ← @darkly/core + @darkly/site-gmail
sheets-darkly ← @darkly/core + @darkly/site-sheets
docs-darkly   ← @darkly/core + @darkly/site-docs
darkly-suite  ← @darkly/core + all three @darkly/site-* packages
```

### Bundle CSS strategy:

The bundle uses **per-site prefixes for theme CSS** (so override CSS works unchanged) and `ds-` only for UI components and storage keys.

## CRITICAL: Always Use Dev Mode

**Default to dev mode for ALL local development.** Only use production builds when explicitly requested.

`pnpm dev:{product}` enables `__DEV_MODE__=true` which:
- Bypasses Stripe payment gate (`isPro()` returns `true`)
- Runs in watch mode (auto-rebuilds on save)
- Outputs unminified code for easier debugging

**Start a dev server at the beginning of every session** for the extension being tested. Keep it running throughout the session.

### Why this is critical

`pnpm -r build` and `pnpm --filter {package} build` produce **production builds** with `__DEV_MODE__=false`. This enables the Stripe paywall, which fails locally ("Failed to fetch") and blocks all extension UI behind a "Subscribe Now" screen. **Never leave a production build in `dist/` when the user is testing locally.**

## CRITICAL: Auto-Build After Code Changes

**After making ANY code changes, automatically ensure `dist/` is up to date so the user can test in Chrome immediately.** Do not wait to be asked.

### Decision flow:

1. **Determine affected extension(s)** from the files changed:

| Changed package | Affected extensions | Dev command |
|-----------------|--------------------:|-------------|
| `core/` | ALL extensions | `pnpm dev:gmail` (or whichever the user is testing) |
| `site-gmail/` | `gmail-darkly`, `darkly-suite` | `pnpm dev:gmail` |
| `site-sheets/` | `sheets-darkly`, `darkly-suite` | `pnpm dev:sheets` |
| `site-docs/` | `docs-darkly`, `darkly-suite` | `pnpm dev:docs` |
| `gmail-darkly/` | `gmail-darkly` | `pnpm dev:gmail` |
| `sheets-darkly/` | `sheets-darkly` | `pnpm dev:sheets` |
| `docs-darkly/` | `docs-darkly` | `pnpm dev:docs` |
| `darkly-suite/` | `darkly-suite` | `pnpm dev:suite` |
| `landing/` | Landing page only | `pnpm dev:landing` |

2. **If a dev server is already running** (watch mode via `pnpm dev:{product}`): webpack watch handles rebuilds automatically — just tell the user to refresh the extension in `chrome://extensions`.

3. **If no dev server is running**: Start one with `pnpm dev:{product}` for the primary extension being tested.

4. **After build completes**: Tell the user to refresh the extension in `chrome://extensions` (or Cmd+R on the extensions page).

### Why this matters

Chrome extensions load from `dist/`. Source changes have ZERO effect until the extension is rebuilt AND refreshed in Chrome. Forgetting to rebuild wastes the user's time testing stale code.

## CRITICAL: Verify Before Committing

### During active development (dev server running)

Use the **lightweight check** — no build step, since the dev server already validates compilation:
```bash
pnpm -r lint && pnpm -r type-check && pnpm -r test
```

### Before committing / pushing

Run the **full verification suite** including production build:
```bash
pnpm -r lint && pnpm -r type-check && pnpm -r test && pnpm -r build
```

**IMPORTANT: `pnpm -r build` overwrites `dist/` with production builds (`__DEV_MODE__=false`).** After running the full suite, you MUST restart the dev server to restore the dev build:
```bash
pnpm dev:{product}   # Restores __DEV_MODE__=true in dist/
```

Fix any errors immediately. Never commit code that doesn't pass all checks.

## ThemeEngine Save Rules

- `engine.apply()` — visual only, NEVER saves to preferences
- `engine.applyPreset()` — visual only, NEVER saves to preferences
- `engine.toggle()` — saves mode to preferences (explicit user action)

## Chrome Extension Context Rules

- **Content scripts**: Have `chrome.runtime.sendMessage` but NOT `chrome.tabs`, `chrome.alarms`
- **Background service worker**: Has full Chrome API access
- To open a tab from content script: send `{ type: 'openTab', url }` to background

## Key Types

```typescript
type SiteId = 'gmail' | 'sheets' | 'docs';
type ProductId = 'gmail' | 'sheets' | 'docs' | 'suite';
type Plan = 'monthly' | 'yearly' | 'lifetime';

interface ProductConfig {
  productId: ProductId;
  prefix: string;           // 'gd' | 'sd' | 'dd' | 'ds'
  storageKey: string;        // 'gd_preferences' | 'ds_gmail_preferences'
  tokenKey: string;          // 'gd_token' | 'ds_token'
  apiBase: string;           // 'https://darklysuite.com/api'
  // ... see @darkly/core/src/config.ts for full interface
}
```

## Landing Page

```bash
cd packages/landing
pnpm dev                                    # Local development
npx wrangler pages dev dist --d1=DB         # Test with D1 locally
```

## Payment System

- Single Stripe account with 4 products × 3 plans = 12 prices
- Checkout flow: Extension → darklysuite.com/api/checkout → Stripe → webhook → D1 license
- Suite license automatically grants access to individual product queries

## Conflict Detection

When both a standalone extension and the bundle are installed:
- `data-darkly-active` attribute on `<html>` prevents double-injection
- First extension to load claims the page
- Second extension logs a warning and exits

## Environment Variables (Cloudflare Pages)

See `packages/landing/wrangler.toml` for binding configuration. Required vars:
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- 12× `STRIPE_PRICE_{PRODUCT}_{PLAN}` (e.g., `STRIPE_PRICE_GMAIL_YEARLY`)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
- `ADMIN_EMAIL`, `SESSION_SECRET`
- D1 binding: `DB`
