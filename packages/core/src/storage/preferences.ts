import type { ProductConfig } from '../config';
import type { BaseUserPreferences } from './types';
import { DEFAULT_PREFERENCES } from './types';

export interface PreferencesManager {
  load(): Promise<BaseUserPreferences>;
  save(prefs: Partial<BaseUserPreferences>): Promise<void>;
  onChange(callback: (newPrefs: BaseUserPreferences, oldPrefs: BaseUserPreferences) => void): () => void;
}

export function createPreferencesManager(config: ProductConfig): PreferencesManager {
  const key = config.storageKey;
  let saveQueue: Promise<void> = Promise.resolve();

  async function load(): Promise<BaseUserPreferences> {
    const result = await chrome.storage.sync.get(key);
    const stored = result[key];
    if (!stored) return { ...DEFAULT_PREFERENCES };
    return { ...DEFAULT_PREFERENCES, ...stored };
  }

  async function save(prefs: Partial<BaseUserPreferences>): Promise<void> {
    // Serialize saves to prevent read-modify-write races when
    // the toggle is clicked rapidly — each save reads the result
    // of the previous one.
    saveQueue = saveQueue.then(async () => {
      const current = await load();
      const merged = { ...current, ...prefs };
      await chrome.storage.sync.set({ [key]: merged });
    });
    return saveQueue;
  }

  function onChange(
    callback: (newPrefs: BaseUserPreferences, oldPrefs: BaseUserPreferences) => void,
  ): () => void {
    const listener = (
      changes: { [k: string]: chrome.storage.StorageChange },
      area: string,
    ) => {
      if (area !== 'sync' || !changes[key]) return;
      const oldPrefs = { ...DEFAULT_PREFERENCES, ...changes[key].oldValue };
      const newPrefs = { ...DEFAULT_PREFERENCES, ...changes[key].newValue };
      callback(newPrefs, oldPrefs);
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }

  return { load, save, onChange };
}
