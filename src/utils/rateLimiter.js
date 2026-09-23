/**
 * High-performance In-Memory Rate Limiter for Next.js API Routes & Middleware.
 * Uses a sliding-window counter algorithm with automatic memory cleanup.
 */

class MemoryRateLimiter {
  constructor() {
    this.hits = new Map();
    // Periodically prune stale entries every 5 minutes to avoid memory leaks
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.pruneStale(), 5 * 60 * 1000).unref?.();
    }
  }

  /**
   * Evaluates if a request from a given key (IP address or UID) is within rate limits.
   * @param {string} key Unique identifier for the client (e.g. `ip:endpoint` or `uid:action`)
   * @param {number} limit Maximum allowed requests within windowMs
   * @param {number} windowMs Time window in milliseconds (default: 60,000ms = 1 min)
   * @returns {{ allowed: boolean, remaining: number, resetTime: number, total: number }}
   */
  check(key, limit = 60, windowMs = 60 * 1000) {
    const now = Date.now();
    const entry = this.hits.get(key);

    if (!entry || entry.resetTime <= now) {
      // First hit or window expired
      const resetTime = now + windowMs;
      this.hits.set(key, { count: 1, resetTime });
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime,
        total: 1,
      };
    }

    entry.count += 1;
    const remaining = Math.max(0, limit - entry.count);
    const allowed = entry.count <= limit;

    return {
      allowed,
      remaining,
      resetTime: entry.resetTime,
      total: entry.count,
    };
  }

  pruneStale() {
    const now = Date.now();
    for (const [key, entry] of this.hits.entries()) {
      if (entry.resetTime <= now) {
        this.hits.delete(key);
      }
    }
  }
}

// Global singleton instance across serverless execution contexts
const globalLimiter = globalThis.__afroeduRateLimiter || new MemoryRateLimiter();
if (process.env.NODE_ENV !== 'production') {
  globalThis.__afroeduRateLimiter = globalLimiter;
}

export function checkRateLimit(key, limit = 60, windowMs = 60 * 1000) {
  return globalLimiter.check(key, limit, windowMs);
}

/**
 * Extracts a normalized client IP address from Next.js request headers.
 */
export function getClientIp(req) {
  const forwarded = req.headers?.get?.('x-forwarded-for') || req.headers?.['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers?.get?.('x-real-ip') || req.headers?.['x-real-ip'];
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}
