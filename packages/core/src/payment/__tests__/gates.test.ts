import { canUseFeature, gateProAction } from '../gates';
import { ThemeEngine } from '../../theme/engine';
import { createMockConfig, createMockChromeStorage } from '../../__tests__/test-helpers';

describe('canUseFeature', () => {
  it('returns true when user has Pro status', () => {
    expect(canUseFeature('presets', true)).toBe(true);
expect(canUseFeature('sunrise-sunset', true)).toBe(true);
    expect(canUseFeature('custom-accent', true)).toBe(true);
  });

  it('returns false when user does not have Pro status', () => {
    expect(canUseFeature('presets', false)).toBe(false);
expect(canUseFeature('sunrise-sunset', false)).toBe(false);
    expect(canUseFeature('custom-accent', false)).toBe(false);
  });

  it('returns false for unknown features when not Pro', () => {
    expect(canUseFeature('some-unknown-feature', false)).toBe(false);
  });

  it('returns true for unknown features when Pro', () => {
    expect(canUseFeature('some-unknown-feature', true)).toBe(true);
  });
});

// Exercised against a real ThemeEngine, because the thing being asserted is
// that a free user cannot reach the paid rendering. Theme CSS ships in the
// manifest, so setting the theme attribute is all it takes to unlock dark mode
// — a mocked toggle would not prove the attribute stays put.
describe('gateProAction', () => {
  const mockConfig = createMockConfig();
  const { install, clearStorages, syncStorage } = createMockChromeStorage();

  const themeAttribute = () =>
    document.documentElement.getAttribute(`data-${mockConfig.prefix}-theme`);

  /** ThemeEngine saves preferences without awaiting; let the write settle. */
  const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

  async function createEngine(): Promise<ThemeEngine> {
    const engine = new ThemeEngine(mockConfig, (fn) => fn());
    await engine.init();
    return engine;
  }

  beforeAll(() => {
    install();
  });

  beforeEach(() => {
    clearStorages();
    document.documentElement.removeAttribute(`data-${mockConfig.prefix}-theme`);
    document.documentElement.style.cssText = '';
  });

  it('toggles the theme for a Pro user', async () => {
    const engine = await createEngine();
    const openSettings = jest.fn();
    const toggleDarkMode = gateProAction(true, () => engine.toggle(), openSettings);

    expect(themeAttribute()).toBe('light');
    toggleDarkMode();

    expect(themeAttribute()).toBe('dark');
    expect(engine.getCurrentTheme()).toBe('dark');
    expect(openSettings).not.toHaveBeenCalled();
  });

  it('persists the Pro user’s mode change', async () => {
    const engine = await createEngine();
    const toggleDarkMode = gateProAction(true, () => engine.toggle(), jest.fn());

    toggleDarkMode();
    await flushPromises();

    expect(syncStorage[mockConfig.storageKey]).toMatchObject({ mode: 'dark' });
  });

  it('leaves the theme attribute unchanged for a free user', async () => {
    const engine = await createEngine();
    const openSettings = jest.fn();
    const toggleDarkMode = gateProAction(false, () => engine.toggle(), openSettings);

    toggleDarkMode();

    expect(themeAttribute()).toBe('light');
    expect(engine.getCurrentTheme()).toBe('light');
  });

  it('opens settings for a free user instead of silently doing nothing', async () => {
    const engine = await createEngine();
    const openSettings = jest.fn();
    const toggleDarkMode = gateProAction(false, () => engine.toggle(), openSettings);

    toggleDarkMode();

    expect(openSettings).toHaveBeenCalledTimes(1);
  });

  it('does not persist a mode change for a free user', async () => {
    const engine = await createEngine();
    const toggleDarkMode = gateProAction(false, () => engine.toggle(), jest.fn());

    toggleDarkMode();
    await flushPromises();

    expect(syncStorage[mockConfig.storageKey]).toBeUndefined();
  });

  it('keeps blocking a free user on repeated presses', async () => {
    const engine = await createEngine();
    const openSettings = jest.fn();
    const toggleDarkMode = gateProAction(false, () => engine.toggle(), openSettings);

    toggleDarkMode();
    toggleDarkMode();
    toggleDarkMode();

    expect(themeAttribute()).toBe('light');
    expect(openSettings).toHaveBeenCalledTimes(3);
  });

  it('does not run either callback until the returned handler is invoked', () => {
    const action = jest.fn();
    const onBlocked = jest.fn();

    gateProAction(false, action, onBlocked);

    expect(action).not.toHaveBeenCalled();
    expect(onBlocked).not.toHaveBeenCalled();
  });
});
