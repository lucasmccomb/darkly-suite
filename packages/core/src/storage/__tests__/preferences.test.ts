import { createPreferencesManager } from '../preferences';
import { DEFAULT_PREFERENCES } from '../types';
import type { BaseUserPreferences } from '../types';
import { createMockConfig, createMockChromeStorage } from '../../__tests__/test-helpers';

const mockConfig = createMockConfig();
const { chromeMock, syncStorage, changeListeners, install, clearStorages } = createMockChromeStorage();

beforeAll(() => {
  install();
});

beforeEach(() => {
  jest.clearAllMocks();
  clearStorages();
});

describe('createPreferencesManager', () => {
  describe('load', () => {
    it('returns defaults when storage is empty', async () => {
      const manager = createPreferencesManager(mockConfig);
      const prefs = await manager.load();
      expect(prefs).toEqual(DEFAULT_PREFERENCES);
      expect(chromeMock.storage.sync.get).toHaveBeenCalledWith(mockConfig.storageKey);
    });

    it('merges stored values with defaults', async () => {
      syncStorage[mockConfig.storageKey] = { mode: 'dark', preset: 'nord' };
      const manager = createPreferencesManager(mockConfig);
      const prefs = await manager.load();
      expect(prefs.mode).toBe('dark');
      expect(prefs.preset).toBe('nord');
      // Other fields come from defaults
      expect(prefs.enabled).toBe(DEFAULT_PREFERENCES.enabled);
      expect(prefs.schedule).toEqual(DEFAULT_PREFERENCES.schedule);
    });

    it('uses the config storageKey (not hardcoded)', async () => {
      const sheetsConfig = createMockConfig({
        prefix: 'sd',
        storageKey: 'sd_preferences',
      });
      const manager = createPreferencesManager(sheetsConfig);
      await manager.load();
      expect(chromeMock.storage.sync.get).toHaveBeenCalledWith('sd_preferences');
    });
  });

  describe('save', () => {
    it('merges partial prefs with current and saves', async () => {
      const manager = createPreferencesManager(mockConfig);
      await manager.save({ mode: 'dark' });

      expect(chromeMock.storage.sync.set).toHaveBeenCalledTimes(1);
      const savedArg = chromeMock.storage.sync.set.mock.calls[0][0];
      const saved = savedArg[mockConfig.storageKey] as BaseUserPreferences;
      expect(saved.mode).toBe('dark');
      // Defaults preserved for other fields
      expect(saved.preset).toBe('default');
      expect(saved.enabled).toBe(true);
    });

    it('preserves existing stored values when saving partial update', async () => {
      syncStorage[mockConfig.storageKey] = { mode: 'dark', preset: 'nord' };
      const manager = createPreferencesManager(mockConfig);
      await manager.save({ enabled: false });

      const saved = chromeMock.storage.sync.set.mock.calls[0][0][mockConfig.storageKey] as BaseUserPreferences;
      expect(saved.mode).toBe('dark');
      expect(saved.preset).toBe('nord');
      expect(saved.enabled).toBe(false);
    });

    it('uses the config storageKey when saving', async () => {
      const docsConfig = createMockConfig({
        prefix: 'dd',
        storageKey: 'dd_preferences',
      });
      const manager = createPreferencesManager(docsConfig);
      await manager.save({ mode: 'dark' });

      const savedArg = chromeMock.storage.sync.set.mock.calls[0][0];
      expect(savedArg).toHaveProperty('dd_preferences');
    });

    it('rejects the caller when the underlying storage write fails', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      chromeMock.storage.sync.set.mockRejectedValueOnce(
        new Error('MAX_WRITE_OPERATIONS_PER_MINUTE quota exceeded'),
      );

      const manager = createPreferencesManager(mockConfig);
      await expect(manager.save({ mode: 'dark' })).rejects.toThrow(
        'MAX_WRITE_OPERATIONS_PER_MINUTE',
      );

      warnSpy.mockRestore();
    });

    it('continues processing subsequent saves after one save fails (queue is not poisoned)', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      // First write rejects (realistic under chrome.storage.sync write quotas);
      // the default mock implementation resumes for the next call.
      chromeMock.storage.sync.set.mockRejectedValueOnce(
        new Error('MAX_WRITE_OPERATIONS_PER_MINUTE quota exceeded'),
      );

      const manager = createPreferencesManager(mockConfig);
      await expect(manager.save({ mode: 'dark' })).rejects.toThrow();

      // The next save must still execute and persist.
      await manager.save({ mode: 'light' });
      expect(chromeMock.storage.sync.set).toHaveBeenCalledTimes(2);
      const saved = syncStorage[mockConfig.storageKey] as BaseUserPreferences;
      expect(saved.mode).toBe('light');

      // The failure was logged rather than silently swallowed.
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('preserves save ordering across a failed save', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      chromeMock.storage.sync.set.mockRejectedValueOnce(new Error('quota'));

      const manager = createPreferencesManager(mockConfig);
      const first = manager.save({ mode: 'dark' });
      const second = manager.save({ mode: 'schedule' });
      const third = manager.save({ mode: 'light' });

      await expect(first).rejects.toThrow('quota');
      await second;
      await third;

      // Saves after the failure ran in order; the last one wins.
      const saved = syncStorage[mockConfig.storageKey] as BaseUserPreferences;
      expect(saved.mode).toBe('light');
      expect(chromeMock.storage.sync.set).toHaveBeenCalledTimes(3);

      warnSpy.mockRestore();
    });
  });

  describe('onChange', () => {
    it('registers a listener on chrome.storage.onChanged', () => {
      const manager = createPreferencesManager(mockConfig);
      const callback = jest.fn();
      manager.onChange(callback);
      expect(chromeMock.storage.onChanged.addListener).toHaveBeenCalledTimes(1);
    });

    it('fires callback when the config storageKey changes in sync area', () => {
      const manager = createPreferencesManager(mockConfig);
      const callback = jest.fn();
      manager.onChange(callback);

      const listener = changeListeners[0];
      listener(
        {
          [mockConfig.storageKey]: {
            oldValue: { mode: 'light' },
            newValue: { mode: 'dark' },
          },
        },
        'sync',
      );

      expect(callback).toHaveBeenCalledTimes(1);
      const [newPrefs, oldPrefs] = callback.mock.calls[0];
      expect(newPrefs.mode).toBe('dark');
      expect(oldPrefs.mode).toBe('light');
      // Defaults are merged in
      expect(newPrefs.enabled).toBe(DEFAULT_PREFERENCES.enabled);
    });

    it('ignores changes from non-sync area', () => {
      const manager = createPreferencesManager(mockConfig);
      const callback = jest.fn();
      manager.onChange(callback);

      changeListeners[0](
        {
          [mockConfig.storageKey]: {
            oldValue: {},
            newValue: { mode: 'dark' },
          },
        },
        'local',
      );

      expect(callback).not.toHaveBeenCalled();
    });

    it('ignores changes to other keys', () => {
      const manager = createPreferencesManager(mockConfig);
      const callback = jest.fn();
      manager.onChange(callback);

      changeListeners[0](
        {
          some_other_key: {
            oldValue: 'a',
            newValue: 'b',
          },
        },
        'sync',
      );

      expect(callback).not.toHaveBeenCalled();
    });

    it('returns unsubscribe function that removes the listener', () => {
      const manager = createPreferencesManager(mockConfig);
      const callback = jest.fn();
      const unsubscribe = manager.onChange(callback);

      expect(chromeMock.storage.onChanged.addListener).toHaveBeenCalledTimes(1);
      unsubscribe();
      expect(chromeMock.storage.onChanged.removeListener).toHaveBeenCalledTimes(1);
    });

    it('uses different storage keys for different product configs', () => {
      const suiteConfig = createMockConfig({
        prefix: 'ds',
        storageKey: 'ds_gmail_preferences',
      });
      const manager = createPreferencesManager(suiteConfig);
      const callback = jest.fn();
      manager.onChange(callback);

      const listener = changeListeners[0];

      // Change to gd_preferences should be ignored
      listener(
        { gd_preferences: { oldValue: {}, newValue: { mode: 'dark' } } },
        'sync',
      );
      expect(callback).not.toHaveBeenCalled();

      // Change to ds_gmail_preferences should fire
      listener(
        { ds_gmail_preferences: { oldValue: {}, newValue: { mode: 'dark' } } },
        'sync',
      );
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });
});
