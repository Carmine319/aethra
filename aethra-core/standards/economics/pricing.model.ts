/**
 * Ω v15 — Simple marginal pricing hint from load and baseline.
 */

export function suggestUnitPrice(base: number, loadFactor: number) {
  const f = Math.min(2, Math.max(0.5, loadFactor));
  return Math.round(base * f * 1000) / 1000;
}
