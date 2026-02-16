import type { ProductConfig } from '../config';
import { createPaymentClient } from './client';

export async function isPro(config: ProductConfig): Promise<boolean> {
  const client = createPaymentClient(config);
  return client.isPro();
}

export function canUseFeature(_feature: string, proStatus: boolean): boolean {
  return proStatus;
}
