import type { ProductConfig } from '../config';

/**
 * Creates a mock ProductConfig for testing.
 * All modules in @darkly/core are parameterized via ProductConfig,
 * so tests inject this mock instead of hardcoding prefixes.
 */
export function createMockConfig(overrides?: Partial<ProductConfig>): ProductConfig {
  return {
    productId: 'gmail',
    productName: 'Darkly for Gmail',
    prefix: 'gd',
    storageKey: 'gd_preferences',
    tokenKey: 'gd_token',
    proCacheKey: 'gd_pro_cache',
    apiBase: 'https://darklysuite.com/api',
    siteBase: 'https://gmaildarkly.com',
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
  const sessionStorage: Record<string, unknown> = {};

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

  const mockSessionGet = jest.fn(async (key: string) => ({
    [key]: sessionStorage[key],
  }));

  const mockSessionSet = jest.fn(async (items: Record<string, unknown>) => {
    Object.assign(sessionStorage, items);
  });

  const mockSessionRemove = jest.fn(async (key: string) => {
    delete sessionStorage[key];
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
      session: {
        get: mockSessionGet,
        set: mockSessionSet,
        remove: mockSessionRemove,
      },
      onChanged: {
        addListener: mockAddListener,
        removeListener: mockRemoveListener,
      },
    },
    alarms: {
      create: jest.fn(async () => {}),
      clear: jest.fn(async () => true),
    },
    runtime: {
      // Mirrors MV3 behavior: callback form invokes the callback,
      // promise form (no callback) returns a promise.
      sendMessage: jest.fn((_message: unknown, callback?: (response: unknown) => void) => {
        if (callback) {
          callback(null);
          return undefined;
        }
        return Promise.resolve(null);
      }),
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
    for (const key of Object.keys(sessionStorage)) delete sessionStorage[key];
    changeListeners.length = 0;
    localOnChangedListeners.length = 0;
  }

  return {
    chromeMock,
    syncStorage,
    localStorage,
    sessionStorage,
    changeListeners,
    localOnChangedListeners,
    install,
    clearStorages,
  };
}
