import type { ProductConfig } from '../config';

export interface PriceInfo {
  monthly: string;
  yearly: string;
  lifetime: string;
}

interface ProCache {
  paid: boolean;
  plan?: string;
  prices?: PriceInfo;
  checkedAt: number;
}

const CACHE_TTL_PAID_MS = 30 * 60 * 1000; // 30 minutes

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
  getPlan(): Promise<string | null>;
  getPrices(): Promise<PriceInfo | null>;
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

  async function getCachedProStatus(): Promise<ProCache | null> {
    const result = await chrome.storage.local.get(proCacheKey);
    const cache = result[proCacheKey] as ProCache | undefined;
    if (!cache) return null;
    // Only cache paid status — unpaid always re-checks the API so payment
    // is recognized immediately on the next page load or refresh.
    if (!cache.paid) return null;
    if (Date.now() - cache.checkedAt > CACHE_TTL_PAID_MS) return null;
    return cache;
  }

  async function setCachedProStatus(paid: boolean, plan?: string, prices?: PriceInfo): Promise<void> {
    const cache: ProCache = { paid, plan, checkedAt: Date.now(), ...(prices && { prices }) };
    await chrome.storage.local.set({ [proCacheKey]: cache });
  }

  async function clearCachedProStatus(): Promise<void> {
    await chrome.storage.local.remove(proCacheKey);
  }

  async function isPro(): Promise<boolean> {
    if (typeof __DEV_MODE__ !== 'undefined' && __DEV_MODE__) return true;

    const cached = await getCachedProStatus();
    if (cached !== null) return cached.paid;

    try {
      const token = await getToken();
      const params = new URLSearchParams({ product: config.productId });
      const response = await fetch(`${apiBase}/status/${token}?${params}`);
      if (!response.ok) return false;
      const data = await response.json() as { paid: boolean; plan?: string; prices?: PriceInfo };
      await setCachedProStatus(data.paid, data.plan, data.prices);
      return data.paid;
    } catch (err) {
      console.warn('[Darkly] Failed to check Pro status:', err);
      return false;
    }
  }

  async function getPlan(): Promise<string | null> {
    const result = await chrome.storage.local.get(proCacheKey);
    const cache = result[proCacheKey] as ProCache | undefined;
    return cache?.plan ?? null;
  }

  async function getPrices(): Promise<PriceInfo | null> {
    // Read prices directly from storage — they're valid regardless of paid status
    const result = await chrome.storage.local.get(proCacheKey);
    const cache = result[proCacheKey] as ProCache | undefined;
    return cache?.prices ?? null;
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
    const params = new URLSearchParams({ type: 'checkout', token, plan, product: config.productId });
    const url = `${apiBase}/auth/start?${params}`;
    chrome.runtime.sendMessage({ type: 'openTab', url });
    chrome.runtime.sendMessage({ type: 'checkoutStarted' });
  }

  async function openManageSubscription(): Promise<void> {
    const token = await getToken();
    const url = `${apiBase}/portal?token=${token}&product=${config.productId}`;
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
    getPlan,
    getPrices,
    onPaymentStatusChange,
    openPaymentPage,
    openManageSubscription,
    refreshProStatus,
  };
}
