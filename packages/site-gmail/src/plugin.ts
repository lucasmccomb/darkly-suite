// Placeholder — will be populated from gmail-darkly source
import type { SitePlugin } from '@darkly/core';

export const gmailPlugin: SitePlugin = {
  siteId: 'gmail',
  tabUrlPattern: 'https://mail.google.com/*',
  contentScriptMatches: ['https://mail.google.com/*'],
  overrideStyles: '',
  async injectToolbarButton() {
    return null;
  },
  startDomObserver() {},
};
