/**
 * Ω v15 — Standardisation policy flags (additive-only evolution).
 */

export function assertAdditiveOnly(change: { breaksPrevious: boolean }) {
  if (change.breaksPrevious) {
    throw new Error("Non-additive protocol change rejected");
  }
  return true;
}
