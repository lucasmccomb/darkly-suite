import type { ProductConfig } from '../config';
import { createPaymentClient } from './client';

export async function isPro(config: ProductConfig): Promise<boolean> {
  const client = createPaymentClient(config);
  return client.isPro();
}

export function canUseFeature(_feature: string, proStatus: boolean): boolean {
  return proStatus;
}

/**
 * Wraps a Pro-only action so free users reach the paywall instead of the
 * feature. Use this at the point where a handler is handed to UI that any user
 * can reach — keyboard shortcuts, toolbar buttons — rather than inside the
 * primitive being guarded. `ThemeEngine`, for instance, is also driven by the
 * schedule listener and by `applyMode`, both of which run after Pro status has
 * already been checked upstream.
 *
 * `onBlocked` should open settings, not no-op: a shortcut that does nothing at
 * all reads as broken rather than as locked.
 */
export function gateProAction(
  proStatus: boolean,
  action: () => void,
  onBlocked: () => void,
): () => void {
  return () => {
    if (proStatus) {
      action();
      return;
    }
    onBlocked();
  };
}
