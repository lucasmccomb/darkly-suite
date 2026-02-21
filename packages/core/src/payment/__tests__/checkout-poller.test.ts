// @darkly/core — Checkout poller tests

import { createMockConfig, createMockChromeStorage } from '../../__tests__/test-helpers';

const mockConfig = createMockConfig({
  prefix: 'sd',
  apiBase: 'https://darklysuite.com/api',
  productId: 'sheets',
  proCacheKey: 'sd_pro_cache',
});

const { chromeMock, sessionStorage, install, clearStorages } = createMockChromeStorage();

install();

// --- Fetch mock ---

const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
Object.defineProperty(globalThis, 'fetch', { value: fetchMock, writable: true });

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

// --- Import module under test ---

import { createCheckoutPoller } from '../checkout-poller';
import type { CheckoutPoller } from '../checkout-poller';

// --- Helpers ---

let poller: CheckoutPoller;

const ALARM_NAME = 'sd-checkout-poll';
const STATE_KEY = 'sd_checkout_poll_state';

function mockApiResponse(paid: boolean, plan?: string) {
  fetchMock.mockResolvedValueOnce(new Response(
    JSON.stringify({ paid, ...(plan && { plan }) }),
    { status: 200 },
  ) as unknown as globalThis.Response);
}

// --- Tests ---

beforeEach(() => {
  clearStorages();
  jest.clearAllMocks();
  jest.useFakeTimers();
  fetchMock.mockReset();
  poller = createCheckoutPoller(mockConfig);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('start()', () => {
  it('stores poll state in session storage', async () => {
    mockApiResponse(false);
    await poller.start();

    const state = sessionStorage[STATE_KEY] as { active: boolean; startedAt: number };
    expect(state).toBeDefined();
    expect(state.active).toBe(true);
    expect(state.startedAt).toBeGreaterThan(0);
  });

  it('creates a chrome alarm with 30s interval', async () => {
    mockApiResponse(false);
    await poller.start();

    expect(chromeMock.alarms.create).toHaveBeenCalledWith(ALARM_NAME, {
      periodInMinutes: 0.5,
    });
  });

  it('uses config-derived alarm name and state key', async () => {
    const gmailConfig = createMockConfig({ prefix: 'gd', proCacheKey: 'gd_pro_cache' });
    const gmailPoller = createCheckoutPoller(gmailConfig);

    expect(gmailPoller.alarmName).toBe('gd-checkout-poll');

    mockApiResponse(false);
    await gmailPoller.start();

    expect(chromeMock.alarms.create).toHaveBeenCalledWith('gd-checkout-poll', expect.any(Object));
    expect(sessionStorage['gd_checkout_poll_state']).toBeDefined();
  });

  it('skips if already polling (de-duplication)', async () => {
    sessionStorage[STATE_KEY] = { active: true, startedAt: Date.now() };

    await poller.start();

    expect(chromeMock.alarms.create).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('fast polling (setTimeout phases)', () => {
  it('polls at 5s intervals during Phase 1 (0-2 min)', async () => {
    // First call from start(), then each tick
    mockApiResponse(false); // tick 1
    mockApiResponse(false); // tick 2
    mockApiResponse(false); // tick 3

    await poller.start();

    // Advance 5s — first tick
    await jest.advanceTimersByTimeAsync(5_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Advance another 5s — second tick
    mockApiResponse(false);
    await jest.advanceTimersByTimeAsync(5_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('polls at 10s intervals during Phase 2 (2-5 min)', async () => {
    // Mock enough responses for Phase 1 + transition to Phase 2
    for (let i = 0; i < 30; i++) {
      mockApiResponse(false);
    }

    await poller.start();

    // Fast-forward through Phase 1 (2 min = 120s, ~24 ticks at 5s)
    await jest.advanceTimersByTimeAsync(2 * 60 * 1000);

    // Reset mock to count Phase 2 ticks
    fetchMock.mockClear();
    mockApiResponse(false);
    mockApiResponse(false);
    mockApiResponse(false);

    // Advance 10s — should poll (Phase 2 interval)
    await jest.advanceTimersByTimeAsync(10_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Advance another 10s
    await jest.advanceTimersByTimeAsync(10_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('stops polling when paid=true is detected', async () => {
    mockApiResponse(true, 'yearly'); // First tick detects paid

    await poller.start();
    await jest.advanceTimersByTimeAsync(5_000);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(chromeMock.alarms.clear).toHaveBeenCalledWith(ALARM_NAME);
    expect(sessionStorage[STATE_KEY]).toBeUndefined();

    // No more ticks after detection
    fetchMock.mockClear();
    await jest.advanceTimersByTimeAsync(10_000);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('handleAlarm()', () => {
  it('polls when state is active', async () => {
    sessionStorage[STATE_KEY] = { active: true, startedAt: Date.now() };
    mockApiResponse(false);

    await poller.handleAlarm();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('cleans up if state is not active', async () => {
    await poller.handleAlarm();

    expect(chromeMock.alarms.clear).toHaveBeenCalledWith(ALARM_NAME);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('cleans up after 60 min timeout', async () => {
    sessionStorage[STATE_KEY] = {
      active: true,
      startedAt: Date.now() - 61 * 60 * 1000, // 61 min ago
    };

    await poller.handleAlarm();

    expect(chromeMock.alarms.clear).toHaveBeenCalledWith(ALARM_NAME);
    expect(sessionStorage[STATE_KEY]).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('cleans up when paid=true is detected', async () => {
    sessionStorage[STATE_KEY] = { active: true, startedAt: Date.now() };
    mockApiResponse(true, 'monthly');

    await poller.handleAlarm();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(chromeMock.alarms.clear).toHaveBeenCalledWith(ALARM_NAME);
    expect(sessionStorage[STATE_KEY]).toBeUndefined();
  });

  it('continues polling when still unpaid and within timeout', async () => {
    sessionStorage[STATE_KEY] = {
      active: true,
      startedAt: Date.now() - 30 * 60 * 1000, // 30 min ago — still within window
    };
    mockApiResponse(false);

    await poller.handleAlarm();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    // State should still be active
    expect(sessionStorage[STATE_KEY]).toBeDefined();
    // Alarm should NOT be cleared
    expect(chromeMock.alarms.clear).not.toHaveBeenCalled();
  });
});

describe('error handling', () => {
  it('continues polling on network error', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'));
    mockApiResponse(false);

    await poller.start();
    await jest.advanceTimersByTimeAsync(5_000); // tick with network error
    await jest.advanceTimersByTimeAsync(5_000); // next tick should still fire

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sessionStorage[STATE_KEY]).toBeDefined();
  });
});
