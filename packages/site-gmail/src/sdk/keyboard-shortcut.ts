// @darkly/site-gmail — the 'g shift+t' theme-toggle shortcut.
//
// This takes two pieces, because InboxSDK cannot deliver the chord for us:
//
//  1. `Keyboard.createShortcutHandle()` lists the chord in Gmail's `?` help
//     dialog. The handle it returns only exposes `remove()` — it never calls
//     back. A handle can be attached to a toolbar button so InboxSDK invokes
//     its onClick, but only `ToolbarButtonDescriptor` and
//     `LegacyToolbarButtonDescriptor` (the thread and list toolbars) take a
//     `keyboardShortcutHandle`. This extension uses
//     `Toolbars.addToolbarButtonForApp`, and `AppToolbarButtonDescriptor` has
//     no such field.
//
//  2. So the key press itself is matched by our own listener, via the shared
//     sequence matcher in @darkly/core.

import type { InboxSDK, KeyboardShortcutHandle } from '@inboxsdk/core';
import { registerKeySequenceShortcut } from '@darkly/core';

export const TOGGLE_THEME_CHORD = 'g shift+t';
export const TOGGLE_THEME_DESCRIPTION = 'Toggle Darkly theme';

/** Lists the chord in Gmail's keyboard-shortcut help dialog. Display only. */
export function registerShortcutHelpEntry(sdk: InboxSDK): KeyboardShortcutHandle {
  return sdk.Keyboard.createShortcutHandle({
    chord: TOGGLE_THEME_CHORD,
    description: TOGGLE_THEME_DESCRIPTION,
  });
}

/**
 * Matches `g` then `shift+T` and toggles the theme.
 *
 * Gmail's own `g` then `t` ("Go to Sent Mail") is a near miss: the second step
 * requires Shift, and the matcher only calls `preventDefault()` on a full
 * match, so the lowercase chord reaches Gmail untouched.
 *
 * @returns A cleanup function that removes the listener.
 */
export function registerToggleShortcut(onToggle: () => void): () => void {
  return registerKeySequenceShortcut({
    sequence: [{ key: 'g' }, { key: 't', shift: true }],
    onActivate: onToggle,
  });
}
