// Placeholder — will be populated from docs-darkly source
import type { SitePlugin } from '@darkly/core';

export const docsPlugin: SitePlugin = {
  siteId: 'docs',
  tabUrlPattern: 'https://docs.google.com/document/*',
  contentScriptMatches: ['https://docs.google.com/document/*'],
  overrideStyles: '',
  async injectToolbarButton() {
    return null;
  },
  startDomObserver() {},
};
