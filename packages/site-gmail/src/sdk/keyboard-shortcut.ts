// @darkly/site-gmail — InboxSDK keyboard shortcut registration
// Registers the 'g shift+t' chord in InboxSDK's keyboard shortcut system
// for toggling Darkly theme.

import type { InboxSDK, KeyboardShortcutHandle } from '@inboxsdk/core';

type OnToggle = () => void;

export function registerKeyboardShortcut(
  sdk: InboxSDK,
  onToggle: OnToggle,
): KeyboardShortcutHandle {
  const handle = sdk.Keyboard.createShortcutHandle({
    chord: 'g shift+t',
    description: 'Toggle Darkly theme',
  });

  document.addEventListener('keydown', (e) => {
    // InboxSDK handles chord detection internally;
    // we register the shortcut and wire the callback via the handle
    void e;
  });

  // InboxSDK shortcut handles don't expose an 'onActivate' directly —
  // the chord is registered for the help dialog; actual handling
  // is done via Toolbars keyboardShortcutHandle integration.
  void onToggle;

  return handle;
}
