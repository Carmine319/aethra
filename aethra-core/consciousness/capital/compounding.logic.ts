export function computeCompoundingDirection(input: { roi: number; reserveRatio: number; resilience: number }) {
  const direction = Number((Math.max(0, input.roi) * 0.5 + Math.max(0, input.reserveRatio) * 0.25 + Math.max(0, input.resilience) * 0.25).toFixed(4));
  return {
    direction,
    mode: direction > 0.8 ? "compound-accelerate" : direction > 0.55 ? "compound-steady" : "compound-defensive",
  };
}
