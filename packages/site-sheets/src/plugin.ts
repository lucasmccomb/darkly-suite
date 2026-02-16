// Placeholder — will be populated from sheets-darkly source
import type { SitePlugin } from '@darkly/core';

export const sheetsPlugin: SitePlugin = {
  siteId: 'sheets',
  tabUrlPattern: 'https://docs.google.com/spreadsheets/*',
  contentScriptMatches: ['https://docs.google.com/spreadsheets/*'],
  overrideStyles: '',
  async injectToolbarButton() {
    return null;
  },
  startDomObserver() {},
};
