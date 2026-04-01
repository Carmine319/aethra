export type RetryPolicy = {
  maxAttempts: number;
  baseDelayMs: number;
  factor: number;
};

export const defaultRetryPolicy: RetryPolicy = {
  maxAttempts: 3,
  baseDelayMs: 400,
  factor: 2,
};

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, Math.max(0, ms)));
}

export async function runWithRetry<T>(fn: () => Promise<T>, policy: RetryPolicy = defaultRetryPolicy): Promise<T> {
  let attempt = 0;
  let lastError: unknown;
  while (attempt < policy.maxAttempts) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      attempt += 1;
      if (attempt >= policy.maxAttempts) break;
      const wait = policy.baseDelayMs * Math.pow(policy.factor, attempt - 1);
      await sleep(wait);
    }
  }
  throw lastError;
}
