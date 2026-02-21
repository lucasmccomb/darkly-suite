import type { ProductConfig } from '../config';
import { createPaymentClient } from './client';

// Staggered polling phases:
//   Phase 1 (0–2 min):  every 5s  via setTimeout  — fast detection
//   Phase 2 (2–5 min):  every 10s via setTimeout  — medium detection
//   Phase 3 (0–60 min): every 30s via chrome.alarms — parallel safety net
const PHASE_1_END_MS = 2 * 60 * 1000;
const PHASE_2_END_MS = 5 * 60 * 1000;
const MAX_DURATION_MS = 60 * 60 * 1000;
const PHASE_1_INTERVAL_MS = 5_000;
const PHASE_2_INTERVAL_MS = 10_000;
const ALARM_PERIOD_MINUTES = 0.5;

interface PollState {
  active: boolean;
  startedAt: number;
}

export interface CheckoutPoller {
  start(): Promise<void>;
  handleAlarm(): Promise<void>;
  readonly alarmName: string;
}

export function createCheckoutPoller(config: ProductConfig): CheckoutPoller {
  const payment = createPaymentClient(config);
  const alarmName = `${config.prefix}-checkout-poll`;
  const stateKey = `${config.prefix}_checkout_poll_state`;

  let fastPollTimer: ReturnType<typeof setTimeout> | null = null;

  async function getState(): Promise<PollState | null> {
    const result = await chrome.storage.session.get(stateKey);
    return (result[stateKey] as PollState | undefined) ?? null;
  }

  async function setState(state: PollState): Promise<void> {
    await chrome.storage.session.set({ [stateKey]: state });
  }

  async function clearState(): Promise<void> {
    await chrome.storage.session.remove(stateKey);
  }

  async function poll(): Promise<boolean> {
    try {
      const paid = await payment.isPro();
      if (paid) {
        await cleanup();
      }
      return paid;
    } catch {
      return false;
    }
  }

  async function cleanup(): Promise<void> {
    if (fastPollTimer) {
      clearTimeout(fastPollTimer);
      fastPollTimer = null;
    }
    await chrome.alarms.clear(alarmName);
    await clearState();
  }

  function startFastPolling(startedAt: number): void {
    async function tick() {
      const state = await getState();
      if (!state?.active) return;

      if (await poll()) return;

      const elapsed = Date.now() - startedAt;
      if (elapsed < PHASE_1_END_MS) {
        fastPollTimer = setTimeout(tick, PHASE_1_INTERVAL_MS);
      } else if (elapsed < PHASE_2_END_MS) {
        fastPollTimer = setTimeout(tick, PHASE_2_INTERVAL_MS);
      }
      // After 5 min: setTimeout stops, chrome.alarms continues as safety net
    }
    fastPollTimer = setTimeout(tick, PHASE_1_INTERVAL_MS);
  }

  async function start(): Promise<void> {
    const existing = await getState();
    if (existing?.active) return;

    const startedAt = Date.now();
    await setState({ active: true, startedAt });

    startFastPolling(startedAt);

    // Parallel safety net: if Chrome kills the worker, the alarm survives
    // and picks up polling at 30s intervals for the full 60 min window
    await chrome.alarms.create(alarmName, {
      periodInMinutes: ALARM_PERIOD_MINUTES,
    });
  }

  async function handleAlarm(): Promise<void> {
    const state = await getState();
    if (!state?.active) {
      await chrome.alarms.clear(alarmName);
      return;
    }

    const elapsed = Date.now() - state.startedAt;
    if (elapsed > MAX_DURATION_MS) {
      await cleanup();
      return;
    }

    await poll();
  }

  return { start, handleAlarm, alarmName };
}
