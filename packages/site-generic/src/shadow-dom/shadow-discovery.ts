/**
 * Three-pronged shadow root discovery strategy:
 * 1. TreeWalker scan of existing DOM
 * 2. MutationObserver for new shadow hosts
 * 3. Prototype interception of attachShadow
 */

import { getShadowRoot } from './closed-root-access';

export type ShadowRootCallback = (
  shadowRoot: ShadowRoot,
  host: Element,
) => void;

export class ShadowRootDiscovery {
  private observer: MutationObserver | null = null;
  private originalAttachShadow: typeof Element.prototype.attachShadow | null =
    null;
  private callback: ShadowRootCallback;
  private discovered = new WeakSet<ShadowRoot>();

  constructor(callback: ShadowRootCallback) {
    this.callback = callback;
  }

  /** Start all three discovery methods. */
  start(): void {
    this.scanExisting();
    this.observeMutations();
    this.interceptAttachShadow();
  }

  /** Stop all discovery. */
  stop(): void {
    this.observer?.disconnect();
    this.observer = null;

    if (this.originalAttachShadow) {
      Element.prototype.attachShadow = this.originalAttachShadow;
      this.originalAttachShadow = null;
    }
  }

  /** Strategy 1: Walk existing DOM for shadow hosts. */
  private scanExisting(): void {
    const walker = document.createTreeWalker(
      document.documentElement,
      NodeFilter.SHOW_ELEMENT,
    );

    let node: Node | null = walker.nextNode();
    while (node) {
      if (node instanceof Element) {
        const root = getShadowRoot(node);
        if (root && !this.discovered.has(root)) {
          this.discovered.add(root);
          this.callback(root, node);
          // Also scan inside the shadow root
          this.scanShadowTree(root);
        }
      }
      node = walker.nextNode();
    }
  }

  /** Recursively scan inside a shadow tree. */
  private scanShadowTree(root: ShadowRoot): void {
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT,
    );

    let node: Node | null = walker.nextNode();
    while (node) {
      if (node instanceof Element) {
        const nestedRoot = getShadowRoot(node);
        if (nestedRoot && !this.discovered.has(nestedRoot)) {
          this.discovered.add(nestedRoot);
          this.callback(nestedRoot, node);
          this.scanShadowTree(nestedRoot);
        }
      }
      node = walker.nextNode();
    }
  }

  /** Strategy 2: Observe DOM for new elements with shadow roots. */
  private observeMutations(): void {
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) {
            this.checkElement(node);
            // Check descendants
            const descendants = node.querySelectorAll('*');
            for (const desc of descendants) {
              this.checkElement(desc);
            }
          }
        }
      }
    });

    this.observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  private checkElement(el: Element): void {
    const root = getShadowRoot(el);
    if (root && !this.discovered.has(root)) {
      this.discovered.add(root);
      this.callback(root, el);
      this.scanShadowTree(root);
    }
  }

  /** Strategy 3: Intercept Element.prototype.attachShadow. */
  private interceptAttachShadow(): void {
    this.originalAttachShadow = Element.prototype.attachShadow;
    const originalFn = this.originalAttachShadow;
    const discovered = this.discovered;
    const callback = this.callback;

    Element.prototype.attachShadow = function (
      init: ShadowRootInit,
    ): ShadowRoot {
      const root = originalFn.call(this, init);
      if (!discovered.has(root)) {
        discovered.add(root);
        callback(root, this);
      }
      return root;
    };
  }
}
