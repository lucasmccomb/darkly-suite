// Per-site settings section for Google Sheets.
// Provides a "Preserve Grid Colors" toggle that re-inverts the Waffle grid
// canvas cells to keep them light while the rest of the UI is dark.

import React, { useEffect, useState, useCallback } from 'react';
import { Toggle, usePrefix } from '@darkly/core';

const STORAGE_KEY_SUFFIX = '_site_sheets';

function getSiteStorageKey(prefix: string): string {
  return `${prefix}${STORAGE_KEY_SUFFIX}`;
}

interface SheetsPreferences {
  preserveGridColors: boolean;
}

const DEFAULT_SHEETS_PREFS: SheetsPreferences = {
  preserveGridColors: false,
};

function applyGridAttribute(prefix: string, preserve: boolean): void {
  if (preserve) {
    document.documentElement.setAttribute(`data-${prefix}-grid`, 'preserve');
  } else {
    document.documentElement.removeAttribute(`data-${prefix}-grid`);
  }
}

export function SheetsSettingsSection(): React.ReactElement {
  const p = usePrefix();
  const [prefs, setPrefs] = useState<SheetsPreferences>(DEFAULT_SHEETS_PREFS);

  useEffect(() => {
    const storageKey = getSiteStorageKey(p);

    // Load saved prefs
    chrome.storage.sync.get(storageKey).then((result) => {
      const stored = result[storageKey] as Partial<SheetsPreferences> | undefined;
      if (stored) {
        const merged = { ...DEFAULT_SHEETS_PREFS, ...stored };
        setPrefs(merged);
        applyGridAttribute(p, merged.preserveGridColors);
      }
    });

    // Listen for changes from other tabs/contexts
    const listener = (
      changes: { [k: string]: chrome.storage.StorageChange },
      area: string,
    ) => {
      if (area !== 'sync' || !changes[storageKey]) return;
      const newPrefs = { ...DEFAULT_SHEETS_PREFS, ...changes[storageKey].newValue };
      setPrefs(newPrefs);
      applyGridAttribute(p, newPrefs.preserveGridColors);
    };
    chrome.storage.onChanged.addListener(listener);

    return () => chrome.storage.onChanged.removeListener(listener);
  }, [p]);

  const togglePreserveGrid = useCallback(
    (preserveGridColors: boolean) => {
      const updated = { ...prefs, preserveGridColors };
      setPrefs(updated);
      applyGridAttribute(p, preserveGridColors);

      const storageKey = getSiteStorageKey(p);
      chrome.storage.sync.set({ [storageKey]: updated });
    },
    [prefs, p],
  );

  return (
    <div className={`${p}-settings-section`}>
      <h3 className={`${p}-settings-section-title`}>Sheets</h3>
      <p className={`${p}-settings-hint`}>
        Keep the spreadsheet grid in its original light appearance while the rest of the UI is dark.
      </p>
      <Toggle
        label="Preserve Grid Colors"
        checked={prefs.preserveGridColors}
        onChange={togglePreserveGrid}
      />
    </div>
  );
}
