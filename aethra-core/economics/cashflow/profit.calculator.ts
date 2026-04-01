export function calculateEconomicProfit(revenue: number, cost: number) {
  return {
    profit: Number((revenue - cost).toFixed(2)),
    roi: cost > 0 ? Number(((revenue - cost) / cost).toFixed(4)) : 0,
  };
}
