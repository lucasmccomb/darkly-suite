/**
 * GenericDarkMode — CSS filter-based dark mode for arbitrary websites.
 *
 * Phase 1 strategy: Uses CSS `filter: invert() hue-rotate()` to invert
 * page colors while preserving images/video. This works on any site without
 * site-specific CSS overrides.
 *
 * The filter acts as an "instant fallback" that can later be replaced by
 * more accurate per-site CSS overrides via `replaceWithOverrides()`.
 */

import type { PresetName } from '@darkly/core';
import { attemptCssVarFastPath } from './css-var-fast-path';

export interface GenericDarkModeOptions {
  /** Theme preset name (reserved for future preset support) */
  preset?: PresetName;
}

export class GenericDarkMode {
  private enabled = false;
  private filterElement: HTMLStyleElement | null = null;
  private overrideElement: HTMLStyleElement | null = null;

  /**
   * Apply JUST the CSS filter (no preset logic).
   * Idempotent — does nothing if the filter is already active.
   */
  enableFilter(): void {
    if (this.filterElement) return;
    const style = document.createElement('style');
    style.id = 'browse-darkly-filter';
    style.textContent = `
      html { filter: invert(0.93) hue-rotate(180deg) !important; }
      img, video, canvas, svg, picture,
      [style*="background-image"],
      embed, object, iframe { filter: invert(1) hue-rotate(180deg) !important; }
    `;
    document.documentElement.appendChild(style);
    this.filterElement = style;
  }

  /**
   * Remove JUST the CSS filter.
   */
  disableFilter(): void {
    this.filterElement?.remove();
    this.filterElement = null;
  }

  /**
   * Returns whether the CSS filter is currently injected.
   */
  isFilterActive(): boolean {
    return this.filterElement !== null;
  }

  /**
   * Enable dark mode on the current page using CSS filter inversion.
   * Images, videos, and other media are re-inverted to preserve their
   * original appearance.
   */
  enable(_preset?: string): void {
    if (this.enabled) return;
    this.enabled = true;
    this.enableFilter();
  }

  /**
   * Remove the dark mode filter and any overrides, restoring the page
   * to its original state.
   */
  disable(): void {
    if (!this.enabled) return;
    this.enabled = false;
    this.disableFilter();
    this.overrideElement?.remove();
    this.overrideElement = null;
  }

  /**
   * Toggle dark mode on/off.
   */
  toggle(): void {
    if (this.enabled) this.disable();
    else this.enable();
  }

  /**
   * Returns whether dark mode is currently active.
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Replace the CSS filter with accurate CSS overrides (atomic swap).
   * The override style is injected BEFORE the filter is removed to
   * prevent a flash of unstyled content.
   */
  replaceWithOverrides(css: string): void {
    const style = document.createElement('style');
    style.id = 'browse-darkly-overrides';
    style.textContent = css;
    document.documentElement.appendChild(style);
    this.overrideElement = style;
    // Remove filter AFTER override is injected (atomic swap)
    this.disableFilter();
  }

  /**
   * Attempt the smart dark mode pipeline:
   * 1. Enable filter (instant)
   * 2. Try CSS variable fast path
   * 3. If fast path works, swap filter for var overrides
   * 4. If not, filter stays as fallback
   * Returns true if fast path was used.
   */
  async attemptSmartDarkMode(): Promise<boolean> {
    // Step 1: Instant filter
    this.enable();

    // Step 2: Wait for DOM to be ready
    await new Promise<void>((resolve) => {
      if (
        document.readyState === 'complete' ||
        document.readyState === 'interactive'
      ) {
        resolve();
      } else {
        document.addEventListener('DOMContentLoaded', () => resolve(), {
          once: true,
        });
      }
    });

    // Step 3: Try CSS variable fast path
    const overrideCSS = attemptCssVarFastPath();

    if (overrideCSS) {
      this.replaceWithOverrides(overrideCSS);
      return true;
    }

    return false;
  }
}
