export function maximiseProfit(input: { revenue: number; cost: number }) {
  const baselineProfit = input.revenue - input.cost;
  return {
    baselineProfit: Number(baselineProfit.toFixed(2)),
    optimisedProfit: Number((baselineProfit * 1.08).toFixed(2)),
  };
}
