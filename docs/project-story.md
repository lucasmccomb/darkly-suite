# Building Darkly Suite: Project Story

<!-- Living document -- updated after notable PRs. See ~/.claude/CLAUDE.md for conventions. -->

## Origin: Gmail Darkly

The project started on February 10, 2026, with a single question: why does Gmail still not have a proper dark mode? Google's implementation was half-hearted at best -- a thin veneer that left the compose window, search results, chat panels, and dozens of other surfaces blindingly white. The answer became Darkly for Gmail, a Chrome extension that would apply an intelligent, comprehensive dark mode to every corner of Gmail's interface.

The initial build was ambitious in scope and velocity. Forty-five issues were created upfront, organized into six epics: scaffolding, theme engine, InboxSDK integration, services, testing, and a full landing page. Four parallel agents worked simultaneously across independent git clones, each assigned to a different epic. Agent-0 handled orchestration and scaffolding (PR #46, +6,238 lines). Agent-1 built the theme engine and CSS overrides (PR #48, +1,018 lines). Agent-2 built the InboxSDK React UI layer (PR #49, +1,194 lines), then services and integration wiring (PR #47, +517 lines). A fourth agent constructed the entire landing page (PR #50, +5,178 lines). By the end of that first session, 18 PRs had been merged, all 45 issues were closed, and the extension was building, linting, and passing 29 tests.

The tech stack was chosen for the Chrome extension ecosystem's realities. Webpack handled bundling because Chrome MV3 extensions need precise control over entry points -- content scripts, background service workers, offscreen documents, and page-world scripts each have different runtime constraints. InboxSDK provided the integration layer for Gmail's proprietary DOM, handling sidebar panels, toolbar buttons, and keyboard shortcuts through a stable API rather than fragile DOM selectors. React powered the settings UI, giving the extension a polished panel that lived inside Gmail's sidebar. TypeScript enforced type safety across the boundary between Chrome APIs, InboxSDK callbacks, and React components.

The initial payment system used ExtensionPay, a third-party service that charges a 5% fee on every transaction. It worked for a proof of concept, but the fee structure and limited control made it a stopgap. Within the same week (February 12), three agents replaced it entirely: one built the Cloudflare Pages Functions backend with D1 database (PR #76, 39 tests), another replaced the extension-side client (PR #75, 13 tests), and the third handled Stripe product/price configuration. The new system used raw `fetch` calls to Stripe's API -- no SDK, because Cloudflare Workers' runtime cannot use the Stripe Node.js SDK. Webhook signature verification was implemented with `crypto.subtle` HMAC-SHA256, the Web Crypto API that Workers do support.

One detail captures the scale of the CSS challenge: the initial `gmail-overrides.css` file contained approximately 600 lines of manual overrides targeting Gmail's obfuscated class names -- classes like `.gb_*`, `.at`, `.av`, `.qj`, `.a3s` that Google rotates without warning.

## The CSS Deep Polish and Its Limits

After the initial build, a deep polish pass added 12 new CSS sections (PR #51): search results, suggestion dropdowns, filter chips, label and snooze picker popups, Chat/Spaces/Meet panels, compose formatting toolbars, thread action buttons, calendar invitation cards, inline label chips, loading states, the full settings page, attachment previews, scrollbar styling, and a Solarized contrast fix where the link color needed brightening from `#88c0d0` to `#8ec5d4` to meet WCAG AA requirements.

But the fundamental fragility of targeting obfuscated classes was becoming clear. Every Gmail update could silently break any number of selectors. The `gb_*` header selectors were particularly unstable -- six specific class selectors had to be replaced with two broad wildcards (`header *` and `[role="banner"] *`) just to survive a single rotation (PR #138). Sidebar icons, label colors, the Gmail wordmark, and the compose button each needed their own targeted fixes as dark mode revealed elements that Google's CSS had never been designed to display on dark backgrounds.

The user's frustration with the incremental approach -- fix one element, discover another broken one, fix that, repeat -- led to a pivotal architectural decision on February 14. After researching InboxSDK's theming capabilities, Dark Reader's approach, and pure CSS strategies, the project adopted a filter-based inversion model: `filter: invert(1) hue-rotate(180deg)` applied to `<body>`. This single rule turned the entire page dark. The 1,080 lines of manual CSS overrides were replaced with 88 lines of insertion and 1,041 lines of deletion.

The re-inversion pattern handled the obvious problem: images, videos, canvas elements, and iframes all need to be inverted back to their original appearance. Each media element gets `filter: invert(1) hue-rotate(180deg)` to cancel out the body's filter. But one edge case proved particularly tricky: the Google account picker modal is a cross-origin iframe from `accounts.google.com`. CSS cannot penetrate inside cross-origin iframes -- the `img` re-inversion rules simply do not apply. The solution was to re-invert the entire `<iframe>` element, restoring all its content to original colors in one sweep (PR #245).

Another subtle issue: Gmail renders its "show details" caret as CSS borders on a transparent `cleardot.gif` spacer image. The blanket image re-inversion rule restored the original dark borders -- dark on dark, invisible. The fix was `filter: none` on that specific element, keeping it inverted along with the page so its borders appeared light on dark (PR #241).

## From One Extension to Three

With Gmail Darkly feature-complete, attention turned to Google's other productivity apps. Sheets Darkly was built on February 14 in a single session with four parallel agents. The plan followed the same epic structure: scaffold, port core modules, build UI and toolbar integration, implement payment backend, create landing page, and polish for launch prep. Seven PRs were merged (#66-#72), covering all 50 agent issues, and the extension shipped with 156 tests (116 extension + 40 landing page backend).

Docs Darkly followed the next day, February 15. Again, four agents working in parallel produced 12 merged PRs. The session completed 50 of 67 issues (the remaining 17 were human-action items like domain purchases and store submissions). The test suite reached 128 tests across 5 suites. Four merge conflicts were resolved during the session, all from overlapping work in Phase 1 where agents' branches touched the same storage type definitions.

The key technical differences between the extensions were instructive. Gmail used InboxSDK for all DOM integration -- toolbar buttons, sidebar panels, keyboard shortcuts. Sheets and Docs had no such luxury. They required custom DOM injection: finding the toolbar container via stable CSS selectors (`.docs-revisions-appbarbutton-container` for Docs, specific Waffle grid elements for Sheets), inserting a branded button, and watching for Google's SPA navigation to tear down and rebuild the toolbar via MutationObserver with debounced re-injection.

Sheets had a unique challenge with its Waffle grid rendering engine. The grid canvas needed special handling -- a "Preserve Grid Colors" toggle that selectively re-inverted grid cells to maintain colored cell backgrounds in dark mode. Docs had its own variant: the Kix canvas rendering engine for the document surface, plus considerations for collaboration cursors, comments, and pageless mode. Each extension got a product-specific settings section for these unique controls.

But the duplication was becoming untenable. Three separate repositories, each with its own copy of the theme engine, preference storage, payment client, settings UI, background worker, and landing page. A bug fix in the payment webhook handler meant making the same change in three places. CSS improvements to the settings panel required three separate PRs. The shared code was drifting apart as each extension evolved independently.

## The Monorepo Decision

The decision to consolidate came from a simple observation: the three extensions shared roughly 80% of their code, but maintaining three copies meant every improvement had a 3x cost. On February 16, a detailed plan was written covering 61 issues across 11 epics and 7 phases. The pnpm workspace format was chosen for its strict dependency isolation -- each package declares exactly what it depends on, and pnpm's content-addressable store avoids the phantom dependency problems that plague npm and yarn workspaces.

"Parameterize" was the operative word. Every module that had been hardcoded with `gd_` (Gmail prefix) or `sd_` (Sheets prefix) or `dd_` (Docs prefix) needed to accept a `ProductConfig` object instead. The `ThemeEngine` constructor took a config. The `createPreferencesManager` factory took a storage key. The `createPaymentClient` factory took an API base URL and token key. The `createBackgroundWorker` factory took alarm names and tab URL patterns. Nothing could assume it knew which product it was running inside.

Day 1 of the monorepo build (February 16) was the most intensive parallel development session of the entire project. Four agents worked simultaneously on independent worktrees:

- **Agent-0** (orchestrator): Scaffolded the entire monorepo structure (PR #62), then ported `@darkly/core` -- the theme engine, storage, payment, geo, background worker, content script framework, inject modules, UI components, and styles. The core package alone was 2,681 lines across 31 files in its second commit.
- **Agent-1**: Built all three site-specific packages (`@darkly/site-gmail`, `@darkly/site-sheets`, `@darkly/site-docs`) and the three individual extension packages, each as a thin wiring layer (PRs #64, 20+26 files).
- **Agent-2**: Created the build tools (`darkly-prefix-loader.js`, `webpack.factory.js`), the Darkly Suite bundle extension with conflict detection, and the CI pipeline (PR #63). Then ported 153 tests adapted for the parameterized core (PR #70).
- **Agent-3**: Built the entire landing page with payment APIs, admin portal, D1 schema, and marketing pages (PR #65, 54 files across 4 commits).

All four Phase 1-4 PRs were squash-merged by 12:42 PM. Phase 5-6 PRs (#66-#71) followed: D1 migration scripts, conflict detection wiring, API base updates, per-site preference resolution, test porting, and per-site settings sections. By session end, main had 11 commits and the monorepo was functional.

The archived standalone repos -- `gmail-darkly`, `sheets-darkly`, `docs-darkly` -- now serve as reference implementations only. Their READMEs were updated to point developers to the monorepo, and active development ceased entirely.

## The Prefix System: Three Resolution Strategies

The prefix system is the architectural heart of the monorepo. Every CSS class, every data attribute, every storage key, and every DOM element ID needs a product-specific prefix to prevent collisions when multiple Darkly extensions are installed simultaneously. The challenge was that prefixes need to be resolved in three fundamentally different contexts, each with different constraints.

**Strategy 1: CSS build-time transformation.** CSS files are static -- they cannot read runtime configuration. The solution was a webpack loader (`darkly-prefix-loader.js`) that transforms canonical `.darkly-*` class names to `.{prefix}-*` at build time. The core package writes all CSS using `.darkly-settings-toggle`, `--darkly-bg-primary`, and `data-darkly-theme`. When webpack builds the Gmail extension, the loader replaces every instance with `gd-settings-toggle`, `--gd-bg-primary`, and `data-gd-theme`. The transformation also runs in CopyPlugin's `transform` function for CSS files that are copied directly rather than bundled. Build output is verified: the Gmail extension uses `gd-` everywhere, Sheets uses `sd-`, Docs uses `dd-`, and the bundle uses `ds-`.

**Strategy 2: React runtime context.** React components cannot use build-time transformation because they render dynamically. Instead, a `DarklyProvider` context wraps the component tree, and a `usePrefix()` hook returns the current product's prefix. Components call `usePrefix()` to construct class names: `${prefix}-settings-toggle`. This required careful attention at the InboxSDK boundary -- InboxSDK creates isolated DOM containers without access to the parent React tree, so every InboxSDK render island (toolbar dropdown, sidebar panel) needs its own `DarklyProvider` wrapping.

**Strategy 3: Non-React TypeScript injection.** Background service workers and content scripts do not have React or DOM context. They receive a `ProductConfig` object at construction time and use `config.prefix` directly when constructing storage keys, alarm names, and message types. The `createBackgroundWorker(config)` factory, the `createContentScript(config, plugin)` factory, and every other non-React module follow this pattern.

Three strategies exist because CSS is static, React is dynamic, and background scripts have neither DOM nor React. Each strategy was chosen to match the constraints of its execution context, and together they enable complete code sharing without prefix collisions.

## The Payment System Journey

The payment system evolved through three distinct architectures in nine days, each driven by concrete limitations of its predecessor.

**V1: ExtensionPay** (February 10-12). The initial implementation used ExtensionPay, a hosted payment service for Chrome extensions. Integration was trivial -- a single npm package, a few API calls, and payments worked. But ExtensionPay charged a 5% fee on top of Stripe's standard 2.9% + $0.30, and offered limited control over the checkout experience, customer portal, and webhook handling. For a product planning to offer $0.99/month subscriptions, a 5% fee on an already-thin margin was unacceptable.

**V2: Custom Stripe on Cloudflare** (February 12-13). Three agents replaced ExtensionPay in a single session. The backend ran as Cloudflare Pages Functions with a D1 SQLite database. The critical implementation detail was that Cloudflare Workers cannot use the Stripe Node.js SDK -- Workers run in a V8 isolate, not Node.js, and the SDK depends on Node-specific APIs. All Stripe interactions use raw `fetch` calls to `api.stripe.com`. Webhook signature verification implements HMAC-SHA256 using the Web Crypto API (`crypto.subtle.importKey`, `crypto.subtle.sign`), comparing the computed signature against Stripe's `Stripe-Signature` header with timing-tolerant comparison and multi-signature support.

**V3: Unified multi-product backend** (February 16, monorepo day). The three separate payment backends (one per extension domain) were consolidated into a single backend at `darklysuite.com/api`. The D1 schema gained a `product` column on the licenses table with a `UNIQUE(token, product)` constraint. The status endpoint uses `WHERE product IN (?, 'suite')` with `ORDER BY` preference to check both the specific product and any suite-level license. Old domain proxy workers forward requests from `gmaildarkly.com/api/*` to `darklysuite.com/api/*` with injected product parameters, maintaining backward compatibility for existing installations.

Later refinements added rate limiting (PR #181): a D1-based sliding window rate limiter on the status endpoint, 10 requests per 60 seconds per IP, returning a 429 with `Retry-After` header. The response shape was normalized so not-found tokens return `{paid:false, plan:null, product:null, expiresAt:null}` -- identical structure to found responses, eliminating a token enumeration side channel. CORS was hardened (PR #133) from accepting any `chrome-extension://` origin to validating against an allowlist of known extension IDs via `ALLOWED_EXTENSION_IDS` environment variable with precise regex matching.

The discount code system went through its own evolution. An admin portal (PR #113 in gmail-darkly) was built with Google OAuth, session management via HttpOnly cookies with 24-hour TTL, and a full CRUD interface for discount codes. A Resend email integration was built for sharing codes (PR #149), but was immediately abandoned when the free tier turned out to be limited to one domain and the $20/month Pro plan was overkill for an unproven product. The replacement: a simple copy-to-clipboard share text modal (PR #157).

The discount system had a subtler bug that took three rounds of debugging to surface (PR #368). The admin panel's "Product Scope" dropdown stored the product in promotion code metadata, but metadata is cosmetic -- Stripe doesn't enforce it at checkout. Any promo code worked on any product. The actual enforcement mechanism is `applies_to.products` on the *coupon* object (not the promotion code), and it's immutable after creation. The fix added `STRIPE_PRODUCT_*` env vars alongside the existing `STRIPE_PRICE_*` vars, wired `getProductStripeId()` into coupon creation, and made the admin panel's edit modal read-only since product scope can't be changed post-creation.

Pricing settled at: individual extensions $0.99/month, $9.99/year, $29.99 lifetime; the bundle at $2.99/month, $29.99/year, $49.99 lifetime. Twelve Stripe prices (4 products times 3 plans) are mapped through a `getPriceId()` registry.

## The Build System

The build system needed to solve a specific problem: four Chrome extensions sharing the same source code but producing four distinct bundles with different prefixes, manifests, and entry points. The solution was a webpack factory function, `createDarklyWebpackConfig()`, that accepts a product configuration and returns a complete webpack config.

The factory handles the common patterns: `ts-loader` with `transpileOnly: true` (type-checking is separated into `pnpm -r type-check` for speed), the CSS prefix loader chain, CopyPlugin with `transform` for static CSS files, resolve aliases for cross-package imports (necessary because pnpm's symlink resolution and webpack's module resolution sometimes clash), and DefinePlugin for compile-time constants (`__DEV_MODE__`, `__PRODUCT_ID__`).

The `clean: true` flag in webpack's output configuration created a recurring trap. Production builds (`pnpm -r build`) set `__DEV_MODE__=false`, which enables the Stripe payment gate -- `isPro()` actually checks the backend instead of short-circuiting to `true`. When an agent ran `pnpm -r build` for verification, it overwrote `dist/` with production output. The user then tested the extension in Chrome and hit the paywall. This happened multiple times before it was codified as a rule in the project's CLAUDE.md: always use `pnpm dev:{product}` for Chrome testing, and always re-run dev mode after any production build.

The Darkly Suite bundle needed a custom webpack config because the factory was not flexible enough. The bundle has content scripts for three different Google sites, each with its own CSS files, plus a unified background worker, pageWorld script, and offscreen document. The manifest declares three separate content script entries, each with its own `matches` pattern and `css` array. The CopyPlugin configuration copies and transforms CSS from three different site packages, each getting the `ds-` prefix.

## InboxSDK: Silent Failures and Hard Lessons

Gmail's integration through InboxSDK required three specific files in the Chrome MV3 extension, and the absence of any one of them produced no error, no warning, and no visible feedback -- just silent failure. The background service worker must `import '@inboxsdk/core/background.js'`. The `pageWorld.js` file must be a webpack entry point AND listed in the manifest's `web_accessible_resources`. The content script must call `InboxSDK.load()` with a valid app ID.

Discovering this three-file requirement was painful. The InboxSDK background handler uses `chrome.scripting.registerContentScripts()` to inject the page-world script dynamically. This means the `scripting` permission is required in the manifest -- a fact that was initially flagged as unnecessary during a compliance audit, then confirmed required after tracing through InboxSDK's source code (PR #124 audit session).

The most expensive InboxSDK-related mistake happened on February 17. A new feature branch was created from `origin/main` without checking open PRs. PR #96, which added the complete bundle CSS pipeline -- CopyPlugin patterns, manifest CSS entries, pageWorld configuration, and offscreen document setup -- had not yet been merged. The new branch was missing all of this infrastructure. Running `pnpm dev:suite` on the incomplete branch invoked webpack with `clean: true`, which wiped the `dist/` directory and rebuilt without any CSS files. Hours were spent debugging missing CSS, unstyled UI, and a missing `pageWorld.js` before the root cause was identified. This incident was codified as a global workflow rule: always run `gh pr list --state open` before creating any new branch, and check whether the new work depends on any open PR.

## Conflict Detection

When a user installs both a standalone extension (e.g., Darkly for Gmail) and the Darkly Suite bundle, both extensions' content scripts will attempt to initialize on `mail.google.com`. Without coordination, they would both inject toolbar buttons, both apply theme CSS, and both register keyboard shortcuts -- a broken, doubled experience.

The solution is a DOM-based mutex using a `data-darkly-active` HTML attribute. The first extension to call `claimPage()` sets the attribute with its claim ID and wins control of the page. The second extension checks for the attribute, finds it already set, logs a warning, and exits silently. Claim IDs use a naming convention: standalone extensions use their prefix (`gd`, `sd`, `dd`) and the bundle uses a per-site pattern (`ds-gmail`, `ds-sheets`, `ds-docs`).

Twenty-one tests cover all six cross-extension conflict scenarios: `gd` vs `ds-gmail`, `sd` vs `ds-sheets`, `dd` vs `ds-docs`, and all three in the reverse direction. The tests verify first-wins semantics, owner-only release, reclaim after release, and console warning output (PR #186).

The `releasePage()` function exists for completeness but is rarely called in practice. Chrome's content script lifecycle means scripts run once on page load and are destroyed on navigation. The attribute persists on the `<html>` element for the lifetime of the page, which is exactly the desired behavior.

## Branding Exploration

### The Logo Journey

The logo development was one of the project's most iterative processes. The concept was established early: a lowercase "d" with a crescent moon as the counter-space (the enclosed opening in the letter), paired with dual sparkles that had a soft outer glow. Twenty SVG logo variants were built and displayed on a dedicated `/logo-design` page in the landing site (PR #115), with each variant refined through rounds of user feedback.

The gradients were context-aware: golden/yellow tones (`#f5c842` to `#d4941c`) on dark backgrounds, darker blue tones on light backgrounds. This was implemented via CSS custom properties that switched values based on background color detection. The winners from that exploration were V19 (standalone mark) and V20 (squircle container with gradient border).

A later exploration (February 16) investigated six uppercase "D" variants using real typeface glyph outlines extracted from system fonts: Times New Roman, Georgia, Big Caslon, Arial, Arial Narrow, and Arial Rounded (PR #250). The `opentype.js` library extracted font outlines programmatically, after which the dependency was removed -- the SVG paths were baked into the component. The crescent moon appeared as negative space inside the D's bowl, created via SVG mask (a black moon circle with a white bite circle subtracted). The offset-to-radius ratio of approximately 0.55 produced a consistent crescent proportion across all font geometries.

### The Name

The naming evolved through three phases. The original extension was simply "Gmail Darkly." When Sheets and Docs variants were added, the pattern became "[App] Darkly" -- Gmail Darkly, Sheets Darkly, Docs Darkly. But this read awkwardly in sentences and marketing copy. A 36-file rename (PR #97) changed every instance to "Darkly for [App]" -- Darkly for Gmail, Darkly for Sheets, Darkly for Docs. "Darkly Suite" named the bundle. The word "Darkly" itself was chosen to be evocative without being too clever -- it communicates the dark mode purpose while feeling like a proper product name rather than a description.

### The Wordmark

The V19 logo serves double duty as the "d" in "darkly," with the remaining letters spelled out in gradient text. The wordmark component was built as a reusable React component with em-based CSS sizing, so it scales automatically when placed in contexts with different font sizes. Thirteen instances across ten files were replaced in the rollout (PR #142). The wordmark is theme-aware: blue gradient in light mode, golden in dark mode, matching the logo's context-aware behavior.

The toolbar button uses the icon alone -- a golden brand mark without text, matching the convention of other Gmail toolbar extensions. The title text was removed entirely after iterations revealed that even hidden title text caused layout issues with InboxSDK's button container (PR #161).

## Marketing and Launch Thinking

### The 100K Price Drop Pledge

The core viral concept emerged from a brainstorming session (issue #235): a public commitment to drop the price to $0.99/month if the extension reaches 100,000 users. The mathematical pitch was designed to make the commitment credible -- at 100K users even at $0.99/month, the revenue would sustain development. For uncertain users considering a $2.99/month subscription, the pledge signals confidence in the product and creates an incentive to spread the word: every referral moves the counter closer to everyone's price dropping.

Additional mechanisms were explored: tiered milestones (price drops at 10K, 50K, 100K), referral credits toward subscription costs, founding member pricing locked in permanently, Chrome Web Store review exchange programs, and social proof challenges. The recommended launch-day bundle was the price drop pledge, founding member lock-in, CWS review prompts, and social proof sharing -- minimal implementation overhead for maximum viral potential.

### 9-Channel Campaign Per Product

Thirty-eight marketing issues were created (PR activity from agent-2 on February 18) covering four products across nine channels each: Product Hunt launch, Hacker News Show HN post, Reddit multi-subreddit campaign, LinkedIn multi-day content series, X/Twitter build-in-public thread, Dev.to and Indie Hackers launch posts, newsletter outreach to productivity bloggers, Chrome Web Store listing optimization, and a blog post. Each issue contained full draft copy, engagement strategies, and success metrics. Launch sequencing was planned as Product Hunt on D0 with channels staggered from D-7 (pre-launch teasers) through D+14 (follow-up content).

### Pricing Decisions

The pricing display on the landing page went through significant design iteration (PR #97). The final layout shows the Suite price first (highlighted as the recommended option), then individual app pricing with an icon selector that lets users switch between Gmail, Sheets, and Docs views. A comparison table shows what each plan includes. The CTA buttons use a golden gradient border effect implemented with the `mask-composite: exclude` pseudo-element technique -- a CSS trick that creates a gradient border with proper border-radius by using a gradient pseudo-element masked to only show through the border area.

## Testing: Zero to 328

Testing grew organically from zero on day one to 328 tests across two packages by February 18.

The standalone extension repos each had their own test suites: Gmail Darkly grew from 29 tests to 120 over its development lifetime (adding contrast validation, payment client tests, and gate logic tests). Sheets Darkly shipped with 156 tests (116 extension + 40 backend). Docs Darkly shipped with 128 tests across 5 suites, plus an additional 40 backend tests.

When the monorepo was created, the test porting effort (PR #70) adapted 153 tests from the gmail-darkly source. Every test that had used hardcoded `gd_` prefixes or `gmaildarkly.com` URLs was rewritten to inject a `ProductConfig` via the `createMockConfig()` helper. This ensured tests would pass regardless of which product was configured.

The most significant test addition came from the payment backend audit (PR #182): 149 new tests across 8 test files covering every backend function. The test infrastructure required its own solutions: a mock D1 database with `batch()` support (needed after rate limiting was added), a mock Cloudflare `EventContext` with the correct `data` type parameter (`Record<string, unknown>`, not `unknown`), webhook signature generation matching Stripe's HMAC-SHA256 scheme, and JWT creation for admin auth tests. The package's `"type": "module"` declaration meant the Jest config had to be `.cjs` to avoid ESM resolution issues.

Focus restoration tests (PR #100) added 5 tests verifying the WAI-ARIA focus trap exit pattern: modal focus restore, mini panel focus restore, escape key close behavior, and edge case handling when no element had focus before the panel opened.

Conflict detection tests (PR #186) added 21 tests covering the full cross-extension matrix. The final count: 179 tests in `@darkly/core` plus 149 tests in `@darkly/landing-shared`, for a total of 328.

## Multi-Agent Development

### The Parallel Pattern

The most distinctive aspect of this project's development was the systematic use of multiple AI agents working in parallel. Each session deployed up to four agents simultaneously, each running in its own independent git clone of the repository. The agents coordinated through a combination of GitHub issue labels (for claiming work), session log files (for cross-awareness), and strict branching discipline (each agent on its own feature branch from `origin/main`).

The productivity gains were substantial. A session that deployed four agents could accomplish in hours what sequential development might take days. The Gmail Darkly initial build -- scaffolding, theme engine, UI, services, landing page, tests, store listing, and production ZIP -- was completed in approximately six hours with four agents working simultaneously. Sheets Darkly's 50 agent issues were completed in a single evening session. Docs Darkly's 50 agent issues were completed the following evening.

### How It Worked on Day 1

The monorepo build on February 16 showcased the parallel pattern at its most effective:

- **Agent-0** served as orchestrator. It scaffolded the monorepo structure (pnpm workspace config, 9 package directories, shared tsconfig, eslint config, PR template) and then built the entire `@darkly/core` package -- the theme engine with parameterized `ProductConfig`, storage factories, payment client, geo module, background worker factory, content script factory, all inject modules, all React UI components, all CSS styles, and the offscreen document. Two commits totaling over 2,700 lines.

- **Agent-1** built all three site-specific packages (`site-gmail` with InboxSDK integration, `site-sheets` with Waffle grid injection, `site-docs` with Kix canvas injection) and all three individual extension packages as thin wiring layers. Twenty files for site packages, 26 files for extensions.

- **Agent-2** created the build tools (CSS prefix loader and webpack factory), the Darkly Suite bundle extension with multi-site content scripts and conflict detection, the CI pipeline, and then ported all 153 tests with parameterized config injection.

- **Agent-3** built the entire landing page: Vite + React Router scaffold, D1 schema with product-scoped licenses, Stripe API helpers, checkout/webhook/portal/status endpoints, Google OAuth admin flow, and 26 marketing/admin page files. Four commits across 54 files.

All four agents' PRs were merged within an hour of each other. Phase 5-6 work (migration scripts, conflict detection, per-site preferences, test porting, per-site settings) followed in the same session. By day's end, main had 11 commits and every package was building.

### Worktrees to Standalone Clones

The original parallel development approach used `git worktree` to create multiple working directories sharing a single `.git` directory. This worked but introduced interference: lock contention on the shared `.git/index.lock`, confusion about which worktree was on which branch, and occasional corruption when multiple agents ran git operations simultaneously.

On February 18, the setup migrated to four standalone clones (`darkly-suite-0` through `darkly-suite-3`), each a full independent clone of the repository. Complete isolation eliminated all the worktree-related issues. Each agent runs in its own clone directory with its own `.git` directory, its own `node_modules`, and its own build output.

### Session Logging

A centralized log repository (`lem-agent-logs`) contains per-project, per-date, per-agent markdown files. Each agent reads other agents' logs at session start for cross-awareness -- knowing what branch another agent is on, what issues they have claimed, and what PRs they have open prevents duplicate work and dependency conflicts.

Log updates are mandatory at five points: after every git commit, after creating a PR, after a PR merges, after closing an issue, and before context window compaction (the AI equivalent of "saving your game before a boss fight"). This discipline enables context continuity across sessions even when the agent's memory is compacted to fit within its context window.

## Chrome Web Store Preparation

A comprehensive 8-category compliance audit was run on February 18 with parallel agents covering security, dependencies, code quality, architecture, TypeScript/React patterns, testing coverage, documentation, and performance (PR #107).

The auto-fixes addressed several issues: a leftover merge conflict marker in CLAUDE.md, `detail` fields removed from API error responses (preventing information disclosure), a `dangerouslySetInnerHTML` usage in Hero.tsx replaced with safe JSX, lat/lng validation added to the background worker message handler, `content_security_policy` added to all four manifest.json files, `description` fields added to all nine package.json files, and three unused import warnings eliminated.

One finding deserves special mention: the `scripting` permission was initially flagged as potentially unnecessary, which would have been a problem for Chrome Web Store review (Google scrutinizes extensions that request powerful permissions without using them). Tracing through InboxSDK's background handler confirmed that InboxSDK v2+ actively uses `chrome.scripting.registerContentScripts()` to inject the `pageWorld.js` file at runtime. The permission was legitimately required. The `sunrise-sunset.org` API domain was also added to `host_permissions` across all four manifests (PR #124) for CWS review transparency -- declaring all external API endpoints the extension communicates with.

Chrome Web Store listing copy was prepared (PR #185) including descriptions, permission justifications, and privacy declarations. The listing positions each extension as an intelligent dark mode with time-aware scheduling, system theme detection, and sunrise/sunset automation -- differentiating from simple toggle-based dark mode extensions.

## Red Potassium: A CWS Rejection Lesson

Gmail Darkly was submitted to the Chrome Web Store on February 19 and received a "Red Potassium" rejection -- insufficient disclosure that the extension requires a paid subscription. The rejection was instructive: Google's reviewers cross-reference every text field in the submission (short description, detailed description, single purpose, distribution, privacy declarations, test instructions) and flag inconsistencies. Saying "premium features available" in one place but showing a full paywall in practice reads as deceptive.

Agent-0 fixed the Gmail listing across 11 PRs: adding an explicit SUBSCRIPTION section to the store description, changing the pricing field from "Free (premium features available)" to "Free to install (paid subscription required for all features)", updating the HOW IT WORKS section to mention subscribing before using features, and fixing the PII declaration from YES to NO (the primary verification mechanism is an anonymous device token, not email). Gmail was resubmitted as v1.0.1.

The harder lesson was forward-looking: Sheets and Docs store-assets were drafted before the rejection, meaning they contained the same non-compliant patterns. Rather than submit and get rejected again, the compliance fixes were ported proactively (PR #603 for Sheets). The most dangerous inconsistency was in Sheets' distribution.md, which claimed "Free tier includes basic dark mode toggle" -- a statement that was never true, since all features are gated behind payment. This was replaced with Gmail's explicit "No free tier" wording.

## Background Checkout Polling and MV3 Service Worker Realities

A subtle UX problem emerged after launching the payment system: users would complete Stripe checkout in a new tab, switch back to their Sheets tab, and see the paywall still there. In Gmail, a page refresh would trigger the `visibilitychange` listener that re-checked payment status. But in Sheets, Cmd+R doesn't do a full page reload -- Google intercepts it to refresh spreadsheet data. Worse, any other open tabs (Gmail, Docs) remained paywalled until each one individually triggered its own visibility check.

The solution was background checkout polling (PR #379). When a user clicks "Subscribe Now", the content script sends a `checkoutStarted` message to the background service worker, which starts a staggered polling schedule against the `/api/status` endpoint. The staggering uses two mechanisms: `setTimeout` chains for fast 5-second and 10-second intervals in the first five minutes, and `chrome.alarms` at 30-second intervals as a parallel safety net for up to one hour.

The dual-mechanism approach was driven by MV3 service worker lifecycle constraints. Research into Chrome's documented behavior revealed that Chrome 110 removed the hard five-minute maximum lifetime for extension service workers -- the idle timeout is now purely 30 seconds, reset by any extension API call. This means `setTimeout` chains that call `chrome.storage` on each tick will keep the worker alive indefinitely. But `setTimeout` doesn't survive unexpected worker termination (memory pressure, Chrome updates), while `chrome.alarms` does. Running both in parallel gives fast detection during the critical first minutes plus guaranteed coverage for the long tail.

The implementation piggybacks entirely on existing infrastructure: `isPro()` already writes to `chrome.storage.local` when it detects a paid status, and all content scripts already listen on `chrome.storage.local.onChanged` via `onPaymentStatusChange`. The poller just calls `isPro()` periodically from the background -- the storage-event broadcast mechanism handles notifying every open tab simultaneously.

## The Token Handoff Problem

A subtle bug lurked in the checkout flow from the beginning: when a user who already had the extension installed visited the landing page directly (not through the extension's install redirect), the landing page generated a throwaway `crypto.randomUUID()` for the Stripe checkout. The resulting license stored this throwaway token in D1, but the extension's `/api/status/{token}` check used the extension's real token from `chrome.storage.sync`. The tokens didn't match, so the extension never recognized the purchase.

The bug only manifested in one of three checkout paths. Path 1 (extension paywall → Google OAuth → Stripe) always used the correct token because the extension initiated the flow. Path 2 (post-install redirect to `/subscribe?token=X`) worked because the URL parameter carried the real token. But Path 3 (user navigates to darklysuite.com independently, clicks a pricing button) had no way to know the extension's token. The `getOrCreateToken()` function's fallback chain — URL param, sessionStorage, fresh UUID — never consulted the extension.

The initial plan proposed a content script approach: inject a content script on `darklysuite.com` that reads the token from `chrome.storage.sync` and sets it as a `data-darkly-token` attribute on `<html>`, where the landing page JavaScript could read it. The user challenged this from a CWS policy, privacy, and security perspective, triggering a research phase that changed the entire approach.

Two findings killed the content script plan. First, Grammarly's CVE-2018-6654 was the canonical example of the exact anti-pattern — exposing authentication tokens in DOM attributes meant any script on the page (analytics, ads, XSS payloads) could read them. Second, Chrome Web Store's minimum permissions principle explicitly discourages content scripts on your own website when `externally_connectable` exists as a lower-privilege alternative. Using content scripts where `externally_connectable` suffices would likely trigger CWS reviewer scrutiny.

The revised approach used Chrome's `externally_connectable` API — a manifest declaration (not a permission) that allows specific websites to message the extension via `chrome.runtime.sendMessage(extensionId, ...)`. Each extension's manifest gained a three-line declaration: `"externally_connectable": { "matches": ["https://darklysuite.com/*"] }`. The background worker gained an `onMessageExternal` listener that responds to `{ type: 'getToken' }` messages by reading `chrome.storage.sync` and returning the token. Chrome enforces the domain restriction at the browser level — no JavaScript on any other domain can send these messages.

On the landing page side, a `useExtensionToken()` React hook runs detection on component mount (~50ms), attempting to message each known extension ID. The detection tries the product-specific extension first, then falls back to the Suite extension. The result feeds into `getOrCreateToken()` as priority 2, between URL params and sessionStorage. If no extension responds (not installed, different browser, placeholder extension ID), the existing throwaway-token behavior kicks in — no regression for new visitors.

The extension IDs present an interesting bootstrap problem. Chrome Web Store assigns stable IDs on first publication, but the extensions haven't been published yet. The solution was placeholder IDs that cause `chrome.runtime.sendMessage()` to fail silently — the same behavior as if no extension were installed. Real IDs get filled in as each extension is published. In development, `isPro()` returns `true` regardless, so token matching is irrelevant for testing.

## The License Architecture Refactor

The license table started as a mirror of Stripe's subscription lifecycle. Four status values -- `active`, `cancelled`, `expired`, `past_due` -- mapped one-to-one from Stripe webhook events. The admin panel displayed these statuses, and deleting a license was the only way to cancel a subscription. This created three problems: stale data (if a webhook failed, D1 and Stripe disagreed silently), coupled operations (canceling a subscription required destroying the license), and limited visibility (the admin panel showed only D1's cached data, never querying Stripe for the live truth).

The refactor (PR #424, February 21) simplified the D1 `status` column to a binary access gate: `active` or `inactive`. The extension's hot path only needs to know one thing -- can this user access the product? The detailed subscription lifecycle (why is it inactive? when does the billing period end? is it set to cancel at period end?) belongs in Stripe, and Stripe is the authoritative source. The admin panel now queries Stripe's API directly when an admin opens a license detail view, showing live subscription status, billing period, plan amount, and customer information alongside the D1 license data.

The separation of concerns was the key design win. Four independent admin actions replaced the single "delete" button: cancel subscription at period end (soft cancel -- user keeps access until billing period ends, Stripe sends webhook at period end to flip D1 to inactive), cancel immediately (hard cancel -- Stripe cancellation plus immediate D1 status change), revoke access (D1-only -- doesn't touch Stripe, for manual admin overrides), and grant access (D1-only -- for comp licenses or fixing webhook sync issues). An admin can now cancel a subscription without destroying the license record, or revoke access without touching the Stripe subscription.

The payment failure handling was a deliberate product decision: `past_due` immediately revokes access (no grace period) and sends the user an email via Resend asking them to update their payment method, with a link to the account portal. The aggressive approach was chosen because the product is low-cost -- a failed $0.99 payment is more likely a dead card than a temporary funding issue, and the email gives users a clear path to restore access.

## Deployment Pipeline: Three Paths to Production

Landing pages deploy through three independent paths, a redundancy discovered through operational experience rather than upfront design.

**Path 1: Cloudflare git integration.** Cloudflare Pages connects directly to the GitHub repository and automatically builds on every push to `main`. This is the zero-configuration path -- it was set up when the project first deployed to Cloudflare Pages. But Cloudflare's remote build environment occasionally fails for reasons unrelated to the code: dependency resolution timeouts, build container issues, or transient infrastructure problems. These failures are intermittent and unpredictable -- the same commit that fails an automatic build will succeed on retry.

**Path 2: GitHub Actions (`deploy-landing.yml`).** A custom workflow runs `pnpm build` in a GitHub Actions runner, then calls `wrangler pages deploy` to push the built output to Cloudflare. This path uses change detection to only deploy pages whose source files changed (or when `landing-shared` changes, which triggers both). It was added as the primary deployment mechanism because it offered change detection and manual dispatch support.

**Path 3: Manual `wrangler pages deploy` from local build.** When both automatic paths fail, a developer can push a pre-built `dist/` directory directly to Cloudflare's CDN in under 30 seconds. This path was discovered on February 21 when a PR merge triggered a Cloudflare build failure. Rather than waiting for a retry or investigating the remote build environment, `npx wrangler pages deploy dist --project-name=darkly-suite --branch=main` uploaded the already-verified local build directly. The deployment succeeded instantly.

The three-path architecture emerged organically: Path 1 was the default, Path 2 was added for better control, and Path 3 was discovered as an emergency fallback that turned out to be the fastest and most reliable option. For a small team, having three independent deployment mechanisms means a build environment issue never blocks a production deploy.

## Subscription Health: From Binary to Nuanced

The original payment system tracked a single `status` field on each license: `active` or `inactive`. When Stripe reported a failed payment (`invoice.payment_failed`), the webhook immediately set the license to `inactive`, which triggered the paywall on the user's next cache miss. This created a harsh user experience: a single failed charge (expired card, insufficient funds) locked the user out of the extension entirely, with no way to reach the "Manage Subscription" button because the paywall replaced the settings panel.

PR #578 introduced `stripe_status` as a separate column tracking the Stripe subscription's health independently from the license's active/inactive state. The key behavioral change: `past_due` subscriptions now keep the license `active` during Stripe's automatic retry window (typically 3-4 attempts over ~3 weeks), showing a warning banner instead of revoking access. Similarly, `cancel_at_period_end` -- when a user has canceled but their billing period hasn't ended -- shows a different banner encouraging renewal. The warning banners thread through all six layers of the data pipeline: D1 schema → API endpoint → PaymentClient → chrome.storage cache → content script → React settings panel, appearing above the "Manage Subscription" button in amber (canceling) or red (past due) with dark mode variants.

## What's Next

The project stands at 379 tests, four buildable extensions, four deployed landing pages (darklysuite.com, gmaildarkly.com, sheetsdarkly.com, docsdarkly.com), and a unified payment backend with granular subscription status tracking and live Stripe data enrichment. Gmail Darkly has been submitted to the Chrome Web Store (v1.0.1, post-Red Potassium resubmission). Sheets Darkly store-assets are compliance-ready; submission awaits screenshots and the final CWS upload. Docs follows after Sheets. Thirty-eight marketing issues are drafted and ready for execution across nine channels per product. Feature development continues with filter-parameter presets for advanced theming (issue #138), an admin financial dashboard with revenue and churn analytics (7 issues under `epic:admin-dashboard`), and payment flow end-to-end testing (issue #43).
