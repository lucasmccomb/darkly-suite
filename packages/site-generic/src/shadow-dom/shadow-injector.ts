/**
 * Inject shared stylesheets into Shadow DOM roots via adoptedStyleSheets.
 *
 * When a shadow root is discovered, we inject our dark mode stylesheet
 * into its adoptedStyleSheets array. This is the fastest injection method
 * (10-40x faster than creating <style> elements per shadow root).
 */

export class ShadowStyleInjector {
  private darkSheet: CSSStyleSheet | null = null;
  private injectedRoots = new WeakSet<ShadowRoot>();

  /** Create or update the shared dark mode stylesheet. */
  setCSS(css: string): void {
    if (!this.darkSheet) {
      this.darkSheet = new CSSStyleSheet();
    }
    this.darkSheet.replaceSync(css);
  }

  /** Inject the shared stylesheet into a shadow root. */
  inject(shadowRoot: ShadowRoot): void {
    if (!this.darkSheet || this.injectedRoots.has(shadowRoot)) return;

    try {
      shadowRoot.adoptedStyleSheets = [
        ...shadowRoot.adoptedStyleSheets,
        this.darkSheet,
      ];
      this.injectedRoots.add(shadowRoot);
    } catch {
      // Some shadow roots may not support adoptedStyleSheets
      // Fall back to style element
      const style = document.createElement('style');
      style.dataset.darklyFix = 'shadow';
      style.textContent = this.darkSheet.cssRules
        ? Array.from(this.darkSheet.cssRules)
            .map((r) => r.cssText)
            .join('\n')
        : '';
      shadowRoot.appendChild(style);
      this.injectedRoots.add(shadowRoot);
    }
  }

  /** Remove dark mode from a shadow root. */
  remove(shadowRoot: ShadowRoot): void {
    if (!this.injectedRoots.has(shadowRoot)) return;

    if (this.darkSheet) {
      shadowRoot.adoptedStyleSheets = shadowRoot.adoptedStyleSheets.filter(
        (s) => s !== this.darkSheet,
      );
    }

    // Also remove fallback style elements
    const fallback = shadowRoot.querySelector(
      'style[data-darkly-fix="shadow"]',
    );
    fallback?.remove();

    this.injectedRoots.delete(shadowRoot);
  }

  /** Clean up everything. */
  destroy(): void {
    this.darkSheet = null;
    // WeakSet entries will be GC'd automatically
    this.injectedRoots = new WeakSet();
  }
}
