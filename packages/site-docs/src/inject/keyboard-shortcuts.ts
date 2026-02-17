// @darkly/site-docs — Keyboard Shortcuts
// Registers keyboard shortcuts for the extension.
// Uses Alt+Shift combinations to avoid conflicting with Docs' built-in shortcuts.

interface ShortcutHandlers {
  toggleDarkMode: () => void;
  openSettings: () => void;
}

/**
 * Register keyboard shortcuts.
 *
 * - Alt+Shift+D = toggle dark mode
 * - Alt+Shift+S = open settings panel
 *
 * @returns A cleanup function to unregister all shortcuts.
 */
export function registerKeyboardShortcuts(
  handlers: ShortcutHandlers,
): () => void {
  const listener = (e: KeyboardEvent) => {
    if (!e.altKey || !e.shiftKey) return;

    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    switch (e.key.toUpperCase()) {
      case 'D':
        e.preventDefault();
        e.stopPropagation();
        handlers.toggleDarkMode();
        break;

      case 'S':
        e.preventDefault();
        e.stopPropagation();
        handlers.openSettings();
        break;
    }
  };

  document.addEventListener('keydown', listener, true);

  return () => {
    document.removeEventListener('keydown', listener, true);
  };
}
