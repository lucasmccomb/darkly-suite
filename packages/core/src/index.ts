// @darkly/core — shared modules for all Darkly extensions

// Types and config
export type {
  SiteId,
  ProductId,
  Plan,
  ProductConfig,
  ToolbarButtonOpts,
  SidebarIconOpts,
  SitePlugin,
} from './config';

// Theme engine
export { ThemeEngine } from './theme/engine';
export { getPreset, PRESETS } from './theme/presets';
export { SystemThemeDetector } from './theme/detector';
export { shouldBeDark } from './theme/scheduler';
export { withTransition, initTransitions } from './theme/transitions';
export * as NightTint from './theme/night-tint';

// Storage
export type {
  ThemeMode,
  PresetName,
  ScheduleConfig,
  NightTintConfig,
  SunriseSunsetConfig,
  BaseUserPreferences,
} from './storage/types';
export {
  DEFAULT_PREFERENCES,
  createPreferencesManager,
} from './storage/preferences';

// Payment
export { createPaymentClient } from './payment/client';
export { isPro, canUseFeature } from './payment/gates';

// Geo
export { calculateSunTimes } from './geo/sun-times';

// React context
export { DarklyProvider, usePrefix, useDarklyConfig } from './context';

// Background worker factory
export { createBackgroundWorker } from './background/worker';

// Content script factory
export { createContentScript } from './content';
