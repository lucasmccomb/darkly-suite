import { getSunTimes } from '../sun-times';

// Mock chrome.storage.local
const mockLocalStorage: Record<string, unknown> = {};

const mockLocalGet = jest.fn((key: string) =>
  Promise.resolve({ [key]: mockLocalStorage[key] })
);
const mockLocalSet = jest.fn((items: Record<string, unknown>) => {
  Object.assign(mockLocalStorage, items);
  return Promise.resolve();
});

// Mock fetch
const mockFetch = jest.fn();

beforeAll(() => {
  (globalThis as Record<string, unknown>).chrome = {
    storage: {
      local: {
        get: mockLocalGet,
        set: mockLocalSet,
      },
    },
  };
  globalThis.fetch = mockFetch as unknown as typeof fetch;
});

beforeEach(() => {
  jest.clearAllMocks();
  Object.keys(mockLocalStorage).forEach((k) => delete mockLocalStorage[k]);
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

const LAT = 40.7128;
const LNG = -74.006;
// Coordinates are rounded to 1 decimal place (~11 km) before any network
// request or cache write, so only approximate location leaves the device.
const ROUNDED_LAT = 40.7;
const ROUNDED_LNG = -74;
const SUNRISE_ISO = '2026-02-10T12:00:00+00:00';
const SUNSET_ISO = '2026-02-10T22:30:00+00:00';

// Use a custom cache key matching ProductConfig pattern
const CACHE_KEY = 'gd_sun_times_cache';

function makeApiResponse(status = 'OK') {
  return {
    ok: true,
    json: () =>
      Promise.resolve({
        status,
        results: {
          sunrise: SUNRISE_ISO,
          sunset: SUNSET_ISO,
        },
      }),
  };
}

describe('getSunTimes', () => {
  it('fetches from API and returns parsed dates', async () => {
    mockFetch.mockResolvedValue(makeApiResponse());

    const result = await getSunTimes(LAT, LNG, CACHE_KEY);

    expect(result).not.toBeNull();
    expect(result!.sunrise).toEqual(new Date(SUNRISE_ISO));
    expect(result!.sunset).toEqual(new Date(SUNSET_ISO));
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.sunrise-sunset.org/json?lat=${ROUNDED_LAT}&lng=${ROUNDED_LNG}&formatted=0`
    );
  });

  it('rounds full-precision coordinates to 1 decimal place before sending to the API', async () => {
    mockFetch.mockResolvedValue(makeApiResponse());

    await getSunTimes(51.507351, -0.127758, CACHE_KEY);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.sunrise-sunset.org/json?lat=51.5&lng=-0.1&formatted=0'
    );
    // Full-precision coordinates must never appear in the request URL
    const requestedUrl = mockFetch.mock.calls[0][0] as string;
    expect(requestedUrl).not.toContain('51.507351');
    expect(requestedUrl).not.toContain('-0.127758');
  });

  it('never persists full-precision coordinates to the cache', async () => {
    mockFetch.mockResolvedValue(makeApiResponse());

    await getSunTimes(LAT, LNG, CACHE_KEY);

    const cached = mockLocalSet.mock.calls[0][0][CACHE_KEY] as { lat: number; lng: number };
    expect(cached.lat).toBe(ROUNDED_LAT);
    expect(cached.lng).toBe(ROUNDED_LNG);
  });

  it('serves the cached result when full-precision input rounds to the cached coordinates', async () => {
    mockLocalStorage[CACHE_KEY] = {
      sunrise: SUNRISE_ISO,
      sunset: SUNSET_ISO,
      lat: ROUNDED_LAT,
      lng: ROUNDED_LNG,
      lastFetched: Date.now() - 1000,
    };

    // 40.7449, -74.026 also rounds to 40.7, -74 — should hit the cache
    const result = await getSunTimes(40.7449, -74.026, CACHE_KEY);

    expect(result).not.toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('caches result in chrome.storage.local using parameterized key', async () => {
    mockFetch.mockResolvedValue(makeApiResponse());

    await getSunTimes(LAT, LNG, CACHE_KEY);

    expect(mockLocalSet).toHaveBeenCalledTimes(1);
    const cached = mockLocalSet.mock.calls[0][0][CACHE_KEY] as {
      sunrise: string;
      sunset: string;
      lat: number;
      lng: number;
      lastFetched: number;
    };
    expect(cached).toMatchObject({
      lat: ROUNDED_LAT,
      lng: ROUNDED_LNG,
    });
    expect(cached.sunrise).toBeDefined();
    expect(cached.sunset).toBeDefined();
    expect(cached.lastFetched).toBeGreaterThan(0);
  });

  it('uses default cache key when none provided', async () => {
    mockFetch.mockResolvedValue(makeApiResponse());

    await getSunTimes(LAT, LNG);

    expect(mockLocalSet).toHaveBeenCalledTimes(1);
    const setArg = mockLocalSet.mock.calls[0][0];
    expect(setArg).toHaveProperty('darkly_sun_times_cache');
  });

  it('returns cached result when cache is fresh (< 24h)', async () => {
    mockLocalStorage[CACHE_KEY] = {
      sunrise: SUNRISE_ISO,
      sunset: SUNSET_ISO,
      lat: ROUNDED_LAT,
      lng: ROUNDED_LNG,
      lastFetched: Date.now() - 1000, // 1 second ago
    };

    const result = await getSunTimes(LAT, LNG, CACHE_KEY);

    expect(result).not.toBeNull();
    expect(result!.sunrise).toEqual(new Date(SUNRISE_ISO));
    expect(result!.sunset).toEqual(new Date(SUNSET_ISO));
    // Should NOT have fetched from API
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('fetches fresh data when cache is stale (> 24h)', async () => {
    mockLocalStorage[CACHE_KEY] = {
      sunrise: SUNRISE_ISO,
      sunset: SUNSET_ISO,
      lat: ROUNDED_LAT,
      lng: ROUNDED_LNG,
      lastFetched: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
    };

    mockFetch.mockResolvedValue(makeApiResponse());
    const result = await getSunTimes(LAT, LNG, CACHE_KEY);

    expect(result).not.toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('fetches fresh data when cached coordinates differ', async () => {
    mockLocalStorage[CACHE_KEY] = {
      sunrise: SUNRISE_ISO,
      sunset: SUNSET_ISO,
      lat: 51.5074, // London, not NYC
      lng: -0.1278,
      lastFetched: Date.now() - 1000,
    };

    mockFetch.mockResolvedValue(makeApiResponse());
    const result = await getSunTimes(LAT, LNG, CACHE_KEY);

    expect(result).not.toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('returns null when API returns non-OK status', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'INVALID_REQUEST', results: null }),
    });

    const result = await getSunTimes(LAT, LNG, CACHE_KEY);
    expect(result).toBeNull();
  });

  it('returns null when API returns non-OK HTTP status', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    const result = await getSunTimes(LAT, LNG, CACHE_KEY);
    expect(result).toBeNull();
  });

  it('returns null when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const result = await getSunTimes(LAT, LNG, CACHE_KEY);
    expect(result).toBeNull();
  });

  it('returns null when API returns invalid dates', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: 'OK',
          results: {
            sunrise: 'not-a-date',
            sunset: 'also-not-a-date',
          },
        }),
    });

    const result = await getSunTimes(LAT, LNG, CACHE_KEY);
    expect(result).toBeNull();
  });

  it('still fetches from API when cache read throws', async () => {
    mockLocalGet.mockRejectedValueOnce(new Error('Storage error'));
    mockFetch.mockResolvedValue(makeApiResponse());

    const result = await getSunTimes(LAT, LNG, CACHE_KEY);
    expect(result).not.toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('isolates caches between different products', async () => {
    const gmailCacheKey = 'gd_sun_times_cache';
    const sheetsCacheKey = 'sd_sun_times_cache';

    // Seed gmail cache
    mockLocalStorage[gmailCacheKey] = {
      sunrise: SUNRISE_ISO,
      sunset: SUNSET_ISO,
      lat: ROUNDED_LAT,
      lng: ROUNDED_LNG,
      lastFetched: Date.now() - 1000,
    };

    // Gmail should get cached result
    const gmailResult = await getSunTimes(LAT, LNG, gmailCacheKey);
    expect(gmailResult).not.toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();

    // Sheets should NOT get cached result (different key)
    mockFetch.mockResolvedValue(makeApiResponse());
    const sheetsResult = await getSunTimes(LAT, LNG, sheetsCacheKey);
    expect(sheetsResult).not.toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
