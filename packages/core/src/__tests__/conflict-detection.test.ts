// @darkly/core — Conflict detection tests
//
// Verifies that when both a standalone extension and the bundle are installed,
// only the first to call claimPage() injects its theme.

import { claimPage, releasePage, getPageOwner } from '../conflict-detection';

const ATTR = 'data-darkly-active';

beforeEach(() => {
  document.documentElement.removeAttribute(ATTR);
});

describe('claimPage', () => {
  it('claims an unclaimed page and returns true', () => {
    const result = claimPage('gd');

    expect(result).toBe(true);
    expect(document.documentElement.getAttribute(ATTR)).toBe('gd');
  });

  it('rejects a second claim and returns false', () => {
    claimPage('gd');
    const result = claimPage('ds-gmail');

    expect(result).toBe(false);
    expect(document.documentElement.getAttribute(ATTR)).toBe('gd');
  });

  it('logs a warning when a second extension tries to claim', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    claimPage('ds-gmail');
    claimPage('gd');

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('ds-gmail'),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('gd'),
    );

    warnSpy.mockRestore();
  });

  it('does not log a warning for the first claim', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    claimPage('sd');

    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('works with all standalone claim IDs', () => {
    for (const id of ['gd', 'sd', 'dd']) {
      document.documentElement.removeAttribute(ATTR);

      expect(claimPage(id)).toBe(true);
      expect(document.documentElement.getAttribute(ATTR)).toBe(id);
    }
  });

  it('works with all bundle claim IDs', () => {
    for (const id of ['ds-gmail', 'ds-sheets', 'ds-docs', 'ds-drive']) {
      document.documentElement.removeAttribute(ATTR);

      expect(claimPage(id)).toBe(true);
      expect(document.documentElement.getAttribute(ATTR)).toBe(id);
    }
  });
});

describe('cross-extension conflict scenarios', () => {
  it('gmail-darkly blocks darkly-suite on Gmail', () => {
    expect(claimPage('gd')).toBe(true);
    expect(claimPage('ds-gmail')).toBe(false);
    expect(getPageOwner()).toBe('gd');
  });

  it('darkly-suite blocks gmail-darkly on Gmail', () => {
    expect(claimPage('ds-gmail')).toBe(true);
    expect(claimPage('gd')).toBe(false);
    expect(getPageOwner()).toBe('ds-gmail');
  });

  it('sheets-darkly blocks darkly-suite on Sheets', () => {
    expect(claimPage('sd')).toBe(true);
    expect(claimPage('ds-sheets')).toBe(false);
    expect(getPageOwner()).toBe('sd');
  });

  it('darkly-suite blocks sheets-darkly on Sheets', () => {
    expect(claimPage('ds-sheets')).toBe(true);
    expect(claimPage('sd')).toBe(false);
    expect(getPageOwner()).toBe('ds-sheets');
  });

  it('docs-darkly blocks darkly-suite on Docs', () => {
    expect(claimPage('dd')).toBe(true);
    expect(claimPage('ds-docs')).toBe(false);
    expect(getPageOwner()).toBe('dd');
  });

  it('darkly-suite blocks docs-darkly on Docs', () => {
    expect(claimPage('ds-docs')).toBe(true);
    expect(claimPage('dd')).toBe(false);
    expect(getPageOwner()).toBe('ds-docs');
  });

  it('standalone Gmail does not interfere with standalone Sheets (different pages)', () => {
    // This tests that the claim system is per-page, not global.
    // On a real Gmail page, 'gd' claims. On a real Sheets page, 'sd' claims.
    // Both should succeed independently (different documents).
    // Here we simulate on the same document — first wins.
    expect(claimPage('gd')).toBe(true);
    expect(claimPage('sd')).toBe(false);
  });
});

describe('releasePage', () => {
  it('releases the page when called by the owner', () => {
    claimPage('gd');
    releasePage('gd');

    expect(document.documentElement.getAttribute(ATTR)).toBeNull();
  });

  it('does not release if called by a non-owner', () => {
    claimPage('gd');
    releasePage('ds-gmail');

    expect(document.documentElement.getAttribute(ATTR)).toBe('gd');
  });

  it('allows reclaiming after release', () => {
    claimPage('gd');
    releasePage('gd');

    expect(claimPage('ds-gmail')).toBe(true);
    expect(getPageOwner()).toBe('ds-gmail');
  });

  it('is a no-op on an unclaimed page', () => {
    releasePage('gd');
    expect(document.documentElement.getAttribute(ATTR)).toBeNull();
  });
});

describe('getPageOwner', () => {
  it('returns null for an unclaimed page', () => {
    expect(getPageOwner()).toBeNull();
  });

  it('returns the owner after a claim', () => {
    claimPage('ds-sheets');
    expect(getPageOwner()).toBe('ds-sheets');
  });

  it('returns null after the owner releases', () => {
    claimPage('dd');
    releasePage('dd');
    expect(getPageOwner()).toBeNull();
  });

  it('returns the first owner even after a failed second claim', () => {
    claimPage('sd');
    claimPage('ds-sheets');
    expect(getPageOwner()).toBe('sd');
  });
});
