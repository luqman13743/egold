import Redis from "ioredis";

let redis: Redis | null = null;
function getRedis() {
  if (!process.env.REDIS_URL) return null;
  if (!redis) redis = new Redis(process.env.REDIS_URL);
  return redis;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

/**
 * Fixed-window rate limit keyed by an arbitrary identifier (IP, user id,
 * IP+route, etc). Falls back to allowing requests if Redis isn't
 * configured (local dev) — never falls back to *blocking* everything,
 * since that would take down the whole site if Redis is briefly down.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const client = getRedis();
  if (!client) return { allowed: true, remaining: limit };

  const redisKey = `ratelimit:${key}`;
  const count = await client.incr(redisKey);
  if (count === 1) {
    await client.expire(redisKey, windowSeconds);
  }

  return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
}

export function ipFromRequest(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}
