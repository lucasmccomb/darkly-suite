import type { ProductConfig } from '../config';

interface ProCache {
  paid: boolean;
  plan?: string;
  checkedAt: number;
}

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
  return [
    hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16),
    hex.slice(16, 20), hex.slice(20, 32),
  ].join('-');
}

export interface PaymentClient {
  getToken(): Promise<string>;
  initPayment(): Promise<void>;
  isPro(): Promise<boolean>;
  onPaymentStatusChange(callback: (paid: boolean) => void): void;
  openPaymentPage(plan?: 'monthly' | 'yearly' | 'lifetime'): Promise<void>;
  openManageSubscription(): Promise<void>;
  refreshProStatus(): Promise<boolean>;
}

export function createPaymentClient(config: ProductConfig): PaymentClient {
  const { tokenKey, proCacheKey, apiBase } = config;

  async function getToken(): Promise<string> {
    const result = await chrome.storage.sync.get(tokenKey);
    if (result[tokenKey]) return result[tokenKey];
    const token = generateToken();
    await chrome.storage.sync.set({ [tokenKey]: token });
    return token;
  }

  async function initPayment(): Promise<void> {
    await getToken();
  }

  async function getCachedProStatus(): Promise<boolean | null> {
    const result = await chrome.storage.local.get(proCacheKey);
    const cache = result[proCacheKey] as ProCache | undefined;
    if (!cache) return null;
    if (Date.now() - cache.checkedAt > CACHE_TTL_MS) return null;
    return cache.paid;
  }

  async function setCachedProStatus(paid: boolean, plan?: string): Promise<void> {
    const cache: ProCache = { paid, plan, checkedAt: Date.now() };
    await chrome.storage.local.set({ [proCacheKey]: cache });
  }

  async function clearCachedProStatus(): Promise<void> {
    await chrome.storage.local.remove(proCacheKey);
  }

  async function isPro(): Promise<boolean> {
    if (typeof __DEV_MODE__ !== 'undefined' && __DEV_MODE__) return true;

    const cached = await getCachedProStatus();
    if (cached !== null) return cached;

    try {
      const token = await getToken();
      const response = await fetch(`${apiBase}/status/${token}`);
      if (!response.ok) return false;
      const data = await response.json() as { paid: boolean; plan?: string };
      await setCachedProStatus(data.paid, data.plan);
      return data.paid;
    } catch (err) {
      console.warn('[Darkly] Failed to check Pro status:', err);
      return false;
    }
  }

  function onPaymentStatusChange(callback: (paid: boolean) => void): void {
    chrome.storage.local.onChanged.addListener((changes) => {
      if (changes[proCacheKey]) {
        const newCache = changes[proCacheKey].newValue as ProCache | undefined;
        if (newCache) {
          callback(newCache.paid);
        }
      }
    });
  }

  async function openPaymentPage(plan: 'monthly' | 'yearly' | 'lifetime' = 'yearly'): Promise<void> {
    const token = await getToken();
    const url = `${apiBase}/checkout?token=${token}&plan=${plan}&product=${config.productId}`;
    chrome.runtime.sendMessage({ type: 'openTab', url });
  }

  async function openManageSubscription(): Promise<void> {
    const token = await getToken();
    const url = `${apiBase}/portal?token=${token}`;
    chrome.runtime.sendMessage({ type: 'openTab', url });
  }

  async function refreshProStatus(): Promise<boolean> {
    await clearCachedProStatus();
    return isPro();
  }

  return {
    getToken,
    initPayment,
    isPro,
    onPaymentStatusChange,
    openPaymentPage,
    openManageSubscription,
    refreshProStatus,
  };
}
