// @darkly/core — two-key keyboard sequence matcher
//
// Handles Gmail-style chords where two keys are pressed one after the other
// ('g' then 'shift+T'), which the single-chord helper in ./keyboard-shortcuts
// cannot express — it splits on '+' and would treat 'g shift+t' as a bare 't'.

/** One key press in a sequence. */
export interface KeySequenceStep {
  /** Key to match, compared case-insensitively against `KeyboardEvent.key`. */
  key: string;
  /** Whether Shift must be held. Defaults to false, meaning Shift must NOT be held. */
  shift?: boolean;
}

export interface KeySequenceOptions {
  /** The prefix key followed by the key that completes the sequence. */
  sequence: [KeySequenceStep, KeySequenceStep];
  /** Called when the full sequence is matched. */
  onActivate: () => void;
  /** How long the prefix stays armed, in ms. Defaults to `SEQUENCE_TIMEOUT_MS`. */
  timeoutMs?: number;
}

/**
 * How long the first key of a sequence stays armed, in milliseconds.
 *
 * 1500ms matches the unhurried feel of Gmail's own two-key chords (`g` then
 * `i`, `g` then `t`): long enough that a deliberate two-key press never misses
 * even when the user pauses, short enough that a stray `g` typed a moment ago
 * does not silently arm the shortcut for whatever gets pressed next.
 */
export const SEQUENCE_TIMEOUT_MS = 1500;

/**
 * Keys that produce a keydown of their own while being held. Pressing
 * `shift+T` fires a `Shift` keydown first, so treating these as "some other
 * key" would cancel the prefix before the real second key ever arrived.
 */
const MODIFIER_KEYS = new Set([
  'Shift',
  'Control',
  'Alt',
  'Meta',
  'AltGraph',
  'CapsLock',
]);

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof el.tagName !== 'string') return false;
  return (
    el.isContentEditable === true ||
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA'
  );
}

function matchesStep(e: KeyboardEvent, step: KeySequenceStep): boolean {
  return (
    e.key.toLowerCase() === step.key.toLowerCase() &&
    e.shiftKey === (step.shift === true) &&
    !e.ctrlKey &&
    !e.altKey &&
    !e.metaKey
  );
}

/**
 * Registers a two-key sequence shortcut on `document`.
 *
 * The listener stays out of the host app's way: it only calls
 * `preventDefault()` when the full sequence matches, so a near miss (Gmail's
 * own `g` then `t`, "Go to Sent Mail") passes through untouched. Any other key
 * cancels a pending prefix, as does the timeout.
 *
 * @returns A cleanup function that removes the listener and clears any pending prefix.
 */
export function registerKeySequenceShortcut(
  options: KeySequenceOptions,
): () => void {
  const [prefixStep, finalStep] = options.sequence;
  const timeoutMs = options.timeoutMs ?? SEQUENCE_TIMEOUT_MS;

  // Non-null while the prefix is armed and waiting for the second key.
  let armedTimer: ReturnType<typeof setTimeout> | null = null;

  function disarm(): void {
    if (armedTimer !== null) {
      clearTimeout(armedTimer);
      armedTimer = null;
    }
  }

  function handler(e: KeyboardEvent): void {
    // Never steal keystrokes while the user is typing (Gmail's compose body is
    // contenteditable, not a textarea).
    if (isTypingTarget(e.target)) return;

    // A bare modifier keydown is part of pressing the next key, not a new key.
    if (MODIFIER_KEYS.has(e.key)) return;

    if (armedTimer !== null) {
      if (matchesStep(e, finalStep)) {
        disarm();
        e.preventDefault();
        e.stopPropagation();
        options.onActivate();
        return;
      }
      // Anything else ends the sequence — without preventDefault, so the host
      // app's own chord starting with the same prefix still works.
      disarm();
    }

    if (matchesStep(e, prefixStep)) {
      armedTimer = setTimeout(() => {
        armedTimer = null;
      }, timeoutMs);
    }
  }

  document.addEventListener('keydown', handler, true);

  return () => {
    disarm();
    document.removeEventListener('keydown', handler, true);
  };
}
