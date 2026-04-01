const bucket = new Map<string, { count: number; windowStart: number }>();

export function enforceRateLimit(key: string, maxPerMinute = 30) {
  const now = Date.now();
  const item = bucket.get(key) || { count: 0, windowStart: now };
  if (now - item.windowStart > 60_000) {
    item.count = 0;
    item.windowStart = now;
  }
  item.count += 1;
  bucket.set(key, item);
  if (item.count > maxPerMinute) {
    throw new Error("Rate limit exceeded");
  }
}
