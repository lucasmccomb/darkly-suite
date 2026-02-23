/**
 * IndexedDB Persistent Cache for transformed CSS.
 *
 * Stores: { domain, cssHash, transformedCSS, timestamp }
 * Cache hit: hash current page CSS -> lookup in IndexedDB -> inject cached CSS
 * Cache miss: process CSS, store result, then inject
 */

const DB_NAME = 'browse-darkly-cache';
const DB_VERSION = 1;
const STORE_NAME = 'css-overrides';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface CacheEntry {
  domain: string;
  cssHash: string;
  css: string;
  timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'domain' });
        store.createIndex('timestamp', 'timestamp');
      }
    };
  });
}

/** Simple string hash (FNV-1a). */
export function hashString(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash.toString(36);
}

/** Get cached CSS for a domain + CSS content hash. */
export async function getCachedCSS(
  domain: string,
  cssHash: string
): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(domain);
      request.onsuccess = () => {
        const entry = request.result as CacheEntry | undefined;
        if (!entry) {
          resolve(null);
          return;
        }
        // Check hash match and freshness
        if (
          entry.cssHash !== cssHash ||
          Date.now() - entry.timestamp > MAX_AGE_MS
        ) {
          resolve(null);
          return;
        }
        resolve(entry.css);
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/** Store transformed CSS in the cache. */
export async function setCachedCSS(
  domain: string,
  cssHash: string,
  css: string
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({
        domain,
        cssHash,
        css,
        timestamp: Date.now(),
      } as CacheEntry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Silently fail — cache is optional
  }
}

/** Clear expired entries. */
export async function clearExpiredCache(): Promise<void> {
  try {
    const db = await openDB();
    const cutoff = Date.now() - MAX_AGE_MS;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    const range = IDBKeyRange.upperBound(cutoff);
    const request = index.openCursor(range);
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  } catch {
    // Silently fail
  }
}
