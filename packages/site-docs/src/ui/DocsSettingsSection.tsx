// Per-site settings section for Google Docs.
// Provides a "Preserve Page Colors" toggle that re-inverts Kix canvas tiles
// to keep document pages in their original light appearance while the UI is dark.

import React, { useEffect, useState, useCallback } from 'react';
import { Toggle, usePrefix } from '@darkly/core';

const STORAGE_KEY_SUFFIX = '_site_docs';

function getSiteStorageKey(prefix: string): string {
  return `${prefix}${STORAGE_KEY_SUFFIX}`;
}

interface DocsPreferences {
  preservePageColors: boolean;
}

const DEFAULT_DOCS_PREFS: DocsPreferences = {
  preservePageColors: false,
};

function applyPageAttribute(prefix: string, preserve: boolean): void {
  if (preserve) {
    document.documentElement.setAttribute(`data-${prefix}-page`, 'preserve');
  } else {
    document.documentElement.removeAttribute(`data-${prefix}-page`);
  }
}

export function DocsSettingsSection(): React.ReactElement {
  const p = usePrefix();
  const [prefs, setPrefs] = useState<DocsPreferences>(DEFAULT_DOCS_PREFS);

  useEffect(() => {
    const storageKey = getSiteStorageKey(p);

    // Load saved prefs
    chrome.storage.sync.get(storageKey).then((result) => {
      const stored = result[storageKey] as Partial<DocsPreferences> | undefined;
      if (stored) {
        const merged = { ...DEFAULT_DOCS_PREFS, ...stored };
        setPrefs(merged);
        applyPageAttribute(p, merged.preservePageColors);
      }
    });

    // Listen for changes from other tabs/contexts
    const listener = (
      changes: { [k: string]: chrome.storage.StorageChange },
      area: string,
    ) => {
      if (area !== 'sync' || !changes[storageKey]) return;
      const newPrefs = { ...DEFAULT_DOCS_PREFS, ...changes[storageKey].newValue };
      setPrefs(newPrefs);
      applyPageAttribute(p, newPrefs.preservePageColors);
    };
    chrome.storage.onChanged.addListener(listener);

    return () => chrome.storage.onChanged.removeListener(listener);
  }, [p]);

  const togglePreservePages = useCallback(
    (preservePageColors: boolean) => {
      const updated = { ...prefs, preservePageColors };
      setPrefs(updated);
      applyPageAttribute(p, preservePageColors);

      const storageKey = getSiteStorageKey(p);
      chrome.storage.sync.set({ [storageKey]: updated });
    },
    [prefs, p],
  );

  return (
    <div className={`${p}-settings-section`}>
      <h3 className={`${p}-settings-section-title`}>Docs</h3>
      <p className={`${p}-settings-hint`}>
        Keep document pages in their original light appearance while the rest of the UI is dark.
      </p>
      <Toggle
        label="Preserve Page Colors"
        checked={prefs.preservePageColors}
        onChange={togglePreservePages}
      />
    </div>
  );
}
