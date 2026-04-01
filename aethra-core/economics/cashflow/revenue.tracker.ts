export function trackEconomicRevenue(revenue: number, cycleId: string) {
  return {
    cycleId,
    revenue: Number(revenue.toFixed(2)),
    ts: Date.now(),
  };
}
