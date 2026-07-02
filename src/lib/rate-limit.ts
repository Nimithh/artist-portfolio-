// Simple in-memory rate limiter (sliding window). Good enough for a small
// site: it protects each running server instance. Limitation to know about:
// on serverless hosting (Vercel), each instance has its own memory, so the
// effective limit is per-instance, not global. The database-level caps in
// the migrations are the hard backstop. If abuse ever becomes real, swap
// this for Upstash Redis without changing the call sites.

const buckets = new Map<string, number[]>();
const MAX_KEYS = 10_000;

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  // Keep the map from growing without bound if someone rotates IPs.
  if (buckets.size > MAX_KEYS) {
    for (const [k, times] of buckets) {
      if (times.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
    if (buckets.size > MAX_KEYS) buckets.clear();
  }

  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    buckets.set(key, recent);
    return false;
  }
  recent.push(now);
  buckets.set(key, recent);
  return true;
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}
