// @darkly/site-gmail — InboxSDK singleton
// Wraps @inboxsdk/core in a lazy singleton so all Gmail plugin modules
// share the same SDK instance.

import * as InboxSDK from '@inboxsdk/core';

const APP_ID = 'sdk_gmaildarkly_9eb0476e77';

let sdkPromise: Promise<InboxSDK.InboxSDK> | null = null;

export function getSDK(): Promise<InboxSDK.InboxSDK> {
  if (!sdkPromise) {
    sdkPromise = InboxSDK.load(2, APP_ID);
  }
  return sdkPromise;
}
