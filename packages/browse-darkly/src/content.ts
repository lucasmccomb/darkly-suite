// Browse Darkly — Content Script Entry Point
// Injects generic dark mode on arbitrary websites.
// Unlike Google Workspace extensions, this does NOT use createContentScript/SitePlugin.

import { GenericDarkMode, isDarkSite } from '@darkly/site-generic';

const STORAGE_KEY = 'bd_preferences';
const DOMAIN_KEY = 'bd_domain_overrides';
const BLOCKLIST_KEY = 'bd_blocklist';

const engine = new GenericDarkMode();
const domain = window.location.hostname;

interface DomainConfig {
  enabled: boolean;
  preset?: string;
}

interface Preferences {
  mode: string;
  preset: string;
}

// Check if another Darkly extension already claimed this page
if (document.documentElement.hasAttribute('data-darkly-active')) {
  console.log('[Browse Darkly] Skipping — another Darkly extension is active');
} else {
  // Initialize based on stored preferences
  chrome.storage.local.get(
    [STORAGE_KEY, DOMAIN_KEY, BLOCKLIST_KEY],
    (result) => {
      const prefs: Preferences = result[STORAGE_KEY] || {
        mode: 'off',
        preset: 'default',
      };
      const domainOverrides: Record<string, DomainConfig> =
        result[DOMAIN_KEY] || {};
      const blocklist: string[] = result[BLOCKLIST_KEY] || [];

      // Skip blocklisted domains
      if (blocklist.includes(domain)) return;

      // Skip already-dark sites (unless user explicitly enabled)
      const domainConfig = domainOverrides[domain];
      if (!domainConfig && isDarkSite()) return;

      // Apply dark mode if enabled globally or per-domain
      const shouldEnable = domainConfig?.enabled ?? prefs.mode === 'dark';
      if (shouldEnable) {
        document.documentElement.setAttribute('data-darkly-active', 'bd');
        engine.enable(domainConfig?.preset || prefs.preset);
      }
    }
  );

  // Listen for messages from popup/background
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'bd:toggle') {
      if (engine.isEnabled()) {
        engine.disable();
        document.documentElement.removeAttribute('data-darkly-active');
      } else {
        document.documentElement.setAttribute('data-darkly-active', 'bd');
        engine.enable(msg.preset);
      }
      sendResponse({ enabled: engine.isEnabled() });
    }
    if (msg.type === 'bd:getStatus') {
      sendResponse({
        enabled: engine.isEnabled(),
        domain,
      });
    }
    if (msg.type === 'bd:setPreset') {
      if (engine.isEnabled()) {
        engine.disable();
        engine.enable(msg.preset);
      }
      sendResponse({ ok: true });
    }
    return true; // Keep message channel open for async response
  });
}
