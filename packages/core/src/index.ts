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
export { getPreset, PRESETS, DEFAULT_DARK_VARIABLES } from './theme/presets';
export type { ThemePreset } from './theme/presets';
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
export { DEFAULT_PREFERENCES } from './storage/types';
export { createPreferencesManager } from './storage/preferences';
export type { PreferencesManager } from './storage/preferences';

// Payment
export { createPaymentClient } from './payment/client';
export type { PaymentClient } from './payment/client';
export { isPro, canUseFeature } from './payment/gates';

// Geo
export { getSunTimes } from './geo/sun-times';
export type { SunTimes } from './geo/sun-times';

// React context
export { DarklyProvider, usePrefix, useDarklyConfig } from './context';

// Background worker factory
export { createBackgroundWorker } from './background/worker';

// Content script factory
export { createContentScript } from './content';
