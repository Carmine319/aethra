export function applyConstraints(strategy: any) {
  if (!strategy || typeof strategy !== "object") throw new Error("Strategy payload required");
  if (Number(strategy.risk || 0) > 0.7) {
    throw new Error("Strategy exceeds risk threshold");
  }
  if (strategy.reversible === false) {
    throw new Error("Non-reversible strategies are blocked");
  }
  if (!Number.isFinite(Number(strategy.expectedValue || NaN))) {
    throw new Error("Strategy must include expected value");
  }
  if (!Number.isFinite(Number(strategy.capitalImpact || NaN))) {
    throw new Error("Strategy must include capital impact");
  }
}
