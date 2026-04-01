export function planLongevity(input: { reserveRatio: number; resilience: number; dependencyIndex: number }) {
  const longevityScore = Number((input.reserveRatio * 0.45 + input.resilience * 0.35 + (1 - input.dependencyIndex) * 0.2).toFixed(4));
  return {
    longevityScore,
    strategy: longevityScore > 0.7 ? "durable-compounding" : "stabilise-then-scale",
  };
}
