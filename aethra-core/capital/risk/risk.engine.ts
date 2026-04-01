import type { VentureRecord } from "../portfolio/portfolio.registry";

export type RiskLevel = "low" | "medium" | "high";

export function assessRisk(venture: VentureRecord): RiskLevel {
  if (Number(venture.losses || 0) > Number(venture.revenue || 0)) return "high";
  if (Number(venture.volatility || 0) > 0.5) return "medium";
  return "low";
}
