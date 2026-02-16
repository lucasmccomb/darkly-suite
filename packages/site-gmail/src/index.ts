// @darkly/site-gmail — Gmail-specific SitePlugin
// InboxSDK integration, pageWorld, gmail-overrides.css

export { gmailPlugin, configureGmailPlugin } from './plugin';
export { getSDK } from './sdk/init';
export { registerToolbarButton } from './sdk/toolbar-button';
export { mountSettingsPanel } from './sdk/sidebar-panel';
export { registerKeyboardShortcut } from './sdk/keyboard-shortcut';
