/**
 * CSS Injection via adoptedStyleSheets.
 *
 * Uses the modern adoptedStyleSheets API for zero-DOM-mutation CSS injection.
 * Falls back to <style> elements for browsers that don't support it on Document.
 */

interface TaggedCSSStyleSheet extends CSSStyleSheet {
  _bdId?: string;
}

export class StylesheetInjector {
  private sheets: TaggedCSSStyleSheet[] = [];
  private fallbackElements: HTMLStyleElement[] = [];

  /** Inject CSS into the document. Returns an ID for later removal. */
  inject(css: string, id?: string): string {
    const sheetId =
      id ||
      `bd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    if (this.supportsAdoptedStyleSheets()) {
      const sheet: TaggedCSSStyleSheet = new CSSStyleSheet();
      sheet.replaceSync(css);
      sheet._bdId = sheetId;
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
      this.sheets.push(sheet);
    } else {
      // Fallback: <style> element
      const style = document.createElement('style');
      style.id = sheetId;
      style.textContent = css;
      document.documentElement.appendChild(style);
      this.fallbackElements.push(style);
    }

    return sheetId;
  }

  /** Remove a previously injected stylesheet by ID. */
  remove(sheetId: string): void {
    if (this.supportsAdoptedStyleSheets()) {
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
        (s) => (s as TaggedCSSStyleSheet)._bdId !== sheetId
      );
      this.sheets = this.sheets.filter((s) => s._bdId !== sheetId);
    } else {
      const el = this.fallbackElements.find((e) => e.id === sheetId);
      if (el) {
        el.remove();
        this.fallbackElements = this.fallbackElements.filter((e) => e !== el);
      }
    }
  }

  /** Replace the CSS content of an existing sheet. */
  update(sheetId: string, css: string): void {
    if (this.supportsAdoptedStyleSheets()) {
      const sheet = this.sheets.find((s) => s._bdId === sheetId);
      if (sheet) {
        sheet.replaceSync(css);
        return;
      }
    }

    const el = this.fallbackElements.find((e) => e.id === sheetId);
    if (el) {
      el.textContent = css;
      return;
    }

    // Sheet not found — inject as new
    this.inject(css, sheetId);
  }

  /** Remove all injected stylesheets. */
  removeAll(): void {
    if (this.supportsAdoptedStyleSheets()) {
      const bdIds = new Set(this.sheets.map((s) => s._bdId));
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
        (s) => !bdIds.has((s as TaggedCSSStyleSheet)._bdId)
      );
      this.sheets = [];
    }
    for (const el of this.fallbackElements) {
      el.remove();
    }
    this.fallbackElements = [];
  }

  private supportsAdoptedStyleSheets(): boolean {
    return 'adoptedStyleSheets' in Document.prototype;
  }
}
