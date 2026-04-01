export type UncertaintyBundle = {
  confidence: number;
  variance: number;
  scenario_spread: { low: number; mid: number; high: number };
};

export function estimateUncertainty(input: {
  point_estimate: number;
  historical_volatility?: number;
}): UncertaintyBundle {
  const base = Number(input.point_estimate || 0);
  const vol = Math.max(0, Number(input.historical_volatility ?? Math.abs(base) * 0.15 + 0.05));
  const variance = vol * vol;
  const confidence = Math.max(0.01, Math.min(0.99, 1 / (1 + vol)));
  return {
    confidence,
    variance,
    scenario_spread: {
      low: base - 1.645 * vol,
      mid: base,
      high: base + 1.645 * vol,
    },
  };
}
