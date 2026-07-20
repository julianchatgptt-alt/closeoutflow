export type RateLimitRule = {
  limit: number;
  windowSeconds: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export interface RateLimitStore {
  increment(key: string, windowSeconds: number): Promise<{ count: number; ttlSeconds: number }>;
}

type LocalEntry = { count: number; expiresAt: number };

export class LocalRateLimitStore implements RateLimitStore {
  private readonly entries = new Map<string, LocalEntry>();

  async increment(key: string, windowSeconds: number) {
    const now = Date.now();
    const current = this.entries.get(key);
    if (!current || current.expiresAt <= now) {
      const entry = { count: 1, expiresAt: now + windowSeconds * 1000 };
      this.entries.set(key, entry);
      return { count: 1, ttlSeconds: windowSeconds };
    }
    current.count += 1;
    return {
      count: current.count,
      ttlSeconds: Math.max(1, Math.ceil((current.expiresAt - now) / 1000))
    };
  }
}

export class UpstashRateLimitStore implements RateLimitStore {
  constructor(
    private readonly url: string,
    private readonly token: string
  ) {}

  async increment(key: string, windowSeconds: number) {
    const response = await fetch(`${this.url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, windowSeconds, "NX"],
        ["TTL", key]
      ]),
      cache: "no-store"
    });
    if (!response.ok) throw new Error("RATE_LIMIT_STORE_UNAVAILABLE");
    const results = (await response.json()) as { result: number }[];
    return {
      count: Number(results[0]?.result ?? 0),
      ttlSeconds: Math.max(1, Number(results[2]?.result ?? windowSeconds))
    };
  }
}

export async function hashRateLimitIdentifier(namespace: string, identifier: string) {
  const normalized = `${namespace}:${identifier.trim().toLowerCase()}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalized));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function enforceRateLimit(
  store: RateLimitStore,
  key: string,
  rule: RateLimitRule
): Promise<RateLimitResult> {
  const result = await store.increment(key, rule.windowSeconds);
  return {
    allowed: result.count <= rule.limit,
    remaining: Math.max(0, rule.limit - result.count),
    retryAfterSeconds: result.ttlSeconds
  };
}
