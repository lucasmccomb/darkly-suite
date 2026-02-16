import type { ProductConfig } from '../config';

export interface KeyboardShortcutOptions {
  /** The keyboard shortcut chord (e.g., 'Shift+D', 'Ctrl+Shift+T') */
  chord: string;
  /** Description shown in help dialogs */
  description: string;
  /** Callback when the shortcut is triggered */
  onActivate: () => void;
}

/**
 * Registers a keyboard shortcut for toggling the dark theme.
 * This is the generic handler; site plugins can wrap this with
 * platform-specific integrations (e.g., InboxSDK Keyboard API).
 *
 * Returns a cleanup function to remove the listener.
 */
export function registerKeyboardShortcut(
  config: ProductConfig,
  options: KeyboardShortcutOptions,
): () => void {
  const { chord, onActivate } = options;

  // Parse the chord string (e.g., 'Shift+D' or 'Ctrl+Shift+T')
  const parts = chord.toLowerCase().split('+');
  const key = parts[parts.length - 1];
  const needsCtrl = parts.includes('ctrl');
  const needsShift = parts.includes('shift');
  const needsAlt = parts.includes('alt');
  const needsMeta = parts.includes('meta');

  function handler(e: KeyboardEvent): void {
    // Don't trigger when typing in inputs/textareas
    const target = e.target as HTMLElement;
    if (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }

    if (
      e.key.toLowerCase() === key &&
      e.ctrlKey === needsCtrl &&
      e.shiftKey === needsShift &&
      e.altKey === needsAlt &&
      e.metaKey === needsMeta
    ) {
      e.preventDefault();
      onActivate();
    }
  }

  document.addEventListener('keydown', handler);

  return () => document.removeEventListener('keydown', handler);
}
