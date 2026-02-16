const API_BASE = 'https://api.sunrise-sunset.org/json';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface SunTimesCache {
  sunrise: string;
  sunset: string;
  lat: number;
  lng: number;
  lastFetched: number;
}

export interface SunTimes {
  sunrise: Date;
  sunset: Date;
}

/**
 * Get sunrise/sunset times for the given coordinates.
 * Cached in chrome.storage.local for 24 hours.
 * Cache key is parameterized to avoid conflicts between extensions.
 */
export async function getSunTimes(
  lat: number,
  lng: number,
  cacheKey = 'darkly_sun_times_cache',
): Promise<SunTimes | null> {
  try {
    const result = await chrome.storage.local.get(cacheKey);
    const cached = result[cacheKey] as SunTimesCache | undefined;

    if (cached && cached.lat === lat && cached.lng === lng) {
      const age = Date.now() - cached.lastFetched;
      if (age < CACHE_TTL_MS) {
        return {
          sunrise: new Date(cached.sunrise),
          sunset: new Date(cached.sunset),
        };
      }
    }
  } catch {
    // Cache miss — continue to fetch
  }

  try {
    const url = `${API_BASE}?lat=${lat}&lng=${lng}&formatted=0`;
    const response = await fetch(url);

    if (!response.ok) {
      console.warn('[Darkly] Sun times API returned', response.status);
      return null;
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.results) {
      console.warn('[Darkly] Sun times API returned unexpected status:', data.status);
      return null;
    }

    const sunrise = new Date(data.results.sunrise);
    const sunset = new Date(data.results.sunset);

    if (isNaN(sunrise.getTime()) || isNaN(sunset.getTime())) {
      console.warn('[Darkly] Sun times API returned invalid dates');
      return null;
    }

    const cacheEntry: SunTimesCache = {
      sunrise: sunrise.toISOString(),
      sunset: sunset.toISOString(),
      lat,
      lng,
      lastFetched: Date.now(),
    };
    await chrome.storage.local.set({ [cacheKey]: cacheEntry });

    return { sunrise, sunset };
  } catch (err) {
    console.warn('[Darkly] Failed to fetch sun times:', err);
    return null;
  }
}
