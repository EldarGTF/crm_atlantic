import "server-only";

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

/** In-memory rate limit (один инстанс приложения). Для кластера — Redis/Upstash. */
export function checkRateLimit(
  key: string,
  limit = 5,
  windowMs = 15 * 60 * 1000
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  let entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + windowMs };
    store.set(key, entry);
  }

  entry.count += 1;

  if (entry.count > limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
  }

  return { ok: true };
}

export function clearRateLimit(key: string): void {
  store.delete(key);
}
