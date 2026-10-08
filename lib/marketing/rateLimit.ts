type Bucket = { count: number; timestamp: number };

const buckets = new Map<string, Bucket>();

export function consumeRateLimit(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const record = buckets.get(key);
  if (!record || now - record.timestamp > windowMs) {
    buckets.set(key, { count: 1, timestamp: now });
    return true;
  }
  if (record.count >= limit) return false;
  record.count += 1;
  return true;
}

export function resetRateLimitForTests(): void {
  buckets.clear();
}
