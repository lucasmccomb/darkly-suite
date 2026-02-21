// @darkly/core — Payment client tests
// Adapted from gmail-darkly: parameterized via ProductConfig injection

import { createMockConfig, createMockChromeStorage } from '../../__tests__/test-helpers';

// --- Chrome API mocks ---

const mockConfig = createMockConfig({
  apiBase: 'https://darklysuite.com/api',
  productId: 'gmail',
});

const { chromeMock, syncStorage, localStorage, install, clearStorages } = createMockChromeStorage();

install();

// --- Fetch & Response mocks ---

class MockResponse {
  ok: boolean;
  status: number;
  private body: string;

  constructor(body: string, init?: { status?: number }) {
    this.body = body;
    this.status = init?.status ?? 200;
    this.ok = this.status >= 200 && this.status < 300;
  }

  async json() {
    return JSON.parse(this.body);
  }
}

Object.defineProperty(globalThis, 'Response', { value: MockResponse, writable: true });

const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
Object.defineProperty(globalThis, 'fetch', { value: fetchMock, writable: true });

// --- Import module under test (after mocks are in place) ---

import { createPaymentClient } from '../client';
import type { PaymentClient } from '../client';

// --- Helpers ---

let client: PaymentClient;

// --- Tests ---

beforeEach(() => {
  clearStorages();
  jest.clearAllMocks();
  fetchMock.mockReset();
  // Create a fresh client for each test
  client = createPaymentClient(mockConfig);
});

describe('generateToken (via getToken/initPayment)', () => {
  it('creates a valid UUID v4 on first call', async () => {
    await client.initPayment();

    expect(chromeMock.storage.sync.set).toHaveBeenCalledTimes(1);
    const setCall = chromeMock.storage.sync.set.mock.calls[0]![0] as Record<string, string>;
    const token = setCall[mockConfig.tokenKey];

    // UUID v4 format: 8-4-4-4-12 hex characters
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    expect(token).toMatch(uuidV4Regex);
  });

  it('returns the same token on subsequent calls', async () => {
    // First call creates the token
    await client.initPayment();
    const firstToken = syncStorage[mockConfig.tokenKey] as string;

    // Second call should return the existing token (no new set call)
    chromeMock.storage.sync.set.mockClear();
    await client.initPayment();
    expect(chromeMock.storage.sync.set).not.toHaveBeenCalled();

    // Token should still be the same
    expect(syncStorage[mockConfig.tokenKey]).toBe(firstToken);
  });

  it('uses the config tokenKey (not hardcoded)', async () => {
    const sheetsConfig = createMockConfig({
      prefix: 'sd',
      tokenKey: 'sd_token',
    });
    const sheetsClient = createPaymentClient(sheetsConfig);
    await sheetsClient.initPayment();

    const setCall = chromeMock.storage.sync.set.mock.calls[0]![0] as Record<string, string>;
    expect(setCall).toHaveProperty('sd_token');
    expect(setCall).not.toHaveProperty('gd_token');
  });
});

describe('isPro', () => {
  beforeEach(async () => {
    // Ensure token exists
    await client.initPayment();
  });

  it('returns cached value within TTL', async () => {
    // Seed the cache with a recent entry
    localStorage[mockConfig.proCacheKey] = {
      paid: true,
      plan: 'yearly',
      checkedAt: Date.now(),
    };

    const result = await client.isPro();

    expect(result).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fetches from API when paid cache is expired (>30 min)', async () => {
    // Seed the cache with an expired paid entry (31 minutes ago)
    localStorage[mockConfig.proCacheKey] = {
      paid: true,
      plan: 'yearly',
      checkedAt: Date.now() - 31 * 60 * 1000,
    };

    fetchMock.mockResolvedValueOnce(new Response(
      JSON.stringify({ paid: true, plan: 'yearly' }),
      { status: 200 },
    ) as unknown as globalThis.Response);

    const result = await client.isPro();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });

  it('always re-checks API when cached status is unpaid', async () => {
    // Seed the cache with a very recent unpaid entry
    localStorage[mockConfig.proCacheKey] = {
      paid: false,
      checkedAt: Date.now(),
    };

    fetchMock.mockResolvedValueOnce(new Response(
      JSON.stringify({ paid: true, plan: 'yearly' }),
      { status: 200 },
    ) as unknown as globalThis.Response);

    const result = await client.isPro();

    // Should bypass cache and hit API — unpaid is never cached
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });

  it('fetches from API when no cache exists', async () => {
    fetchMock.mockResolvedValueOnce(new Response(
      JSON.stringify({ paid: true, plan: 'lifetime' }),
      { status: 200 },
    ) as unknown as globalThis.Response);

    const result = await client.isPro();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = fetchMock.mock.calls[0][0] as string;
    // Uses the config apiBase, not hardcoded domain
    expect(url).toMatch(new RegExp(`^${mockConfig.apiBase.replace(/\//g, '\\/')}/status/.+$`));
    expect(result).toBe(true);

    // Verify it cached the result using the config proCacheKey
    const cached = localStorage[mockConfig.proCacheKey] as { paid: boolean; plan?: string; checkedAt: number };
    expect(cached.paid).toBe(true);
    expect(cached.plan).toBe('lifetime');
  });

  it('returns false on network error (graceful degradation)', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'));

    const result = await client.isPro();

    expect(result).toBe(false);
  });

  it('returns false on non-OK response', async () => {
    fetchMock.mockResolvedValueOnce(new Response('Not Found', { status: 404 }) as unknown as globalThis.Response);

    const result = await client.isPro();

    expect(result).toBe(false);
  });
});

describe('onPaymentStatusChange', () => {
  it('fires callback when cache is updated', async () => {
    const callback = jest.fn();
    client.onPaymentStatusChange(callback);

    // Simulate a cache update (as would happen after checkout)
    await chromeMock.storage.local.set({
      [mockConfig.proCacheKey]: { paid: true, plan: 'yearly', checkedAt: Date.now() },
    });

    expect(callback).toHaveBeenCalledWith(true);
  });

  it('uses the config proCacheKey (not hardcoded)', async () => {
    const suiteConfig = createMockConfig({
      prefix: 'ds',
      proCacheKey: 'ds_pro_cache',
    });
    const suiteClient = createPaymentClient(suiteConfig);
    const callback = jest.fn();
    suiteClient.onPaymentStatusChange(callback);

    // Updating gd_pro_cache should NOT fire
    await chromeMock.storage.local.set({
      gd_pro_cache: { paid: true, plan: 'yearly', checkedAt: Date.now() },
    });
    expect(callback).not.toHaveBeenCalled();

    // Updating ds_pro_cache SHOULD fire
    await chromeMock.storage.local.set({
      ds_pro_cache: { paid: true, plan: 'yearly', checkedAt: Date.now() },
    });
    expect(callback).toHaveBeenCalledWith(true);
  });
});

describe('openPaymentPage', () => {
  beforeEach(async () => {
    await client.initPayment();
  });

  it('requests email from background via getEmail message', async () => {
    await client.openPaymentPage();

    const emailMsg = chromeMock.runtime.sendMessage.mock.calls[0]![0] as { type: string };
    expect(emailMsg.type).toBe('getEmail');
  });

  it('sends openTab message with token, default plan (yearly), and productId', async () => {
    await client.openPaymentPage();

    expect(chromeMock.runtime.sendMessage).toHaveBeenCalledTimes(3);
    const msg = chromeMock.runtime.sendMessage.mock.calls[1]![0] as { type: string; url: string };
    const token = syncStorage[mockConfig.tokenKey] as string;
    expect(msg.type).toBe('openTab');
    expect(msg.url).toBe(`${mockConfig.apiBase}/checkout?token=${token}&plan=yearly&product=${mockConfig.productId}`);
  });

  it('sends checkoutStarted message after openTab', async () => {
    await client.openPaymentPage();

    const msg = chromeMock.runtime.sendMessage.mock.calls[2]![0] as { type: string };
    expect(msg.type).toBe('checkoutStarted');
  });

  it('includes email in checkout URL when background returns one', async () => {
    chromeMock.runtime.sendMessage.mockImplementationOnce(
      (_message: unknown, callback?: (response: unknown) => void) => {
        if (callback) callback('user@example.com');
      },
    );

    await client.openPaymentPage();

    const msg = chromeMock.runtime.sendMessage.mock.calls[1]![0] as { type: string; url: string };
    const token = syncStorage[mockConfig.tokenKey] as string;
    expect(msg.url).toBe(`${mockConfig.apiBase}/checkout?token=${token}&plan=yearly&product=${mockConfig.productId}&email=user%40example.com`);
  });

  it('sends openTab message with monthly plan', async () => {
    await client.openPaymentPage('monthly');

    const msg = chromeMock.runtime.sendMessage.mock.calls[1]![0] as { type: string; url: string };
    const token = syncStorage[mockConfig.tokenKey] as string;
    expect(msg.url).toBe(`${mockConfig.apiBase}/checkout?token=${token}&plan=monthly&product=${mockConfig.productId}`);
  });

  it('sends openTab message with lifetime plan', async () => {
    await client.openPaymentPage('lifetime');

    const msg = chromeMock.runtime.sendMessage.mock.calls[1]![0] as { type: string; url: string };
    const token = syncStorage[mockConfig.tokenKey] as string;
    expect(msg.url).toBe(`${mockConfig.apiBase}/checkout?token=${token}&plan=lifetime&product=${mockConfig.productId}`);
  });
});

describe('openManageSubscription', () => {
  beforeEach(async () => {
    await client.initPayment();
  });

  it('sends openTab message with portal URL using config apiBase', async () => {
    await client.openManageSubscription();

    expect(chromeMock.runtime.sendMessage).toHaveBeenCalledTimes(1);
    const msg = chromeMock.runtime.sendMessage.mock.calls[0]![0] as { type: string; url: string };
    const token = syncStorage[mockConfig.tokenKey] as string;
    expect(msg.type).toBe('openTab');
    expect(msg.url).toBe(`${mockConfig.apiBase}/portal?token=${token}&product=${mockConfig.productId}`);
  });
});

describe('refreshProStatus', () => {
  beforeEach(async () => {
    await client.initPayment();
  });

  it('clears cache and fetches fresh status', async () => {
    // Seed cache
    localStorage[mockConfig.proCacheKey] = {
      paid: false,
      checkedAt: Date.now(),
    };

    fetchMock.mockResolvedValueOnce(new Response(
      JSON.stringify({ paid: true, plan: 'yearly' }),
      { status: 200 },
    ) as unknown as globalThis.Response);

    const result = await client.refreshProStatus();

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('getPrices', () => {
  beforeEach(async () => {
    await client.initPayment();
  });

  it('returns prices from cache after isPro populates them', async () => {
    fetchMock.mockResolvedValueOnce(new Response(
      JSON.stringify({
        paid: false,
        prices: { monthly: '$0.99', yearly: '$9.99', lifetime: '$29.99' },
      }),
      { status: 200 },
    ) as unknown as globalThis.Response);

    await client.isPro();
    const prices = await client.getPrices();

    expect(prices).toEqual({
      monthly: '$0.99',
      yearly: '$9.99',
      lifetime: '$29.99',
    });
  });

  it('returns null when API response omits prices', async () => {
    fetchMock.mockResolvedValueOnce(new Response(
      JSON.stringify({ paid: false }),
      { status: 200 },
    ) as unknown as globalThis.Response);

    await client.isPro();
    const prices = await client.getPrices();

    expect(prices).toBeNull();
  });

  it('returns null when no cache exists', async () => {
    const prices = await client.getPrices();
    expect(prices).toBeNull();
  });

  it('returns cached prices within TTL', async () => {
    // Seed cache with prices
    localStorage[mockConfig.proCacheKey] = {
      paid: true,
      plan: 'yearly',
      prices: { monthly: '$1.99', yearly: '$14.99', lifetime: '$39.99' },
      checkedAt: Date.now(),
    };

    const prices = await client.getPrices();

    expect(prices).toEqual({
      monthly: '$1.99',
      yearly: '$14.99',
      lifetime: '$39.99',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
