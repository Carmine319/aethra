export function estimateMargin(revenue: number, variableCost: number, fixedCost: number) {
  const cost = variableCost + fixedCost;
  const profit = revenue - cost;
  return {
    grossMargin: revenue > 0 ? Number(((revenue - variableCost) / revenue).toFixed(4)) : 0,
    netMargin: revenue > 0 ? Number((profit / revenue).toFixed(4)) : 0,
    profit: Number(profit.toFixed(2)),
  };
}
