// @darkly/core -- shared modules for all Darkly extensions

// Types and config
export type {
  SiteId,
  ProductId,
  Plan,
  ProductConfig,
  ToolbarButtonOpts,
  SidebarIconOpts,
  KeyboardShortcutHandlers,
  SitePlugin,
} from './config';

// Theme engine
export { ThemeEngine } from './theme/engine';
export { getPreset, PRESETS, DEFAULT_DARK_VARIABLES } from './theme/presets';
export type { ThemePreset } from './theme/presets';
export { SystemThemeDetector } from './theme/detector';
export { shouldBeDark } from './theme/scheduler';
export { createTransitionManager } from './theme/transitions';
export type { TransitionManager } from './theme/transitions';

// Storage
export type {
  ThemeMode,
  PresetName,
  ScheduleConfig,
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

// Conflict detection
export { claimPage, releasePage, getPageOwner } from './conflict-detection';

// Inject modules -- UI injection into host pages
export {
  createToolbarDropdown,
  getToolbarIcons,
  wrapIconInCoin,
  observeToolbarIcon,
  getSidebarIcons,
  createSidebarPanel,
  observeSidebarIcon,
  createDomObserver,
  createPanelManager,
  createSettingsContainer,
  createSettingsModal,
  createMiniPanel,
  registerKeyboardShortcut,
  showNotification,
} from './inject';
export type {
  ToolbarButtonContext,
  SidebarPanelOptions,
  PanelState,
  PanelManager,
  PanelHandle,
  KeyboardShortcutOptions,
  NotificationType,
  NotificationOptions,
} from './inject';

// UI components
export {
  MiniControlPanel,
  SettingsPanel,
  ThemeModeSelector,
  ModeDetailPanel,
  DefaultConfig,
  ScheduleConfig as ScheduleConfigComponent,
  SunriseSunsetConfig as SunriseSunsetConfigComponent,
  Paywall,
  UpgradeBanner,
  ActionButton,
  Toggle,
  Slider,
  TimeRangePicker,
  CollapsibleSection,
  ProBadge,
  Wordmark,
} from './ui';
