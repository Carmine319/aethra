export type RevenueEvent = {
  idea: string;
  revenue: number;
  cost: number;
  startedAt: number;
  finishedAt?: number;
};

export function trackRevenue(event: RevenueEvent) {
  const revenue = Number(event.revenue || 0);
  const cost = Number(event.cost || 0);
  const profit = revenue - cost;
  const roi = cost > 0 ? Number((profit / cost).toFixed(4)) : 0;
  const profitMargin = revenue > 0 ? Number((profit / revenue).toFixed(4)) : 0;
  const timeToProfitMs =
    event.finishedAt && event.finishedAt > event.startedAt
      ? event.finishedAt - event.startedAt
      : 0;
  const timeToFirstSaleMs = timeToProfitMs;
  return {
    idea: event.idea,
    revenue,
    cost,
    profit,
    roi,
    profitMargin,
    timeToProfitMs,
    timeToFirstSaleMs,
    trackedAt: Date.now(),
  };
}
