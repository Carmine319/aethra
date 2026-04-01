/**
 * Ω v15 — Intrinsic usage-aligned incentive curve (embedded, not bolted on).
 */

export function computeIncentiveSignal(usageCount: number, depth: number) {
  return Math.log1p(usageCount) * (1 + depth);
}
