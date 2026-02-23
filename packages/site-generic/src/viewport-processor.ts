/**
 * Viewport-Aware Incremental Processing
 *
 * Processes above-fold elements first at high priority, then processes
 * below-fold elements at background priority. Uses IntersectionObserver
 * for scroll-triggered processing and scheduler.postTask() for priority.
 */

export interface ViewportProcessorOptions {
  /** Callback to process an element's styles. */
  processElement: (element: Element) => void;
  /** Root margin for IntersectionObserver (default: "200px" — 200px ahead of viewport). */
  rootMargin?: string;
}

export class ViewportProcessor {
  private observer: IntersectionObserver | null = null;
  private processed = new WeakSet<Element>();
  private options: ViewportProcessorOptions;

  constructor(options: ViewportProcessorOptions) {
    this.options = options;
  }

  /** Start viewport-aware processing. */
  start(): void {
    // Process currently visible elements immediately
    this.processVisibleElements();

    // Set up IntersectionObserver for elements that scroll into view
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !this.processed.has(entry.target)) {
            this.processed.add(entry.target);
            this.scheduleProcess(entry.target, 'user-visible');
            this.observer?.unobserve(entry.target);
          }
        }
      },
      { rootMargin: this.options.rootMargin || '200px' },
    );

    // Observe all unprocessed elements
    this.observeUnprocessedElements();
  }

  /** Stop all processing. */
  stop(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  private processVisibleElements(): void {
    const viewport = {
      top: 0,
      bottom: window.innerHeight,
    };

    // Process elements in the viewport at high priority
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      const rect = el.getBoundingClientRect();
      if (rect.bottom >= viewport.top && rect.top <= viewport.bottom) {
        if (!this.processed.has(el)) {
          this.processed.add(el);
          this.scheduleProcess(el, 'user-blocking');
        }
      }
    }
  }

  private observeUnprocessedElements(): void {
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      if (!this.processed.has(el)) {
        this.observer?.observe(el);
      }
    }
  }

  private scheduleProcess(
    element: Element,
    priority: 'user-blocking' | 'user-visible' | 'background',
  ): void {
    // Use scheduler.postTask if available
    if (
      'scheduler' in globalThis &&
      typeof (globalThis as Record<string, unknown>).scheduler === 'object'
    ) {
      const scheduler = (globalThis as Record<string, unknown>).scheduler as {
        postTask: (
          cb: () => void,
          options: { priority: string },
        ) => Promise<void>;
      };
      scheduler
        .postTask(() => this.options.processElement(element), { priority })
        .catch(() => {
          // Fallback if postTask fails
          this.options.processElement(element);
        });
    } else {
      // Fallback: requestIdleCallback for background, requestAnimationFrame for blocking
      if (priority === 'background' && 'requestIdleCallback' in globalThis) {
        requestIdleCallback(() => this.options.processElement(element));
      } else {
        requestAnimationFrame(() => this.options.processElement(element));
      }
    }
  }
}
