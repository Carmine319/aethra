import type { VentureRecord } from "./portfolio.registry";

export function scoreVenture(venture: VentureRecord) {
  const roi = Number(venture.revenue || 0) / Math.max(1, Number(venture.cost || 1));
  const growth = Number(venture.growth || 0);
  const stability = Number(venture.stability || 0);
  const upside = Number(venture.probability_weighted_upside || 0);
  return roi * 0.45 + growth * 0.25 + stability * 0.2 + upside * 0.1;
}
