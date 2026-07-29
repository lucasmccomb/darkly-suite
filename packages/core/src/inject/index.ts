// Inject modules -- UI injection into host pages

export {
  createToolbarDropdown,
  getToolbarIcons,
  wrapIconInCoin,
  observeToolbarIcon,
} from './toolbar-button';
export type { ToolbarButtonContext } from './toolbar-button';

export {
  getSidebarIcons,
  createSidebarPanel,
  observeSidebarIcon,
} from './sidebar-icon';
export type { SidebarPanelOptions } from './sidebar-icon';

export { createDomObserver } from './dom-observer';

export {
  createPanelManager,
  createSettingsContainer,
} from './settings-panel';
export type { PanelState, PanelManager } from './settings-panel';

export {
  createSettingsModal,
  createMiniPanel,
} from './panels';
export type { PanelHandle } from './panels';

export { registerKeyboardShortcut } from './keyboard-shortcuts';
export type { KeyboardShortcutOptions } from './keyboard-shortcuts';

export { registerKeySequenceShortcut, SEQUENCE_TIMEOUT_MS } from './keyboard-sequence';
export type { KeySequenceStep, KeySequenceOptions } from './keyboard-sequence';

export { showNotification } from './notifications';
export type { NotificationType, NotificationOptions } from './notifications';

export { injectFab, removeFab } from './fab';
export type { FabOptions } from './fab';
