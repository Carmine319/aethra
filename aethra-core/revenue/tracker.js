"use strict";

function trackRevenue(event) {
  const revenue = Number((event && event.revenue) || 0);
  const cost = Number((event && event.cost) || 0);
  const profit = revenue - cost;
  const roi = cost > 0 ? Number((profit / cost).toFixed(4)) : 0;
  const profitMargin = revenue > 0 ? Number((profit / revenue).toFixed(4)) : 0;
  const startedAt = Number((event && event.startedAt) || 0);
  const finishedAt = Number((event && event.finishedAt) || 0);
  const timeToProfitMs = finishedAt > startedAt ? finishedAt - startedAt : 0;
  const timeToFirstSaleMs = timeToProfitMs;
  return {
    idea: event && event.idea ? event.idea : "",
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

module.exports = { trackRevenue };
