# Consolidating to a Single Darkly Suite Extension with Per-App Plans

> **Status**: Proposal / Planning
> **Created**: 2026-03-04
> **Issue**: #646

## Executive Summary

Today we publish 4 separate Chrome extensions (Darkly for Gmail, Darkly for Sheets, Darkly for Docs, Darkly Suite bundle) and manage 4 CWS listings, 4 review cycles, and 4 update pipelines. This document evaluates consolidating to **a single published extension** (Darkly Suite) with **tiered pricing**: single-app access or full-access.

The core Darkly Suite bundle already exists and is fully functional. This is not about building something new - it's about promoting the bundle as the only published extension and restructuring pricing so users can buy access to one app or all apps within that single extension.

---

## Current Architecture (What Exists Today)

### Extensions

| Extension | CWS Listing | CSS Prefix | Token Key | Product ID |
|-----------|-------------|------------|-----------|------------|
| Darkly for Gmail | Separate listing | `gd` | `gd_token` | `gmail` |
| Darkly for Sheets | Separate listing | `sd` | `sd_token` | `sheets` |
| Darkly for Docs | Separate listing | `dd` | `dd_token` | `docs` |
| Darkly Suite | Separate listing | `ds` | `ds_token` | `suite` |

### Pricing (Stripe)

5 products x 3 plans = 15 Stripe price IDs. Individual apps and the suite each have their own Stripe product with monthly/yearly/lifetime prices.

| Product | Monthly | Yearly | Lifetime |
|---------|---------|--------|----------|
| Individual (Gmail/Sheets/Docs) | $0.99 | $5.99 | $9.99 |
| Suite | $1.99 | $9.99 | $19.99 |

### Licensing

- Each extension generates a UUID v4 token on first install, stored in `chrome.storage.sync`
- Token is the primary user identity (no account required to purchase)
- D1 `licenses` table has a `UNIQUE(token, product)` constraint
- `/api/status/{token}?product={productId}` checks for a matching license OR a `suite` license:
  ```sql
  WHERE token = ? AND product IN (?, 'suite') AND status = 'active'
  ```
- `isPro()` is binary: paid or not. No per-feature or per-site granularity.
- `canUseFeature()` simply returns the `proStatus` boolean regardless of feature name.

### How the Suite Bundle Works

The bundle is a first-class design, not a hack:
- **4 separate content scripts** (one per site: Gmail, Sheets, Docs, Drive) declared in `manifest.json`
- **Unified `ds` CSS prefix** for all UI components, with per-site storage keys (`ds_gmail_preferences`, `ds_sheets_preferences`, etc.)
- **Single background service worker** that routes messages by sender tab URL
- **Single token** (`ds_token`) and **single pro cache** (`ds_pro_cache`) shared across all sites
- Content scripts are identical in behavior to standalone extensions - the only difference is which `ProductConfig` is injected

---

## Proposed Model: Single Extension, Tiered Access

### The Concept

Publish only the Darkly Suite extension. Users install one extension and choose their pricing tier:

| Tier | What It Unlocks | Pricing |
|------|----------------|---------|
| **Single App** | One specific Google app (Gmail OR Sheets OR Docs) | Individual pricing ($0.99/$5.99/$9.99) |
| **Full Access** | All Google apps (Gmail + Sheets + Docs + Drive) | Suite pricing ($1.99/$9.99/$19.99) |

### Key Behavioral Change

Today, when a user buys "Darkly for Gmail", they get an extension that only runs on Gmail. Under the new model, the user installs one extension that runs on all sites, but **only the purchased site(s) are unlocked**. Unpurchased sites show the paywall.

This naturally creates an upsell path: a Gmail-only user visits Google Sheets and sees "Unlock dark mode for Sheets" with upgrade options.

---

## Implementation Plan

### Phase 1: Per-Site Feature Gating (Core Change)

**Goal**: Make `isPro()` site-aware so the suite extension can unlock individual sites independently.

#### 1a. Extend the Status API

The `/api/status/{token}` endpoint currently returns a single `paid` boolean. It needs to return **per-site access information**.

**Option A - Multiple API calls** (simplest, no API change):
Each content script already calls `/api/status/{token}?product={productId}`. Under the new model, the suite's Gmail content script would call with `product=gmail` instead of `product=suite`. The existing SQL query already handles this:
```sql
WHERE token = ? AND product IN (?, 'suite') AND status = 'active'
```
A `gmail` license OR a `suite` license both satisfy the query. This means **the API needs zero changes** for the basic flow.

**Option B - Single API call returning all access** (better performance):
Add a new endpoint or query parameter that returns all products a token has access to:
```
GET /api/status/{token}?mode=all
```
Response:
```json
{
  "access": {
    "gmail": { "paid": true, "plan": "yearly" },
    "sheets": { "paid": false },
    "docs": { "paid": false }
  },
  "suiteAccess": false
}
```
This avoids 3-4 separate API calls on every page load but requires a new endpoint.

**Recommendation**: Start with **Option A** because it requires zero API changes. Optimize to Option B later if performance is a concern (each call is already fast with D1).

#### 1b. Make the Suite Content Scripts Site-Aware

Currently, each suite content script (`content-gmail.ts`, `content-sheets.ts`, etc.) uses the suite-level `ProductConfig` which has `productId: 'suite'`. This means `isPro()` checks for a `suite` license.

**Change**: Each content script should check for **its specific site license** in addition to a suite license. Two approaches:

**Approach 1 - Per-site ProductConfig override** (minimal code change):
In `darkly-suite/src/darkly.config.ts`, modify `getSiteConfig()` to override `productId` per site:

```typescript
export function getSiteConfig(siteId: SiteId): ProductConfig {
  const site = siteConfigs[siteId];
  return {
    ...config,
    productId: siteId as ProductId,  // 'gmail' instead of 'suite'
    storageKey: site.storageKey,
    alarmName: site.alarmName,
    tabUrlPattern: site.tabUrlPattern,
    forceColorSchemeLight: siteId === 'docs' || siteId === 'drive',
  };
}
```

Now the Gmail content script calls `/api/status/{token}?product=gmail`, and the existing SQL handles the rest. A `gmail` license grants access. A `suite` license also grants access (because of `IN (?, 'suite')`).

**Caveat**: Token and pro cache are currently shared (`ds_token`, `ds_pro_cache`). With per-site `productId`, each site would need its **own pro cache key** (e.g., `ds_gmail_pro_cache`) to cache its individual access result. Otherwise a cached "paid" from Gmail would incorrectly apply to Sheets.

**Approach 2 - Multi-site payment client** (more complex but cleaner long-term):
Create a new `createMultiSitePaymentClient()` that checks access per site and maintains per-site caches.

**Recommendation**: Start with **Approach 1** (per-site ProductConfig override with per-site pro cache keys). It's the smallest diff and leverages the existing status API.

#### 1c. Per-Site Pro Cache

Add a `proCacheKey` per site in `siteConfigs`:

```typescript
export const siteConfigs: Record<SiteId, SiteConfigEntry> = {
  gmail: {
    siteId: 'gmail',
    storageKey: 'ds_gmail_preferences',
    proCacheKey: 'ds_gmail_pro_cache',  // NEW
    alarmName: 'ds-gmail-schedule-check',
    tabUrlPattern: 'https://mail.google.com/*',
  },
  // ... same for sheets, docs, drive
};
```

Each content script caches its own paid/unpaid status independently. A user who bought Gmail sees "paid" on Gmail tabs and "unpaid" on Sheets tabs.

#### 1d. Update the Paywall Component

The `Paywall` component (`core/src/ui/Paywall.tsx`) currently shows either individual plans or suite plans based on `config.productId`. With the new model:

- **Unpaid user on Gmail**: Show individual Gmail pricing AND a "Get all apps" upsell to the suite tier
- **Gmail-paid user on Sheets**: Show "Unlock Sheets" at individual pricing AND a "Upgrade to full access" option
- **Suite user**: No paywall on any site

The paywall needs to know the user's **current access level** across all sites to show the right messaging. This could be passed via the `ProductConfig` or fetched at render time.

### Phase 2: Checkout Flow Updates

#### 2a. Per-Site Checkout from the Suite Extension

When a user clicks "Subscribe" on the Gmail paywall within the suite extension, the checkout flow should create a license with `product = 'gmail'` (not `product = 'suite'`).

Since `getSiteConfig()` now returns `productId: 'gmail'` for the Gmail content script, `openPaymentPage()` already sends the correct `product` parameter. **No change needed** in the checkout flow itself.

#### 2b. Suite Upgrade Path

Add a "Get All Apps" or "Upgrade to Full Access" button in the paywall and settings panel. When clicked:
- If user has no existing license: create a `product = 'suite'` checkout
- If user has a single-app license: need to handle upgrade (see Phase 2c)

#### 2c. Upgrade / Downgrade Logic

When a single-app user upgrades to suite:

**Option A - New subscription**: Create a separate `suite` license. Both the individual and suite licenses coexist. The status API already prioritizes the specific product match over suite, so this works. The user now has two Stripe subscriptions, which is messy but functional.

**Option B - Subscription modification**: Use Stripe's subscription update API to change the price from the individual product to the suite product. Update the D1 license's `product` from `gmail` to `suite`. This is cleaner but requires careful Stripe proration handling.

**Option C - Cancel + resubscribe**: Cancel the individual subscription at period end, create a new suite subscription. Simple but creates a gap or overlap depending on timing.

**Recommendation**: **Option A** for initial launch (simplest, no Stripe edge cases). Optimize later with proper subscription upgrades if churn/support load justifies it.

### Phase 3: Landing Page & Marketing

#### 3a. darklysuite.com Pricing Update

The landing page pricing section needs to present the new tiered model:
- "Choose your app" selector (Gmail / Sheets / Docs)
- Individual pricing for the selected app
- "Or get everything" suite pricing
- Single "Install from Chrome Web Store" button for all tiers

#### 3b. Product-Specific Landing Pages

`gmaildarkly.com`, `sheetsdarkly.com`, etc. currently each link to their own CWS listing. Options:
- **Keep them**: Redirect CWS install link to the Darkly Suite listing. Keep the pages for SEO.
- **Sunset them**: Redirect entirely to `darklysuite.com/gmail`, `darklysuite.com/sheets`, etc.
- **Hybrid**: Keep the domains, but have them render the same marketing content from `landing-shared` with product-specific context.

**Recommendation**: Keep the domains for SEO but redirect CWS links to the single Darkly Suite listing. This preserves search traffic while funneling installs to one extension.

#### 3c. Success Page

The post-checkout success page (`/success`) should indicate what the user purchased:
- "Dark mode is now active for Gmail" (single app)
- "Dark mode is now active for Gmail, Sheets, Docs, and Drive" (suite)

### Phase 4: Existing User Migration

#### 4a. Standalone Extension Users

Users who installed the standalone Gmail/Sheets/Docs extension need a migration path:

1. **CWS deprecation notice**: Update the standalone extension with a banner: "This extension is being replaced by Darkly Suite. Install Darkly Suite to continue receiving updates."
2. **License portability**: Already works - when a standalone Gmail user installs the suite, they use "Restore Purchase" with Google login. The status API finds their `gmail` license by email and associates it with the new `ds_token`.
3. **Settings migration**: Add a one-time migration in the suite's `onInstalled` handler that reads old storage keys (`gd_preferences` -> `ds_gmail_preferences`, etc.) if the user previously had a standalone extension installed.

#### 4b. Existing Suite Users

No change needed. Existing suite licenses continue to grant full access.

#### 4c. Timeline

- **Phase 1**: Ship per-site gating in the suite extension (all existing users unaffected)
- **Phase 2**: Update checkout flow and landing pages
- **Phase 3**: Update standalone extensions with deprecation notice
- **Phase 4**: After 3-6 months, unlist standalone extensions from CWS (existing installs continue to work but receive no updates)

---

## Tradeoffs

### Advantages

| Benefit | Impact |
|---------|--------|
| **One CWS listing** | No more 4x submissions, 4x screenshot sets, 4x review cycles |
| **Simpler codebase** | Drop 3 extension packages, webpack configs, manifests |
| **Built-in upsell** | User visits Sheets -> sees "Unlock dark mode for Sheets" in-app |
| **One update cycle** | Push one extension update instead of four |
| **No conflict detection** | Standalone-vs-bundle collision scenarios eliminated |
| **Simpler landing pages** | Could consolidate marketing to darklysuite.com |

### Disadvantages

| Concern | Severity | Mitigation |
|---------|----------|------------|
| **Broader permissions** | Medium | Suite manifest requests host access to all Google apps. Users who only want Gmail might hesitate. CWS reviewers may scrutinize. |
| **Larger install size** | Low | Bundle includes all content scripts (~200-300KB extra). Negligible for users. |
| **CWS discoverability** | Medium | Losing 3 separate listings reduces search surface. "Gmail dark mode" searches find a dedicated Gmail extension more easily. Mitigate with SEO on product-specific landing pages. |
| **CWS review risk** | Low-Medium | Google may question host permissions for sites without active features. Clear CWS description + justification should handle this. |
| **Existing user disruption** | Medium | Standalone users must install a new extension. "Restore Purchase" flow handles license transfer. Settings migration needed. |
| **Per-site caching complexity** | Low | Pro cache becomes per-site instead of per-extension. Small code change but adds entries to `chrome.storage.local`. |

---

## Technical Debt Reduction

Consolidation eliminates the following from the codebase:

- `packages/gmail-darkly/` - standalone Gmail extension (webpack config, manifest, entry points, config)
- `packages/sheets-darkly/` - standalone Sheets extension
- `packages/docs-darkly/` - standalone Docs extension
- 3 sets of CWS listing metadata (screenshots, descriptions, etc.)
- Conflict detection logic (`claimPage()` collision between standalone + bundle)
- 9 Stripe price IDs for individual products (keep only suite prices, or repurpose for single-app tier)
- `landing-gmail/` package (gmaildarkly.com marketing site) - can be simplified to a redirect

**Retained**:
- `packages/darkly-suite/` - the single published extension
- `packages/core/` - shared engine, payment, UI
- `packages/site-gmail/`, `packages/site-sheets/`, `packages/site-docs/` - site-specific plugins (still needed by the suite)
- `packages/landing-suite/` - darklysuite.com
- `packages/landing-shared/` - API backend

---

## Open Questions

1. **Drive pricing**: Drive is currently included free in the suite bundle. With single-app plans, is Drive a purchasable product or always bundled with the suite tier?

2. **Browse Darkly**: This is a separate product with different architecture. Does it remain independent or fold into the suite? (Likely remains independent since it's fundamentally different - all-URL dark mode vs. Google app-specific.)

3. **Upgrade proration**: When a Gmail-only user upgrades to suite, should Stripe prorate the remaining individual subscription? Option A (parallel subscriptions) avoids this complexity but means the user pays for both until the individual sub expires.

4. **CWS listing timing**: Should the standalone extensions be deprecated immediately or maintained in parallel for a transition period? A transition period is safer but means maintaining 4 listings during the overlap.

5. **Existing individual Stripe products**: Keep the existing Gmail/Sheets/Docs Stripe products for single-app purchases within the suite, or create new "Single App" prices under the suite Stripe product? Keeping existing products means the backend code barely changes.

---

## Effort Estimate

| Phase | Scope | Effort |
|-------|-------|--------|
| Phase 1: Per-site gating | `darkly.config.ts`, `client.ts`, `Paywall.tsx` | 2-3 days |
| Phase 2: Checkout flow | `checkout.ts`, landing page pricing UI | 1-2 days |
| Phase 3: Landing pages | `landing-suite/`, product landing redirects | 1-2 days |
| Phase 4: Migration | Standalone deprecation notice, settings migration, CWS updates | 1-2 days |
| **Total** | | **5-9 days** |

Phase 1 is the only code-intensive phase. Phases 2-4 are mostly configuration, copy, and CWS admin tasks.
