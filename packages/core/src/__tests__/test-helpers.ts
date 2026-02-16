import type { ProductConfig } from '../config';

/**
 * Creates a mock ProductConfig for testing.
 * All modules in @darkly/core are parameterized via ProductConfig,
 * so tests inject this mock instead of hardcoding prefixes.
 */
export function createMockConfig(overrides?: Partial<ProductConfig>): ProductConfig {
  return {
    productId: 'gmail',
    productName: 'Gmail Darkly',
    prefix: 'gd',
    storageKey: 'gd_preferences',
    tokenKey: 'gd_token',
    proCacheKey: 'gd_pro_cache',
    apiBase: 'https://darklysuite.com/api',
    alarmName: 'gd_alarm',
    tabUrlPattern: '*://mail.google.com/*',
    ...overrides,
  };
}

/**
 * Creates a mock chrome.storage setup for tests.
 * Returns the mock objects so tests can inspect calls and manipulate storage.
 */
export function createMockChromeStorage() {
  const syncStorage: Record<string, unknown> = {};
  const localStorage: Record<string, unknown> = {};

  type StorageChangeListener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    area: string,
  ) => void;

  type LocalChangeListener = (
    changes: Record<string, chrome.storage.StorageChange>,
  ) => void;

  const changeListeners: StorageChangeListener[] = [];
  const localOnChangedListeners: LocalChangeListener[] = [];

  const mockSyncGet = jest.fn(async (key: string) => ({
    [key]: syncStorage[key],
  }));

  const mockSyncSet = jest.fn(async (items: Record<string, unknown>) => {
    Object.assign(syncStorage, items);
  });

  const mockLocalGet = jest.fn(async (key: string) => ({
    [key]: localStorage[key],
  }));

  const mockLocalSet = jest.fn(async (items: Record<string, unknown>) => {
    const changes: Record<string, chrome.storage.StorageChange> = {};
    for (const [k, v] of Object.entries(items)) {
      changes[k] = { oldValue: localStorage[k], newValue: v };
      localStorage[k] = v;
    }
    for (const listener of localOnChangedListeners) {
      listener(changes);
    }
  });

  const mockLocalRemove = jest.fn(async (key: string) => {
    delete localStorage[key];
  });

  const mockAddListener = jest.fn((cb: StorageChangeListener) => {
    changeListeners.push(cb);
  });

  const mockRemoveListener = jest.fn((cb: StorageChangeListener) => {
    const idx = changeListeners.indexOf(cb);
    if (idx >= 0) changeListeners.splice(idx, 1);
  });

  const mockLocalAddListener = jest.fn((cb: LocalChangeListener) => {
    localOnChangedListeners.push(cb);
  });

  const chromeMock = {
    storage: {
      sync: {
        get: mockSyncGet,
        set: mockSyncSet,
      },
      local: {
        get: mockLocalGet,
        set: mockLocalSet,
        remove: mockLocalRemove,
        onChanged: {
          addListener: mockLocalAddListener,
        },
      },
      onChanged: {
        addListener: mockAddListener,
        removeListener: mockRemoveListener,
      },
    },
    runtime: {
      sendMessage: jest.fn(),
    },
  };

  function install() {
    Object.defineProperty(globalThis, 'chrome', {
      value: chromeMock,
      writable: true,
      configurable: true,
    });
  }

  function clearStorages() {
    for (const key of Object.keys(syncStorage)) delete syncStorage[key];
    for (const key of Object.keys(localStorage)) delete localStorage[key];
    changeListeners.length = 0;
    localOnChangedListeners.length = 0;
  }

  return {
    chromeMock,
    syncStorage,
    localStorage,
    changeListeners,
    localOnChangedListeners,
    install,
    clearStorages,
  };
}
