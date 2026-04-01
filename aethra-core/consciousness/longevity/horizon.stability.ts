export function assessHorizonStability(input: { volatility: number; longevityScore: number }) {
  const horizonStability = Number((Math.max(0.2, input.longevityScore - input.volatility * 0.35)).toFixed(4));
  return {
    horizonStability,
    outlook: horizonStability > 0.65 ? "stable" : "fragile",
  };
}
