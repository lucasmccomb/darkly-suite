import { ThemeEngine } from '../engine';
import { createMockConfig, createMockChromeStorage } from '../../__tests__/test-helpers';

const mockConfig = createMockConfig();
const { chromeMock, syncStorage, install, clearStorages } = createMockChromeStorage();

beforeAll(() => {
  install();
});

beforeEach(() => {
  jest.clearAllMocks();
  clearStorages();
  document.documentElement.removeAttribute(`data-${mockConfig.prefix}-theme`);
  document.documentElement.removeAttribute(`data-${mockConfig.prefix}-preset`);
  document.documentElement.style.cssText = '';
});

describe('ThemeEngine', () => {
  describe('constructor and init', () => {
    it('initializes with system mode defaults (light theme)', async () => {
      const engine = new ThemeEngine(mockConfig, (fn) => fn());
      await engine.init();

      expect(document.documentElement.getAttribute(`data-${mockConfig.prefix}-theme`)).toBe('light');
      expect(engine.getCurrentTheme()).toBe('light');
    });

    it('restores dark mode from stored preferences', async () => {
      syncStorage[mockConfig.storageKey] = { mode: 'dark', preset: 'default' };

      const engine = new ThemeEngine(mockConfig, (fn) => fn());
      await engine.init();

      expect(document.documentElement.getAttribute(`data-${mockConfig.prefix}-theme`)).toBe('dark');
      expect(engine.getCurrentTheme()).toBe('dark');
    });

    it('restores preset from stored preferences', async () => {
      syncStorage[mockConfig.storageKey] = { mode: 'dark', preset: 'nord' };

      const engine = new ThemeEngine(mockConfig, (fn) => fn());
      await engine.init();

      expect(document.documentElement.getAttribute(`data-${mockConfig.prefix}-preset`)).toBe('nord');
    });
  });

  describe('apply', () => {
    it('sets theme attribute on document element', async () => {
      const engine = new ThemeEngine(mockConfig, (fn) => fn());
      await engine.init();

      engine.apply('dark');
      expect(document.documentElement.getAttribute(`data-${mockConfig.prefix}-theme`)).toBe('dark');
      expect(engine.getCurrentTheme()).toBe('dark');
    });

    it('does not re-apply same theme', async () => {
      syncStorage[mockConfig.storageKey] = { mode: 'dark', preset: 'default' };
      const engine = new ThemeEngine(mockConfig, (fn) => fn());
      await engine.init();

      const attrBefore = document.documentElement.getAttribute(`data-${mockConfig.prefix}-theme`);
      engine.apply('dark');
      const attrAfter = document.documentElement.getAttribute(`data-${mockConfig.prefix}-theme`);

      expect(attrBefore).toBe(attrAfter);
    });

    it('does NOT save to preferences', async () => {
      const engine = new ThemeEngine(mockConfig, (fn) => fn());
      await engine.init();
      chromeMock.storage.sync.set.mockClear();

      engine.apply('dark');

      expect(chromeMock.storage.sync.set).not.toHaveBeenCalled();
    });
  });

  describe('toggle', () => {
    it('toggles from light to dark', async () => {
      const engine = new ThemeEngine(mockConfig, (fn) => fn());
      await engine.init();

      engine.toggle();

      expect(engine.getCurrentTheme()).toBe('dark');
    });

    it('toggles from dark to light', async () => {
      syncStorage[mockConfig.storageKey] = { mode: 'dark', preset: 'default' };
      const engine = new ThemeEngine(mockConfig, (fn) => fn());
      await engine.init();

      engine.toggle();

      expect(engine.getCurrentTheme()).toBe('light');
    });

    it('saves mode to preferences', async () => {
      const engine = new ThemeEngine(mockConfig, (fn) => fn());
      await engine.init();
      chromeMock.storage.sync.set.mockClear();

      engine.toggle();

      // toggle() fires save() as fire-and-forget; flush microtasks
      await new Promise((r) => setTimeout(r, 0));

      expect(chromeMock.storage.sync.set).toHaveBeenCalledTimes(1);
      const savedArg = chromeMock.storage.sync.set.mock.calls[0][0];
      expect(savedArg[mockConfig.storageKey]).toMatchObject({ mode: 'dark' });
    });
  });

  describe('applyPreset', () => {
    it('sets preset attribute on document element', async () => {
      const engine = new ThemeEngine(mockConfig, (fn) => fn());
      await engine.init();

      engine.applyPreset('nord');

      expect(document.documentElement.getAttribute(`data-${mockConfig.prefix}-preset`)).toBe('nord');
    });

    it('does not re-apply same preset', async () => {
      syncStorage[mockConfig.storageKey] = { mode: 'dark', preset: 'nord' };
      const engine = new ThemeEngine(mockConfig, (fn) => fn());
      await engine.init();

      const attrBefore = document.documentElement.getAttribute(`data-${mockConfig.prefix}-preset`);
      engine.applyPreset('nord');
      const attrAfter = document.documentElement.getAttribute(`data-${mockConfig.prefix}-preset`);

      expect(attrBefore).toBe(attrAfter);
    });

    it('removes preset attribute when switching to default', async () => {
      syncStorage[mockConfig.storageKey] = { mode: 'dark', preset: 'nord' };
      const engine = new ThemeEngine(mockConfig, (fn) => fn());
      await engine.init();

      engine.applyPreset('default');

      expect(document.documentElement.getAttribute(`data-${mockConfig.prefix}-preset`)).toBeNull();
    });

    it('does NOT save to preferences', async () => {
      const engine = new ThemeEngine(mockConfig, (fn) => fn());
      await engine.init();
      chromeMock.storage.sync.set.mockClear();

      engine.applyPreset('nord');

      expect(chromeMock.storage.sync.set).not.toHaveBeenCalled();
    });
  });

  describe('prefix parameterization', () => {
    it('uses the config prefix for theme attributes', async () => {
      const sheetsConfig = createMockConfig({ prefix: 'sd', storageKey: 'sd_preferences' });
      const engine = new ThemeEngine(sheetsConfig, (fn) => fn());
      await engine.init();

      engine.apply('dark');

      expect(document.documentElement.getAttribute('data-sd-theme')).toBe('dark');
      // The gd attribute should NOT be set
      expect(document.documentElement.getAttribute('data-gd-theme')).toBeNull();
    });

    it('uses the config prefix for preset attributes', async () => {
      const docsConfig = createMockConfig({ prefix: 'dd', storageKey: 'dd_preferences' });
      const engine = new ThemeEngine(docsConfig, (fn) => fn());
      await engine.init();

      engine.applyPreset('nord');

      expect(document.documentElement.getAttribute('data-dd-preset')).toBe('nord');
    });
  });

  describe('setGridPreference', () => {
    it('sets grid preserve attribute with config prefix', async () => {
      const sheetsConfig = createMockConfig({ prefix: 'sd', storageKey: 'sd_preferences' });
      const engine = new ThemeEngine(sheetsConfig, (fn) => fn());
      await engine.init();

      engine.setGridPreference(true);
      expect(document.documentElement.getAttribute('data-sd-grid')).toBe('preserve');

      engine.setGridPreference(false);
      expect(document.documentElement.getAttribute('data-sd-grid')).toBeNull();
    });
  });

  describe('setPagelessMode', () => {
    it('sets pageless mode attribute with config prefix', async () => {
      const docsConfig = createMockConfig({ prefix: 'dd', storageKey: 'dd_preferences' });
      const engine = new ThemeEngine(docsConfig, (fn) => fn());
      await engine.init();

      engine.setPagelessMode(true);
      expect(document.documentElement.getAttribute('data-dd-page')).toBe('pageless');

      engine.setPagelessMode(false);
      expect(document.documentElement.getAttribute('data-dd-page')).toBeNull();
    });
  });
});
