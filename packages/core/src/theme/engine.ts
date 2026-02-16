import type { PresetName } from '../storage/types';
import type { ProductConfig } from '../config';
import { createPreferencesManager } from '../storage/preferences';
import { getPreset } from './presets';
import { withTransition } from './transitions';

export class ThemeEngine {
  private config: ProductConfig;
  private currentTheme: 'light' | 'dark' = 'light';
  private currentPreset: PresetName = 'default';
  private prefs: ReturnType<typeof createPreferencesManager>;

  constructor(config: ProductConfig) {
    this.config = config;
    this.prefs = createPreferencesManager(config);
  }

  async init(): Promise<void> {
    const prefs = await this.prefs.load();
    this.currentTheme = prefs.mode === 'dark' ? 'dark' : 'light';
    this.currentPreset = prefs.preset;
    this.applyThemeAttribute(this.currentTheme);
    if (prefs.preset !== 'default') {
      this.applyPresetAttribute(prefs.preset);
      this.applyPresetVariables(prefs.preset);
    }
  }

  apply(theme: 'light' | 'dark'): void {
    if (theme === this.currentTheme) return;
    withTransition(() => {
      this.currentTheme = theme;
      this.applyThemeAttribute(theme);
    });
  }

  toggle(): void {
    const next = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.apply(next);
    this.prefs.save({ mode: next });
  }

  applyPreset(name: PresetName): void {
    if (name === this.currentPreset) return;
    this.currentPreset = name;
    withTransition(() => {
      if (name === 'default') {
        this.removePreset();
      } else {
        this.applyPresetAttribute(name);
        this.applyPresetVariables(name);
      }
    });
  }

  getCurrentTheme(): 'light' | 'dark' {
    return this.currentTheme;
  }

  /** Sheets-specific: set grid preservation attribute */
  setGridPreference(preserve: boolean): void {
    if (preserve) {
      document.documentElement.setAttribute(`data-${this.config.prefix}-grid`, 'preserve');
    } else {
      document.documentElement.removeAttribute(`data-${this.config.prefix}-grid`);
    }
  }

  /** Docs-specific: set pageless mode attribute */
  setPagelessMode(pageless: boolean): void {
    if (pageless) {
      document.documentElement.setAttribute(`data-${this.config.prefix}-page`, 'pageless');
    } else {
      document.documentElement.removeAttribute(`data-${this.config.prefix}-page`);
    }
  }

  private applyThemeAttribute(theme: 'light' | 'dark'): void {
    document.documentElement.setAttribute(`data-${this.config.prefix}-theme`, theme);
    document.documentElement.style.colorScheme = theme;
  }

  private applyPresetAttribute(name: PresetName): void {
    document.documentElement.setAttribute(`data-${this.config.prefix}-preset`, name);
  }

  private applyPresetVariables(name: PresetName): void {
    const preset = getPreset(name);
    if (!preset) return;
    const html = document.documentElement;
    for (const [prop, value] of Object.entries(preset.variables)) {
      html.style.setProperty(prop, value);
    }
  }

  private removePreset(): void {
    document.documentElement.removeAttribute(`data-${this.config.prefix}-preset`);
    const preset = getPreset('nord'); // any preset to get variable names
    if (preset) {
      const html = document.documentElement;
      for (const prop of Object.keys(preset.variables)) {
        html.style.removeProperty(prop);
      }
    }
  }
}
