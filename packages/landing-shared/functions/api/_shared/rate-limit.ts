/**
 * D1-based sliding window rate limiter.
 *
 * Uses a `rate_limits` table to track request counts per IP + endpoint
 * within fixed time windows. Old windows are cleaned up on each check.
 *
 * Table schema (see d1/schema.sql):
 *   rate_limits(ip TEXT, endpoint TEXT, window_start INTEGER, count INTEGER,
 *               PRIMARY KEY(ip, endpoint, window_start))
 */

interface RateLimitOptions {
  /** Time window size in seconds (default: 60) */
  windowSeconds?: number;
  /** Maximum requests allowed per window (default: 10) */
  maxRequests?: number;
}

interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Seconds until the current window resets (for Retry-After header) */
  retryAfter: number;
}

/**
 * Check and increment the rate limit counter for an IP + endpoint pair.
 *
 * @param db - D1 database binding
 * @param ip - Client IP address (from CF-Connecting-IP header)
 * @param endpoint - Endpoint identifier (e.g. "/api/status")
 * @param options - Window size and max requests configuration
 * @returns Whether the request is allowed and when to retry if not
 */
export async function checkRateLimit(
  db: D1Database,
  ip: string,
  endpoint: string,
  options: RateLimitOptions = {},
): Promise<RateLimitResult> {
  const windowSeconds = options.windowSeconds ?? 60;
  const maxRequests = options.maxRequests ?? 10;

  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % windowSeconds);
  const retryAfter = windowStart + windowSeconds - now;

  // Clean up expired windows and upsert current count in a batch
  const cleanup = db.prepare(
    `DELETE FROM rate_limits WHERE window_start < ?`,
  ).bind(windowStart);

  const upsert = db.prepare(
    `INSERT INTO rate_limits (ip, endpoint, window_start, count)
     VALUES (?, ?, ?, 1)
     ON CONFLICT(ip, endpoint, window_start)
     DO UPDATE SET count = count + 1`,
  ).bind(ip, endpoint, windowStart);

  const read = db.prepare(
    `SELECT count FROM rate_limits
     WHERE ip = ? AND endpoint = ? AND window_start = ?`,
  ).bind(ip, endpoint, windowStart);

  // Execute cleanup + upsert + read in a batch for fewer round-trips
  const results = await db.batch([cleanup, upsert, read]);

  const row = results[2].results?.[0] as { count: number } | undefined;
  const count = row?.count ?? 1;

  return {
    allowed: count <= maxRequests,
    retryAfter,
  };
}

/**
 * Get the client IP from a Cloudflare request.
 * Falls back to 'unknown' in local development where the header is absent.
 */
export function getClientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP') ?? 'unknown';
}
