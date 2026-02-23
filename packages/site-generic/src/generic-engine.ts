/**
 * GenericDarkMode — CSS filter-based dark mode for arbitrary websites.
 *
 * Phase 1 strategy: Uses CSS `filter: invert() hue-rotate()` to invert
 * page colors while preserving images/video. This works on any site without
 * site-specific CSS overrides.
 *
 * Future phases may add:
 * - Per-element color analysis and targeted CSS variable injection
 * - Site-specific override packs (community-contributed)
 * - Smart element detection (distinguish content vs. chrome)
 */

import type { PresetName } from '@darkly/core';

export interface GenericDarkModeOptions {
  /** Theme preset name (reserved for future preset support) */
  preset?: PresetName;
}

export class GenericDarkMode {
  private enabled = false;
  private styleElement: HTMLStyleElement | null = null;

  /**
   * Enable dark mode on the current page using CSS filter inversion.
   * Images, videos, and other media are re-inverted to preserve their
   * original appearance.
   */
  enable(_preset?: string): void {
    if (this.enabled) return;
    this.enabled = true;

    const style = document.createElement('style');
    style.id = 'browse-darkly-filter';
    style.textContent = `
      html {
        filter: invert(0.93) hue-rotate(180deg) !important;
      }
      img, video, canvas, svg, picture,
      [style*="background-image"],
      embed, object, iframe {
        filter: invert(1) hue-rotate(180deg) !important;
      }
    `;
    document.documentElement.appendChild(style);
    this.styleElement = style;
  }

  /**
   * Remove the dark mode filter, restoring the page to its original state.
   */
  disable(): void {
    if (!this.enabled) return;
    this.enabled = false;
    this.styleElement?.remove();
    this.styleElement = null;
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
}
