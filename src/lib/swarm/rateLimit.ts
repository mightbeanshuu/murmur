import Redis from "ioredis";

export class RateLimitError extends Error {
  constructor(
    message: string,
    readonly retryAfterSeconds: number,
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}

interface LimitOptions {
  key: string;
  limit: number;
  windowSeconds: number;
}

const redisUrl = process.env.REDIS_URL;
let redis: Redis | null = null;

function getRedis() {
  if (!redisUrl) return null;
  if (!redis) {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
    });
  }
  return redis;
}

function intEnv(name: string, fallback: number) {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const RUN_RATE_LIMIT = {
  limit: intEnv("MURMUR_RUNS_PER_WINDOW", 20),
  windowSeconds: intEnv("MURMUR_RUN_WINDOW_SECONDS", 3600),
};

export const MODEL_RATE_LIMIT = {
  limit: intEnv("MURMUR_MODEL_CALLS_PER_WINDOW", 120),
  windowSeconds: intEnv("MURMUR_MODEL_WINDOW_SECONDS", 3600),
};

export async function enforceRateLimit({ key, limit, windowSeconds }: LimitOptions) {
  const client = getRedis();
  if (!client) return;

  try {
    if (client.status === "wait") await client.connect();
    const count = await client.incr(key);
    if (count === 1) await client.expire(key, windowSeconds);
    if (count > limit) {
      const ttl = await client.ttl(key);
      throw new RateLimitError("Rate limit exceeded.", Math.max(ttl, 1));
    }
  } catch (e) {
    if (e instanceof RateLimitError) throw e;
    if (process.env.MURMUR_STRICT_REDIS_RATE_LIMIT === "1") throw e;
  }
}

export function rateLimitKey(scope: string, id: string) {
  return `murmur:rate:${scope}:${id}`;
}
