// @darkly/core — two-key keyboard sequence matcher tests

import { registerKeySequenceShortcut, SEQUENCE_TIMEOUT_MS } from '../keyboard-sequence';

// The sequence under test is Gmail's 'g shift+t': press `g`, then `T` with Shift.
const SEQUENCE = [{ key: 'g' }, { key: 't', shift: true }] as const;

let onActivate: jest.Mock;
let cleanup: () => void;

function register(timeoutMs?: number): void {
  onActivate = jest.fn();
  cleanup = registerKeySequenceShortcut({
    sequence: [{ ...SEQUENCE[0] }, { ...SEQUENCE[1] }],
    onActivate,
    ...(timeoutMs !== undefined && { timeoutMs }),
  });
}

interface PressOptions {
  shift?: boolean;
  ctrl?: boolean;
  meta?: boolean;
  target?: HTMLElement;
}

function press(key: string, opts: PressOptions = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key,
    shiftKey: opts.shift ?? false,
    ctrlKey: opts.ctrl ?? false,
    metaKey: opts.meta ?? false,
    bubbles: true,
    cancelable: true,
  });
  (opts.target ?? document.body).dispatchEvent(event);
  return event;
}

/** Appends an element to the document so events dispatched on it reach `document`. */
function mount<T extends HTMLElement>(el: T): T {
  document.body.appendChild(el);
  return el;
}

beforeEach(() => {
  jest.useFakeTimers();
  document.body.innerHTML = '';
  register();
});

afterEach(() => {
  cleanup();
  jest.useRealTimers();
});

describe('registerKeySequenceShortcut', () => {
  describe('matching the full sequence', () => {
    it('invokes the callback exactly once for `g` then shift+T', () => {
      press('g');
      press('T', { shift: true });

      expect(onActivate).toHaveBeenCalledTimes(1);
    });

    it('preventDefaults only the completing key, never the prefix', () => {
      const prefixEvent = press('g');
      const finalEvent = press('T', { shift: true });

      expect(prefixEvent.defaultPrevented).toBe(false);
      expect(finalEvent.defaultPrevented).toBe(true);
    });

    it('does not stay armed after firing — a second shift+T does nothing', () => {
      press('g');
      press('T', { shift: true });
      press('T', { shift: true });

      expect(onActivate).toHaveBeenCalledTimes(1);
    });

    it('fires again when the whole sequence is repeated', () => {
      press('g');
      press('T', { shift: true });
      press('g');
      press('T', { shift: true });

      expect(onActivate).toHaveBeenCalledTimes(2);
    });

    it('ignores the bare Shift keydown that precedes shift+T', () => {
      press('g');
      press('Shift', { shift: true });
      press('T', { shift: true });

      expect(onActivate).toHaveBeenCalledTimes(1);
    });
  });

  describe("near-miss: Gmail's own `g` then `t`", () => {
    it('does not invoke the callback', () => {
      press('g');
      press('t');

      expect(onActivate).not.toHaveBeenCalled();
    });

    it('does not preventDefault either key, so Gmail still handles `g t`', () => {
      const prefixEvent = press('g');
      const finalEvent = press('t');

      expect(prefixEvent.defaultPrevented).toBe(false);
      expect(finalEvent.defaultPrevented).toBe(false);
    });

    it('lets both keys reach a later listener, so Gmail still runs `g t`', () => {
      // Stands in for Gmail's own keydown handler: our matcher listens on the
      // capture phase, so it must not stop `g` or `t` from getting here.
      const seenByGmail: string[] = [];
      const gmailListener = (e: Event) => seenByGmail.push((e as KeyboardEvent).key);
      document.addEventListener('keydown', gmailListener);

      press('g');
      press('t');
      document.removeEventListener('keydown', gmailListener);

      expect(seenByGmail).toEqual(['g', 't']);
    });

    it('does swallow the completing key on a full match', () => {
      const seenByGmail: string[] = [];
      const gmailListener = (e: Event) => seenByGmail.push((e as KeyboardEvent).key);
      document.addEventListener('keydown', gmailListener);

      press('g');
      press('T', { shift: true });
      document.removeEventListener('keydown', gmailListener);

      expect(seenByGmail).toEqual(['g']);
    });

    it('does not invoke the callback for a bare shift+T with no prefix', () => {
      press('T', { shift: true });

      expect(onActivate).not.toHaveBeenCalled();
    });

    it('does not arm on `g` when a non-Shift modifier is held', () => {
      press('g', { meta: true });
      press('T', { shift: true });

      expect(onActivate).not.toHaveBeenCalled();
    });

    it('does not fire when a non-Shift modifier is held on the completing key', () => {
      press('g');
      press('T', { shift: true, ctrl: true });

      expect(onActivate).not.toHaveBeenCalled();
    });
  });

  describe('timeout', () => {
    it('does not fire when the second key arrives after the timeout', () => {
      press('g');
      jest.advanceTimersByTime(SEQUENCE_TIMEOUT_MS + 1);
      press('T', { shift: true });

      expect(onActivate).not.toHaveBeenCalled();
    });

    it('fires when the second key arrives just inside the timeout', () => {
      press('g');
      jest.advanceTimersByTime(SEQUENCE_TIMEOUT_MS - 1);
      press('T', { shift: true });

      expect(onActivate).toHaveBeenCalledTimes(1);
    });

    it('honours a custom timeout', () => {
      cleanup();
      register(50);

      press('g');
      jest.advanceTimersByTime(51);
      press('T', { shift: true });

      expect(onActivate).not.toHaveBeenCalled();
    });

    it('uses a timeout that matches the feel of a two-key chord', () => {
      expect(SEQUENCE_TIMEOUT_MS).toBeGreaterThanOrEqual(1000);
      expect(SEQUENCE_TIMEOUT_MS).toBeLessThanOrEqual(2000);
    });
  });

  describe('typing guard', () => {
    it('ignores the sequence typed in an <input>', () => {
      const input = mount(document.createElement('input'));

      press('g', { target: input });
      press('T', { shift: true, target: input });

      expect(onActivate).not.toHaveBeenCalled();
    });

    it('ignores the sequence typed in a <textarea>', () => {
      const textarea = mount(document.createElement('textarea'));

      press('g', { target: textarea });
      press('T', { shift: true, target: textarea });

      expect(onActivate).not.toHaveBeenCalled();
    });

    it('ignores the sequence typed in a contenteditable element (Gmail compose)', () => {
      const editable = mount(document.createElement('div'));
      editable.setAttribute('contenteditable', 'true');
      Object.defineProperty(editable, 'isContentEditable', { value: true });

      press('g', { target: editable });
      press('T', { shift: true, target: editable });

      expect(onActivate).not.toHaveBeenCalled();
    });

    it('does not complete a sequence whose second key lands in an <input>', () => {
      const input = mount(document.createElement('input'));

      press('g');
      press('T', { shift: true, target: input });

      expect(onActivate).not.toHaveBeenCalled();
    });
  });

  describe('cancellation', () => {
    it('drops the prefix when an unrelated key is pressed', () => {
      press('g');
      press('x');
      press('T', { shift: true });

      expect(onActivate).not.toHaveBeenCalled();
    });

    it('drops the prefix when the near-miss `t` is pressed', () => {
      press('g');
      press('t');
      press('T', { shift: true });

      expect(onActivate).not.toHaveBeenCalled();
    });

    it('re-arms when the prefix key is pressed twice', () => {
      press('g');
      press('g');
      press('T', { shift: true });

      expect(onActivate).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanup', () => {
    it('removes the listener so the sequence no longer fires', () => {
      cleanup();

      press('g');
      press('T', { shift: true });

      expect(onActivate).not.toHaveBeenCalled();
    });

    it('clears a pending prefix timer', () => {
      press('g');
      cleanup();

      expect(jest.getTimerCount()).toBe(0);
    });

    it('is safe to call twice', () => {
      cleanup();

      expect(() => cleanup()).not.toThrow();
    });
  });
});
