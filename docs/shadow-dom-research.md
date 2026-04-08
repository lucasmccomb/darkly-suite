# Shadow DOM, adoptedStyleSheets, and CSS Injection Research

> Research for Browse Darkly's dark mode engine architecture
> Date: 2026-02-22

---

## Table of Contents

1. [Shadow DOM Prevalence on Popular Sites](#1-shadow-dom-prevalence-on-popular-sites)
2. [adoptedStyleSheets Inside Shadow DOM](#2-adoptedstylesheets-inside-shadow-dom)
3. [Closed vs Open Shadow DOM](#3-closed-vs-open-shadow-dom)
4. [CSS Inheritance Through Shadow Boundaries](#4-css-inheritance-through-shadow-boundaries)
5. [MutationObserver for Shadow DOM](#5-mutationobserver-for-shadow-dom)
6. [Dark Reader's Shadow DOM Approach](#6-dark-readers-shadow-dom-approach)
7. [Performance at Scale](#7-performance-at-scale)
8. [CSS @layer Inside Shadow DOM](#8-css-layer-inside-shadow-dom)
9. [Recommendations for Browse Darkly](#9-recommendations-for-browse-darkly)

---

## 1. Shadow DOM Prevalence on Popular Sites

### Which Major Sites Use Shadow DOM?

Shadow DOM usage is growing rapidly, driven by Web Components adoption and frameworks like Polymer/Lit.

| Site | Shadow DOM Usage | Framework | Notes |
|------|-----------------|-----------|-------|
| **YouTube** | Heavy | Polymer (legacy) | All `ytd-*` custom elements (e.g., `ytd-watch-flexy`, `ytd-comment-renderer`, `ytd-video-renderer`). Hundreds of shadow roots per page. YouTube was an early Polymer adopter and uses Web Components for virtually every UI element. |
| **Reddit** | Heavy | Custom (shreddit) | As of December 2025, Reddit migrated to extensive Shadow DOM and Adopted Style Sheets usage. This migration broke Dark Reader (see Section 6). Reddit uses `shreddit-*` custom elements throughout. |
| **Google Search** | Moderate | Custom | Uses shadow DOM for some UI widgets and interactive components. |
| **Google Maps** | Moderate | Custom | Uses Web Components for various map controls and overlays. |
| **Twitter/X** | Minimal | React (no Shadow DOM) | Uses React with standard DOM. However, embedded tweet widgets use Shadow DOM for style isolation. |
| **GitHub** | Light | Catalyst (custom elements) | Uses custom elements (`<details-dialog>`, `<include-fragment>`, etc.) but most do NOT use Shadow DOM — they use "light DOM only" custom elements. |
| **Salesforce Lightning** | Heavy | LWC (Lightning Web Components) | All Lightning components use Shadow DOM for encapsulation. Enterprise apps built on this platform have hundreds of shadow roots. |
| **Adobe (Spectrum)** | Heavy | Spectrum Web Components | Adobe's design system uses Web Components with Shadow DOM. |

### Estimated Shadow Root Counts

Based on DOM analysis patterns reported by extension developers:

| Site | Estimated Shadow Roots | Impact Level |
|------|----------------------|--------------|
| YouTube (watch page) | 200-500+ | High |
| Reddit (front page) | 100-300+ | High |
| Salesforce Lightning app | 500-1000+ | Very High |
| Google Search results | 10-30 | Low |
| Twitter/X | 0-5 (embedded widgets only) | Negligible |
| GitHub | 0-10 (mostly light DOM) | Negligible |

### Trend: Growing Adoption

Web Components have matured from experimental to mainstream as of 2025-2026. Browser support is now universal. The `<template>` element with `shadowrootmode` attribute (Declarative Shadow DOM) shipped in all major browsers, enabling server-side rendering of Shadow DOM without JavaScript. This means Shadow DOM prevalence will continue to increase.

**Key takeaway for Browse Darkly**: Shadow DOM support is not optional. Any site-wide dark mode engine must handle shadow roots or it will break on YouTube, Reddit, and any Salesforce/Lightning-based enterprise app.

---

## 2. adoptedStyleSheets Inside Shadow DOM

### The API

`ShadowRoot.adoptedStyleSheets` accepts an array of `CSSStyleSheet` objects created via the Constructable Stylesheets API:

```javascript
// Create a shared stylesheet
const darkSheet = new CSSStyleSheet();
darkSheet.replaceSync(`
  :host { background: #1a1a2e; color: #e0e0e0; }
  a { color: #7aa2f7; }
`);

// Inject into a shadow root
const shadowRoot = element.shadowRoot;
shadowRoot.adoptedStyleSheets = [...shadowRoot.adoptedStyleSheets, darkSheet];
```

### Key Properties

- **Shared reference**: One `CSSStyleSheet` object can be adopted by many shadow roots simultaneously. Modifying the sheet (via `replaceSync()` or `replace()`) propagates to ALL adopters instantly.
- **No DOM mutation**: Unlike `<style>` injection, adopted stylesheets do not create DOM nodes. They are attached at the CSSOM level.
- **Cascade position**: Adopted stylesheets are ordered AFTER any `<style>` or `<link>` elements in the shadow root for cascade purposes.
- **Synchronous adoption**: Once a `CSSStyleSheet` is constructed and parsed, adopting it into a shadow root is synchronous and near-instant.

### Browser Support

| Browser | Version | Notes |
|---------|---------|-------|
| Chrome | 73+ | Full support since March 2019 |
| Edge | 79+ | Full support (Chromium-based) |
| Firefox | 101+ | Full support since May 2022 |
| Safari | 16.4+ | Full support since March 2023 |
| **Global coverage** | **94.85%** | Baseline widely available |

**Browse Darkly implication**: Since this is a Chrome extension (initially), `adoptedStyleSheets` has been supported since Chrome 73. All Chrome users will have support. Even for future cross-browser support, 94.85% global coverage means this is safe to use as the primary injection mechanism.

### Performance Characteristics

1. **Parse once, adopt many**: The CSS text is parsed exactly once when `replaceSync()` is called. Subsequent adoptions into shadow roots do not re-parse — they share the parsed representation.
2. **Memory efficient**: Multiple shadow roots sharing the same `CSSStyleSheet` object share the underlying style rule data. This is drastically more efficient than injecting separate `<style>` elements into each shadow root (which forces each to be parsed and stored independently).
3. **Update propagation**: Calling `replaceSync()` on a shared sheet triggers style recalculation in all adopting contexts. The browser batches this efficiently.
4. **No FOUC**: Adoption is synchronous, so styles apply before the next paint.

### Code Example: Injecting Into All Shadow Roots

```javascript
// Create the dark mode stylesheet once
const darkModeSheet = new CSSStyleSheet();
darkModeSheet.replaceSync(`
  :host { color-scheme: dark; }
  * { background-color: #1a1a2e !important; color: #e0e0e0 !important; }
`);

// Walk the DOM and inject into every open shadow root
function injectIntoShadowRoots(root) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        return node.shadowRoot ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    }
  );

  let node = root.shadowRoot ? walker.currentNode : walker.nextNode();
  while (node) {
    const sr = node.shadowRoot;
    if (sr) {
      // Add our sheet without removing existing adopted sheets
      sr.adoptedStyleSheets = [...sr.adoptedStyleSheets, darkModeSheet];
      // Recurse into nested shadow roots
      injectIntoShadowRoots(sr);
    }
    node = walker.nextNode();
  }
}

injectIntoShadowRoots(document.documentElement);
```

### Limitations

- **`@import` not supported**: `replaceSync()` and `replace()` ignore `@import` rules. All CSS must be inlined.
- **Same-origin restriction**: Adopted stylesheets must be created in the same document context as the shadow root. For Chrome extensions, content scripts run in an isolated world but share the same document, so this works.
- **Cannot adopt into closed shadow roots**: You need a reference to the `ShadowRoot` object. Closed shadow roots do not expose this reference via `element.shadowRoot` (see Section 3 for workarounds).

---

## 3. Closed vs Open Shadow DOM

### The Difference

```javascript
// Open: shadowRoot is accessible via element.shadowRoot
element.attachShadow({ mode: 'open' });
console.log(element.shadowRoot); // ShadowRoot object

// Closed: shadowRoot returns null
element.attachShadow({ mode: 'closed' });
console.log(element.shadowRoot); // null
```

### Can Extensions Access Closed Shadow Roots?

**Yes, via browser-specific APIs:**

| Browser | API | Availability |
|---------|-----|-------------|
| **Chrome** | `chrome.dom.openOrClosedShadowRoot(element)` | Chrome 88+, content scripts only |
| **Firefox** | `element.openOrClosedShadowRoot` | Firefox (WebExtension API), content scripts only |
| **Safari** | None | No equivalent API |

These APIs are only available in the extension's **isolated world** (content scripts). Page-level JavaScript cannot access them.

```javascript
// Chrome extension content script
function getShadowRoot(element) {
  // Try open shadow root first (fast path)
  if (element.shadowRoot) return element.shadowRoot;

  // Fall back to chrome.dom API for closed shadow roots
  if (chrome?.dom?.openOrClosedShadowRoot) {
    return chrome.dom.openOrClosedShadowRoot(element);
  }

  return null;
}
```

### The Monkey-Patching Approach (for page-level code)

Since the `chrome.dom` API is only available in content scripts (isolated world), and some injection patterns require page-level code, monkey-patching `Element.prototype.attachShadow` is common:

```javascript
// Intercept all attachShadow calls BEFORE page scripts run
// This must be injected at document_start via a content script
const shadowRootMap = new WeakMap();

const originalAttachShadow = Element.prototype.attachShadow;
Element.prototype.attachShadow = function(init) {
  const shadowRoot = originalAttachShadow.call(this, init);
  // Store reference regardless of mode (open or closed)
  shadowRootMap.set(this, shadowRoot);

  // Dispatch event so our observer can process it
  this.dispatchEvent(new CustomEvent('__browse_darkly__shadowAttached', {
    bubbles: false,
    composed: false
  }));

  return shadowRoot;
};
```

### Caveats of Monkey-Patching

1. **Timing**: The patch MUST run before any page script calls `attachShadow()`. In Chrome MV3, use `"world": "MAIN"` in the content script registration with `"run_at": "document_start"`.
2. **Declarative Shadow DOM**: Shadow roots created via `<template shadowrootmode="open">` are NOT intercepted by this patch because they are created by the HTML parser, not by JavaScript. These must be discovered by walking the DOM.
3. **Detection by page scripts**: Technically, page scripts could detect the monkey-patch by comparing `Element.prototype.attachShadow` to its original value. In practice, no mainstream site does this.
4. **Closed shadow roots remain "closed"**: The monkey-patch stores a reference but does not change the shadow root's mode. `element.shadowRoot` still returns `null` for closed shadow roots. Only the extension code with access to the `WeakMap` can retrieve the reference.

### How Dark Reader Handles This

Dark Reader uses a two-pronged approach:

1. **Monkey-patch `Element.prototype.attachShadow`** in page-level code (injected via `<script>` element or MV3 registered script). Dispatches a `__darkreader__shadowDomAttaching` custom event before the native call completes.
2. **Content script listens** for the custom event, then calls `iterateShadowHosts()` to walk the tree and inject styles.
3. **For existing shadow roots** (Declarative Shadow DOM), Dark Reader walks the entire DOM tree using `TreeWalker` with a filter that checks `element.shadowRoot !== null`.

### Recommendation for Browse Darkly

Use a **hybrid approach**:

1. **Primary**: `chrome.dom.openOrClosedShadowRoot()` in content script for accessing both open and closed shadow roots during DOM traversal.
2. **Supplementary**: Monkey-patch `attachShadow()` in page-world script (`"world": "MAIN"`) to intercept dynamically created shadow roots and get notified immediately.
3. **Declarative Shadow DOM**: Walk the DOM on `document_start` and after any major DOM mutation to find declarative shadow roots.

---

## 4. CSS Inheritance Through Shadow Boundaries

### Properties That Inherit Through Shadow DOM

All CSS properties with `Inherited: yes` in the specification cascade through shadow boundaries. The shadow root's top-level elements inherit from their host element.

**Key inherited properties relevant to dark mode**:

| Category | Properties |
|----------|-----------|
| **Text/Font** | `color`, `font-family`, `font-size`, `font-style`, `font-weight`, `font-variant`, `letter-spacing`, `line-height`, `text-align`, `text-indent`, `text-transform`, `white-space`, `word-spacing`, `word-break`, `overflow-wrap` |
| **List** | `list-style`, `list-style-type`, `list-style-position`, `list-style-image` |
| **Table** | `border-collapse`, `border-spacing`, `caption-side`, `empty-cells` |
| **Visual** | `cursor`, `visibility`, `direction`, `writing-mode` |
| **Other** | `quotes`, `orphans`, `widows`, `tab-size` |

### CSS Custom Properties (Variables) Cross Shadow Boundaries

This is the most important finding for Browse Darkly's CSS variable fast path:

**CSS custom properties (`--*`) inherit through shadow DOM by design.** This is intentional — it is the primary mechanism for theming Web Components from the outside.

```css
/* Document level (set by Browse Darkly) */
:root {
  --bd-bg-primary: #1a1a2e;
  --bd-text-primary: #e0e0e0;
  --bd-accent: #7aa2f7;
}

/* Inside a shadow root — these variables are available! */
/* If the component uses them: */
:host {
  background: var(--bd-bg-primary);
  color: var(--bd-text-primary);
}
```

### Implications for Browse Darkly's CSS Variable Fast Path

**The Good News**:

1. If a site defines theme colors as CSS custom properties on `:root`, Browse Darkly can override them at `:root` and the new values **automatically cascade into every shadow root**. This is the zero-processing fast path described in the plan.
2. No need to traverse shadow roots or inject anything into them — CSS inheritance handles it.
3. Changing a variable on `:root` triggers re-style of all elements using that variable, including those inside shadow DOM.

**The Limitations**:

1. **Only works if the site (and its Web Components) USE CSS custom properties for their colors.** If a component has hardcoded `background: white` in its shadow DOM stylesheet, overriding `--bg-color` on `:root` has no effect.
2. **`all: initial` blocks inheritance**: If a component resets all properties with `all: initial`, inherited custom properties are cleared. However, `all: initial` does NOT reset custom properties (per spec). Only explicitly setting `--var: initial` resets a specific custom property.
3. **Component-defined defaults**: Components may define their own fallback values: `var(--theme-bg, white)`. The fallback only applies if the variable is not set in the cascade. As long as Browse Darkly sets the variable on `:root`, the fallback is ignored.

### Properties That Do NOT Inherit (Require Direct Injection)

These must be overridden inside each shadow root:

| Category | Properties |
|----------|-----------|
| **Box Model** | `background`, `background-color`, `border`, `border-color`, `margin`, `padding` |
| **Layout** | `display`, `position`, `width`, `height`, `flex`, `grid` |
| **Visual** | `box-shadow`, `outline`, `outline-color`, `opacity` |
| **Other** | `overflow`, `z-index`, `transform` |

**Key insight**: `background-color` does NOT inherit through shadow DOM. This is the single most important property for dark mode, and it must be set inside each shadow root directly. The CSS variable fast path only works for sites where `background-color` is set via a CSS custom property.

---

## 5. MutationObserver for Shadow DOM

### The Core Problem

`MutationObserver` does NOT automatically observe into shadow roots. A `MutationObserver` attached to `document.body` with `subtree: true` will see new elements added to the light DOM but will NOT see:

1. Elements added inside an existing shadow root
2. New shadow roots being created (there is no "shadow root attached" mutation type)

### Detection Strategies

#### Strategy 1: Monkey-Patch `attachShadow()` (Recommended)

This is the only reliable way to detect dynamically created shadow roots.

```javascript
// Injected in page world at document_start
const originalAttachShadow = Element.prototype.attachShadow;
Element.prototype.attachShadow = function(init) {
  const shadowRoot = originalAttachShadow.call(this, init);

  // Notify the extension
  document.dispatchEvent(new CustomEvent('__bd__shadow_created', {
    detail: { host: this }
  }));

  return shadowRoot;
};
```

The content script then listens and processes the new shadow root:

```javascript
// Content script
document.addEventListener('__bd__shadow_created', (e) => {
  queueMicrotask(() => {
    const host = e.detail.host;
    const sr = host.shadowRoot || chrome.dom.openOrClosedShadowRoot(host);
    if (sr) {
      injectDarkStyles(sr);
      observeShadowRoot(sr);
    }
  });
});
```

#### Strategy 2: MutationObserver + Check for Shadow Roots

Watch for new elements in the light DOM, then check if they have shadow roots:

```javascript
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;

      // Check the added node itself
      const sr = node.shadowRoot || chrome.dom?.openOrClosedShadowRoot?.(node);
      if (sr) {
        processShadowRoot(sr);
      }

      // Check descendants of the added subtree
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT);
      let el;
      while (el = walker.nextNode()) {
        const childSr = el.shadowRoot || chrome.dom?.openOrClosedShadowRoot?.(el);
        if (childSr) {
          processShadowRoot(childSr);
        }
      }
    }
  }
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});
```

#### Strategy 3: Observe Inside Each Shadow Root

Once you have a reference to a shadow root, you need a separate `MutationObserver` for its contents:

```javascript
function observeShadowRoot(shadowRoot) {
  const shadowObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;

        // Check for nested shadow roots
        const sr = node.shadowRoot;
        if (sr) {
          injectDarkStyles(sr);
          observeShadowRoot(sr); // Recursive
        }
      }
    }
  });

  shadowObserver.observe(shadowRoot, {
    childList: true,
    subtree: true
  });
}
```

#### Strategy 4: Declarative Shadow DOM Discovery

For shadow roots created by the HTML parser (Declarative Shadow DOM), neither monkey-patching nor MutationObserver will catch them. You must walk the DOM:

```javascript
// Run at document_start AND after DOMContentLoaded
function discoverDeclarativeShadowRoots(root) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        return node.shadowRoot ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    }
  );

  while (walker.nextNode()) {
    const sr = walker.currentNode.shadowRoot;
    injectDarkStyles(sr);
    observeShadowRoot(sr);
    discoverDeclarativeShadowRoots(sr); // Recurse
  }
}
```

### Performance Implications

| Strategy | Overhead | Reliability | Notes |
|----------|----------|-------------|-------|
| Monkey-patch `attachShadow` | Minimal (one event per shadow root creation) | High for imperative shadow DOM | Does not catch declarative shadow DOM |
| MutationObserver + check | Moderate (checks every added element) | Medium | May miss shadow roots added between observer registration and element checking |
| Per-shadow-root observer | Scales linearly with shadow root count | High once registered | 100+ observers on YouTube-scale pages |
| DOM walk for declarative | One-time cost at page load | High | Must re-run on major DOM additions |

**Performance concern**: On YouTube with 200-500 shadow roots, maintaining 200-500 `MutationObserver` instances is not free. However, each observer is lightweight when observing only `{ childList: true, subtree: true }`. The main cost is in the callback processing, not the observer registration itself.

---

## 6. Dark Reader's Shadow DOM Approach

### Architecture Overview

Dark Reader uses a multi-layered approach to handle Shadow DOM, built over years of real-world debugging:

```
[1] PROXY INJECTION (page world)
    |-- Monkey-patches: CSSStyleSheet methods, Element.attachShadow,
    |   Document.styleSheets, adoptedStyleSheets setter
    |-- Dispatches custom events to notify content script
    |
[2] SHADOW ROOT DISCOVERY (content script)
    |-- iterateShadowHosts(): TreeWalker-based recursive walk
    |-- Finds all elements with .shadowRoot !== null
    |
[3] STYLE INJECTION (per shadow root)
    |-- createShadowStaticStyleOverrides()
    |   |-- darkreader--inline: inline style overrides
    |   |-- darkreader--override: site-specific CSS fixes
    |   |-- darkreader--invert: image/media inversion protection
    |
[4] ADOPTED STYLESHEET HANDLING
    |-- createAdoptedStyleSheetOverride()
    |-- Manages override sheets inserted after source sheets
    |-- Tracks changes via WeakMap/WeakSet
    |
[5] CONTINUOUS MONITORING
    |-- Custom event listeners for shadow DOM attachments
    |-- Per-shadow-root MutationObserver for removed styles
    |-- requestAnimationFrame polling as fallback
    |-- customElements.whenDefined() integration
```

### Key Implementation Details

#### 1. The Proxy (stylesheet-proxy.ts)

Dark Reader injects a proxy script into the **page world** (not the isolated content script world). This script monkey-patches:

- **`CSSStyleSheet.prototype.insertRule/deleteRule/replace/replaceSync`**: After each call, dispatches a `__darkreader__updateSheet` custom event so the content script knows to re-process the modified sheet.
- **`Element.prototype.attachShadow`**: Dispatches `__darkreader__shadowDomAttaching` event BEFORE calling native `attachShadow`. This allows the content script to register an observer before the shadow root is populated.
- **`document.adoptedStyleSheets` setter**: Proxied to dispatch change events when adopted stylesheets are added/removed.
- **`customElements.define`**: Intercepted to dispatch `__darkreader__isDefined` event, enabling the content script to re-process elements after their custom element definition runs.

For MV3 (Chrome), the proxy is injected via a registered content script with `"world": "MAIN"`. For MV2 (Firefox), it is injected via an inline `<script>` element.

#### 2. Shadow Root Style Injection (dynamic-theme/index.ts)

For each discovered shadow root, Dark Reader creates three `<style>` elements:

```javascript
function createShadowStaticStyleOverridesInner(root) {
  // 1. Inline style overrides (highest priority)
  const inlineStyle = createOrUpdateStyle('darkreader--inline', root);
  inlineStyle.textContent = getInlineOverrideStyle();
  root.insertBefore(inlineStyle, root.firstChild);

  // 2. Site-specific CSS fixes
  const overrideStyle = createOrUpdateStyle('darkreader--override', root);
  overrideStyle.textContent = fixes?.css ? replaceCSSTemplates(fixes.css) : '';
  root.insertBefore(overrideStyle, inlineStyle.nextSibling);

  // Track which shadow roots have been processed
  shadowRootsWithOverrides.add(root);
}
```

Note: Dark Reader uses `<style>` element injection, NOT `adoptedStyleSheets`, for its static overrides in shadow roots. This is likely for broader compatibility (especially older browser versions) and because their override mechanism predates wide `adoptedStyleSheets` support.

#### 3. Adopted Stylesheet Override (adopted-style-manger.ts)

For shadow roots that USE adopted stylesheets (like Reddit's modern architecture), Dark Reader creates **companion override sheets**:

```javascript
function injectSheet(sheet, override) {
  const newSheets = [...node.adoptedStyleSheets];
  const sheetIndex = newSheets.indexOf(sheet);
  // Insert override AFTER the source sheet
  newSheets.splice(sheetIndex + 1, 0, override);
  node.adoptedStyleSheets = newSheets;
}
```

Each source adopted stylesheet gets a paired override stylesheet. The override sheet contains the dark-mode-transformed rules for the corresponding source sheet.

#### 4. Delayed Shadow Root Handling

For shadow roots that are empty when first discovered (element created but not yet populated), Dark Reader registers a `MutationObserver` on the shadow root that watches for its own styles being removed:

```javascript
function delayedCreateShadowStaticStyleOverrides(root) {
  const observer = new MutationObserver((mutations, observer) => {
    observer.disconnect();
    for (const { type, removedNodes } of mutations) {
      if (type === 'childList') {
        for (const { nodeName, className } of removedNodes) {
          if (nodeName === 'STYLE' &&
              className?.includes('darkreader')) {
            // Our styles were removed — re-inject them
            createShadowStaticStyleOverridesInner(root);
            return;
          }
        }
      }
    }
  });
  observer.observe(root, { childList: true });
}
```

This handles the case where a component's `connectedCallback` clears all children before rendering.

#### 5. Custom Element Lifecycle Integration

Dark Reader tracks undefined custom elements (those whose `customElements.define()` hasn't been called yet). When a custom element is defined, it re-processes all instances of that element to inject shadow DOM styles:

```javascript
// Listens for __darkreader__shadowDomAttaching events
document.addEventListener('__darkreader__shadowDomAttaching', (e) => {
  const host = e.target;
  queueMicrotask(() => {
    const hosts = [...unhandledShadowHosts].filter((el) => el.shadowRoot);
    elementsDefinitionCallback?.(hosts);
    unhandledShadowHosts.clear();
  });
});
```

The `queueMicrotask` batching ensures that multiple shadow roots created in the same tick are processed together.

### Lessons from Dark Reader's Reddit Breakage (December 2025)

When Reddit migrated to heavy Shadow DOM + Adopted Stylesheets in December 2025:

1. **Firefox was hit hardest**: A 3-year-old Firefox bug prevented extensions from directly accessing adopted stylesheets. Dark Reader's workaround caused severe performance issues (up to 10GB memory consumption).
2. **The fix** (Dark Reader 4.9.97-4.9.99): Fixed Shadow DOM static style injection, improved adopted stylesheets handling, and deferred background image analysis to reduce memory usage.
3. **Takeaway for Browse Darkly**: Adopted stylesheet handling MUST be a first-class concern, not an afterthought. Test against Reddit and YouTube specifically during development.

---

## 7. Performance at Scale

### The Scale Problem

A YouTube watch page can have 200-500 shadow roots. A Salesforce Lightning app can have 500-1000+. For each shadow root, Browse Darkly needs to:

1. Discover it (monkey-patch notification or DOM walk)
2. Read its existing stylesheets
3. Inject dark mode styles
4. Monitor it for changes

### adoptedStyleSheets: The Performance Winner

The key performance advantage of `adoptedStyleSheets` over `<style>` injection:

**Shared CSSStyleSheet objects are parsed ONCE and shared by reference.** If Browse Darkly creates one `CSSStyleSheet` containing its dark mode overrides, and adopts it into 500 shadow roots, the CSS is parsed once and the 500 adoptions are essentially pointer assignments.

```javascript
// GOOD: One sheet, many shadow roots
const darkSheet = new CSSStyleSheet();
darkSheet.replaceSync(darkModeCSS); // Parsed once

for (const sr of allShadowRoots) {
  sr.adoptedStyleSheets = [...sr.adoptedStyleSheets, darkSheet]; // Near-instant
}

// BAD: N <style> elements = N parses
for (const sr of allShadowRoots) {
  const style = document.createElement('style');
  style.textContent = darkModeCSS; // Parsed every time
  sr.appendChild(style);
}
```

### Performance Estimates

Based on browser engine behavior and available benchmarks:

| Operation | Cost per shadow root | 100 roots | 500 roots |
|-----------|---------------------|-----------|-----------|
| `adoptedStyleSheets` assignment | ~0.01-0.05ms | ~1-5ms | ~5-25ms |
| `<style>` element creation + parse | ~0.5-2ms | ~50-200ms | ~250-1000ms |
| TreeWalker discovery | ~0.001ms/element | ~1-5ms (for 1K elements) | ~1-5ms |
| MutationObserver registration | ~0.01ms | ~1ms | ~5ms |
| Style recalculation (browser) | Depends on CSS complexity | ~5-20ms | ~25-100ms |

**Total estimated overhead for 500 shadow roots**:
- With `adoptedStyleSheets` (shared sheet): **~30-130ms** (dominated by browser style recalculation)
- With `<style>` injection: **~275-1100ms** (dominated by repeated CSS parsing)

### Optimization Strategies for Scale

#### 1. Lazy Processing (Viewport-Aware)

Only process shadow roots that are visible or near-visible:

```javascript
const visibilityObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      const sr = entry.target.shadowRoot;
      if (sr && !processedRoots.has(sr)) {
        injectDarkStyles(sr);
        processedRoots.add(sr);
      }
    }
  }
}, { rootMargin: '200px' }); // 200px lookahead

// Observe shadow host elements, not the shadow roots themselves
for (const host of shadowHostElements) {
  visibilityObserver.observe(host);
}
```

#### 2. Shared Sheet + Per-Root Override Sheet

Use one shared base dark mode sheet for the common styles, and only create per-root override sheets for shadow roots that need customization:

```javascript
// Shared base (adopted into ALL shadow roots)
const baseDarkSheet = new CSSStyleSheet();
baseDarkSheet.replaceSync(`
  :host { color-scheme: dark; }
  /* Common dark mode rules */
`);

// Per-root overrides (only when needed)
function getOverrideSheet(shadowRoot) {
  const existingSheets = shadowRoot.adoptedStyleSheets;
  // Analyze existing styles and generate targeted overrides
  // Only if the base sheet isn't sufficient
}
```

#### 3. Batch Processing with requestIdleCallback

Process shadow roots during idle periods:

```javascript
const pendingShadowRoots = [];

function scheduleShadowRootProcessing(sr) {
  pendingShadowRoots.push(sr);
  if (pendingShadowRoots.length === 1) {
    requestIdleCallback(processBatch);
  }
}

function processBatch(deadline) {
  while (pendingShadowRoots.length > 0 && deadline.timeRemaining() > 5) {
    const sr = pendingShadowRoots.shift();
    injectDarkStyles(sr);
  }
  if (pendingShadowRoots.length > 0) {
    requestIdleCallback(processBatch);
  }
}
```

#### 4. Limit MutationObserver Count

Instead of one observer per shadow root, use a polling approach for non-critical shadow roots:

```javascript
// Critical shadow roots (visible, interactive): dedicated observer
// Non-critical (offscreen, static): periodic poll
const POLL_INTERVAL = 2000; // 2 seconds

setInterval(() => {
  for (const sr of nonCriticalShadowRoots) {
    checkForChanges(sr);
  }
}, POLL_INTERVAL);
```

---

## 8. CSS @layer Inside Shadow DOM

### Current Behavior

CSS `@layer` (cascade layers) works inside shadow DOM adopted stylesheets. You can define layers within a shadow root:

```javascript
const layeredSheet = new CSSStyleSheet();
layeredSheet.replaceSync(`
  @layer base, overrides;

  @layer base {
    :host { background: white; color: black; }
  }

  @layer overrides {
    :host { background: #1a1a2e; color: #e0e0e0; }
  }
`);

shadowRoot.adoptedStyleSheets = [layeredSheet];
```

### Key Rules

1. **Layers are scoped per shadow context**: Layer identifiers do NOT cross shadow boundaries. A layer named `base` in the document has no relationship to a layer named `base` inside a shadow root.

2. **Layers do not pierce shadow boundaries**: Defining `@layer dark-mode { ... }` in the document-level stylesheet does NOT affect styles inside shadow roots.

3. **Adopted stylesheets cascade after shadow DOM `<style>` elements**: This means if Browse Darkly adopts a sheet with dark mode overrides, those overrides naturally have higher cascade priority than the component's built-in styles (unless the component uses `!important`).

4. **`@layer` works inside adopted stylesheets**: You can use layers within an adopted stylesheet for organizing override priority within the dark mode engine.

### Browser Support for @layer

| Browser | Version |
|---------|---------|
| Chrome | 99+ |
| Edge | 99+ |
| Firefox | 97+ |
| Safari | 15.4+ |

Global support: ~95%+. Safe to use in a Chrome extension.

### Implications for Browse Darkly

#### Recommended Layer Architecture

```javascript
const darkModeSheet = new CSSStyleSheet();
darkModeSheet.replaceSync(`
  @layer bd-base, bd-site-fixes, bd-user;

  @layer bd-base {
    /* Generic dark mode overrides */
    :host {
      color-scheme: dark;
      background-color: var(--bd-bg, #1a1a2e) !important;
      color: var(--bd-text, #e0e0e0) !important;
    }
  }

  @layer bd-site-fixes {
    /* Site-specific corrections (from override database) */
    /* e.g., YouTube-specific fixes */
  }

  @layer bd-user {
    /* User customizations (highest priority) */
  }
`);
```

#### Why @layer Is Useful Inside Shadow DOM

1. **Override organization**: Browse Darkly can structure its own overrides into layers (base theme, site fixes, user customizations) within each shadow root.
2. **Predictable priority**: Layers ensure that user customizations always beat site fixes, which always beat the base theme, regardless of selector specificity.
3. **No cross-boundary leakage**: Since layers don't cross shadow boundaries, there is no risk of Browse Darkly's document-level layers interfering with component-internal layers (or vice versa).

#### What @layer Cannot Do

- Cannot apply document-level dark mode layers INTO shadow roots. Each shadow root needs its own layer definitions.
- Cannot reference or inherit layers from the host context.
- The proposed `@layer shadow()` syntax (from w3c/csswg-drafts#9792) is still in discussion and not implemented in any browser.

---

## 9. Recommendations for Browse Darkly

### Architecture Summary

Based on all research findings, here is the recommended approach:

```
BROWSE DARKLY SHADOW DOM STRATEGY
----------------------------------

[DETECTION]
  |
  |-- 1. Monkey-patch Element.prototype.attachShadow (page world, document_start)
  |     - Dispatches event on every shadow root creation
  |     - Stores reference in WeakMap for closed roots
  |
  |-- 2. Declarative Shadow DOM walk (on DOMContentLoaded + major mutations)
  |     - TreeWalker-based discovery of existing shadow roots
  |     - Uses chrome.dom.openOrClosedShadowRoot for closed roots
  |
  |-- 3. MutationObserver on document (light DOM additions)
  |     - Checks new elements for shadow roots
  |
[INJECTION]
  |
  |-- Primary: adoptedStyleSheets (shared CSSStyleSheet)
  |     - ONE base dark mode sheet shared across ALL shadow roots
  |     - Per-root override sheets only when needed
  |     - CSS @layer for priority management
  |
  |-- CSS Variable Override (fast path)
  |     - If site uses CSS vars for colors: override on :root
  |     - Variables inherit into shadow DOM automatically
  |     - Zero per-shadow-root processing needed
  |
[MONITORING]
  |
  |-- Per-shadow-root MutationObserver (visible roots only)
  |-- Adopted stylesheet change detection (proxy in page world)
  |-- requestIdleCallback batch processing for offscreen roots
```

### Specific Recommendations

#### 1. Use adoptedStyleSheets, Not `<style>` Injection

Dark Reader's approach of injecting `<style>` elements into shadow roots is a legacy pattern. `adoptedStyleSheets` is:
- 10-40x faster for shared styles across many shadow roots
- Memory efficient (shared parsed representation)
- Cleaner (no DOM nodes to manage)
- Less likely to be stripped by component cleanup code

#### 2. Two-World Script Architecture

```
content-script (isolated world):
  - Manages dark mode state
  - Uses chrome.dom.openOrClosedShadowRoot() for closed roots
  - Handles adoptedStyleSheets injection
  - Runs MutationObservers

page-script (MAIN world):
  - Monkey-patches Element.prototype.attachShadow
  - Monkey-patches CSSStyleSheet.prototype methods (for SPA support)
  - Monkey-patches adoptedStyleSheets setter
  - Communicates via CustomEvent dispatch
```

This is the same architecture Dark Reader uses, and it is proven at scale.

#### 3. CSS Variable Fast Path Should Be Tier 1 Strategy

For any site where the theme engine detects CSS custom properties being used for colors:

```javascript
// Step 1: Scan :root for color-valued custom properties
const rootStyles = getComputedStyle(document.documentElement);
const colorVars = detectColorVariables(rootStyles);

// Step 2: Override them on :root
const varOverrideSheet = new CSSStyleSheet();
varOverrideSheet.replaceSync(`
  :root {
    ${colorVars.map(v => `${v.name}: ${transformColor(v.value)} !important;`).join('\n')}
  }
`);
document.adoptedStyleSheets = [...document.adoptedStyleSheets, varOverrideSheet];

// Step 3: These cascade into ALL shadow roots automatically
// No per-shadow-root processing needed!
```

This path covers an increasing percentage of modern sites and requires zero shadow root traversal.

#### 4. background-color Requires Direct Injection

Since `background-color` does NOT inherit through shadow boundaries, Browse Darkly must inject override rules into each shadow root even when using the CSS variable fast path. The recommended approach:

```javascript
// Shared sheet for ALL shadow roots
const shadowBaseSheet = new CSSStyleSheet();
shadowBaseSheet.replaceSync(`
  @layer bd-shadow-base {
    :host {
      background-color: var(--bd-bg-primary, #1a1a2e) !important;
      color: var(--bd-text-primary, #e0e0e0) !important;
      color-scheme: dark;
    }
  }
`);

// Inject into every shadow root — the sheet is shared, so this is cheap
function injectBaseDarkMode(shadowRoot) {
  if (!shadowRoot.adoptedStyleSheets.includes(shadowBaseSheet)) {
    shadowRoot.adoptedStyleSheets = [...shadowRoot.adoptedStyleSheets, shadowBaseSheet];
  }
}
```

The key insight: by using `var(--bd-bg-primary)` inside the shared shadow sheet, Browse Darkly can change the color once on `:root` and it propagates to all shadow roots via CSS variable inheritance, while the `background-color` application happens via the adopted sheet inside each shadow root.

#### 5. Handle the December 2025 Reddit Pattern

Reddit's migration demonstrated that modern sites can adopt Shadow DOM + Adopted Stylesheets en masse. Browse Darkly must:

1. Support adopted stylesheet override (like Dark Reader's `createAdoptedStyleSheetOverride`)
2. Test against Reddit and YouTube from day one
3. Handle the case where a site's adopted stylesheets change dynamically (SPA-style)

#### 6. Performance Budget

Target performance budget for shadow DOM handling:

| Metric | Target | Notes |
|--------|--------|-------|
| Shadow root detection (per root) | <0.1ms | Monkey-patch event or TreeWalker check |
| Shared sheet adoption (per root) | <0.1ms | adoptedStyleSheets array assignment |
| Per-root override generation | <5ms | Only when base sheet is insufficient |
| Total for 500 shadow roots | <100ms | Dominated by browser style recalc |
| Ongoing monitoring overhead | <1% CPU | Batched, idle-time processing |

#### 7. What NOT to Do

- **Do not use `<style>` injection into shadow roots.** It is slower, creates DOM nodes that components may remove, and does not share parsed representations.
- **Do not try to pierce shadow DOM with `::shadow` or `/deep/`**. These selectors were removed from the spec years ago.
- **Do not ignore closed shadow roots**. Use `chrome.dom.openOrClosedShadowRoot()` and the monkey-patch approach.
- **Do not create one MutationObserver per shadow root eagerly**. Use lazy/viewport-aware processing.
- **Do not assume `all: initial` resets custom properties**. It does not (per spec). Custom properties survive `all: initial`.

---

## Sources

- [Shadow DOM V1 - web.dev](https://web.dev/shadowdom-v1/)
- [Using Shadow DOM - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM)
- [ShadowRoot.adoptedStyleSheets - MDN](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/adoptedStyleSheets)
- [Constructable Stylesheets - web.dev](https://web.dev/articles/constructable-stylesheets)
- [Document.adoptedStyleSheets - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Document/adoptedStyleSheets)
- [chrome.dom API - Chrome for Developers](https://developer.chrome.com/docs/extensions/reference/api/dom)
- [Styles Piercing Shadow DOM - Open Web Components](https://open-wc.org/guides/knowledge/styling/styles-piercing-shadow-dom/)
- [CSS Custom Properties in Shadow DOM - michaelwarren.dev](https://michaelwarren.dev/blog/css-variables-in-wc/)
- [Shadow Roots and Inheritance - Kitty Giraudel](https://kittygiraudel.com/2021/08/23/shadow-roots-and-inheritance/)
- [Shadow DOM Problems for Extensions - W3C WebExtensions #647](https://github.com/w3c/webextensions/issues/647)
- [MutationObserver and Shadow DOM - whatwg/dom #1287](https://github.com/whatwg/dom/issues/1287)
- [CSS @layer - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@layer)
- [Host Layerable Shadow Roots - w3c/csswg-drafts #9792](https://github.com/w3c/csswg-drafts/issues/9792)
- [Declarative Shadow DOM - Chrome for Developers](https://developer.chrome.com/docs/css-ui/declarative-shadow-dom)
- [Dark Reader GitHub Repository](https://github.com/darkreader/darkreader)
- [Dark Reader stylesheet-proxy.ts](https://github.com/darkreader/darkreader/blob/main/src/inject/dynamic-theme/stylesheet-proxy.ts)
- [Dark Reader adopted-style-manger.ts](https://github.com/darkreader/darkreader/blob/main/src/inject/dynamic-theme/adopted-style-manger.ts)
- [Dark Reader custom-elements.ts](https://github.com/darkreader/darkreader/blob/main/src/inject/dynamic-theme/watch/custom-elements.ts)
- [Dark Reader Firefox Fixes Blog](https://darkreader.org/blog/firefox-bugs/)
- [Composable Adopted Stylesheets - David Bushell](https://dbushell.com/2025/08/02/composable-adopted-stylesheets/)
- [ShadowRoot.adoptedStyleSheets - Can I Use](https://caniuse.com/mdn-api_shadowroot_adoptedstylesheets)
- [Open Closed Shadow DOM - Extension Security](http://extensions.neplox.security/Attacks/Shadow/)
- [Proposal: Allow Extensions to Access Closed Shadow Root](https://groups.google.com/a/chromium.org/g/chromium-extensions/c/JaHhogJuBOk)
- [Declarative adoptedStyleSheets for Shadow DOM - MSEdge Explainers](https://microsoftedge.github.io/MSEdgeExplainers/ShadowDOM/explainer.html)
