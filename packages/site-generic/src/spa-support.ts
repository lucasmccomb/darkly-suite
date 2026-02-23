/**
 * SPA Support — Stylesheet Proxy
 *
 * Intercepts CSSStyleSheet.prototype methods (insertRule, deleteRule,
 * replace, replaceSync) to detect when stylesheets change. SPAs
 * frequently modify stylesheets dynamically, requiring re-processing.
 */

export type StylesheetChangeCallback = (sheet: CSSStyleSheet) => void;

export class StylesheetProxy {
  private callback: StylesheetChangeCallback;
  private originals: {
    insertRule: typeof CSSStyleSheet.prototype.insertRule;
    deleteRule: typeof CSSStyleSheet.prototype.deleteRule;
    replace: typeof CSSStyleSheet.prototype.replace | undefined;
    replaceSync: typeof CSSStyleSheet.prototype.replaceSync | undefined;
  } | null = null;
  private batchTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingSheets = new Set<CSSStyleSheet>();

  constructor(callback: StylesheetChangeCallback) {
    this.callback = callback;
  }

  /** Start intercepting stylesheet mutations. */
  start(): void {
    if (this.originals) return;

    this.originals = {
      insertRule: CSSStyleSheet.prototype.insertRule,
      deleteRule: CSSStyleSheet.prototype.deleteRule,
      replace: CSSStyleSheet.prototype.replace,
      replaceSync: CSSStyleSheet.prototype.replaceSync,
    };

    const origInsertRule = this.originals.insertRule;
    const origDeleteRule = this.originals.deleteRule;
    const origReplace = this.originals.replace;
    const origReplaceSync = this.originals.replaceSync;
    const enqueue = (sheet: CSSStyleSheet) => this.enqueue(sheet);

    CSSStyleSheet.prototype.insertRule = function (
      ...args: Parameters<CSSStyleSheet['insertRule']>
    ) {
      const result = origInsertRule.apply(this, args);
      enqueue(this);
      return result;
    };

    CSSStyleSheet.prototype.deleteRule = function (
      ...args: Parameters<CSSStyleSheet['deleteRule']>
    ) {
      origDeleteRule.apply(this, args);
      enqueue(this);
    };

    if (origReplace) {
      CSSStyleSheet.prototype.replace = function (
        ...args: Parameters<CSSStyleSheet['replace']>
      ) {
        const result = origReplace.apply(this, args);
        result.then(() => enqueue(this));
        return result;
      };
    }

    if (origReplaceSync) {
      CSSStyleSheet.prototype.replaceSync = function (
        ...args: Parameters<CSSStyleSheet['replaceSync']>
      ) {
        origReplaceSync.apply(this, args);
        enqueue(this);
      };
    }
  }

  /** Stop intercepting. */
  stop(): void {
    if (!this.originals) return;

    CSSStyleSheet.prototype.insertRule = this.originals.insertRule;
    CSSStyleSheet.prototype.deleteRule = this.originals.deleteRule;
    if (this.originals.replace) {
      CSSStyleSheet.prototype.replace = this.originals.replace;
    }
    if (this.originals.replaceSync) {
      CSSStyleSheet.prototype.replaceSync = this.originals.replaceSync;
    }

    this.originals = null;
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    this.pendingSheets.clear();
  }

  /** Batch stylesheet changes via microtask to avoid per-rule callbacks. */
  private enqueue(sheet: CSSStyleSheet): void {
    this.pendingSheets.add(sheet);
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.batchTimer = null;
        const sheets = [...this.pendingSheets];
        this.pendingSheets.clear();
        for (const s of sheets) {
          this.callback(s);
        }
      }, 0);
    }
  }
}
