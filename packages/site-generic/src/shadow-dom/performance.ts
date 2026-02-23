/**
 * Shadow DOM Performance Optimization
 *
 * Techniques:
 * 1. Batch shadow root processing (avoid per-root processing overhead)
 * 2. Lazy injection for offscreen shadow roots
 * 3. Shared CSSStyleSheet instance across all shadow roots
 * 4. Rate limiting for rapid shadow root creation (SPAs)
 */

import type { ShadowStyleInjector } from './shadow-injector';

export interface ShadowPerfOptions {
  injector: ShadowStyleInjector;
  /** Maximum shadow roots to process per frame (default: 10). */
  batchSize?: number;
  /** Debounce delay in ms for batch processing (default: 16ms = ~1 frame). */
  debounceMs?: number;
}

export class ShadowPerfOptimizer {
  private queue: ShadowRoot[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private options: Required<ShadowPerfOptions>;
  private intersectionObserver: IntersectionObserver | null = null;
  private pendingOffscreen = new Map<Element, ShadowRoot>();

  constructor(options: ShadowPerfOptions) {
    this.options = {
      batchSize: options.batchSize ?? 10,
      debounceMs: options.debounceMs ?? 16,
      injector: options.injector,
    };
  }

  /** Queue a shadow root for batched injection. */
  enqueue(shadowRoot: ShadowRoot, host: Element): void {
    // Check if host is in viewport
    const rect = host.getBoundingClientRect();
    const inViewport = rect.bottom >= 0 && rect.top <= window.innerHeight;

    if (inViewport) {
      this.queue.push(shadowRoot);
      this.scheduleBatch();
    } else {
      // Defer offscreen shadow roots
      this.pendingOffscreen.set(host, shadowRoot);
      this.observeOffscreen(host);
    }
  }

  /** Start the intersection observer for lazy offscreen injection. */
  private observeOffscreen(host: Element): void {
    if (!this.intersectionObserver) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const root = this.pendingOffscreen.get(entry.target);
              if (root) {
                this.queue.push(root);
                this.pendingOffscreen.delete(entry.target);
                this.intersectionObserver?.unobserve(entry.target);
                this.scheduleBatch();
              }
            }
          }
        },
        { rootMargin: '200px' },
      );
    }
    this.intersectionObserver.observe(host);
  }

  private scheduleBatch(): void {
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      this.processBatch();
    }, this.options.debounceMs);
  }

  private processBatch(): void {
    const batch = this.queue.splice(0, this.options.batchSize);
    for (const root of batch) {
      this.options.injector.inject(root);
    }
    // If more in queue, schedule next batch
    if (this.queue.length > 0) {
      this.scheduleBatch();
    }
  }

  /** Clean up. */
  destroy(): void {
    if (this.timer) clearTimeout(this.timer);
    this.intersectionObserver?.disconnect();
    this.queue = [];
    this.pendingOffscreen.clear();
  }
}
