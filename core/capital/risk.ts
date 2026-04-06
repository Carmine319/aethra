import type { CapitalAssessment } from "../types";

function parseTimeToCashDays(v: unknown): number {
  const s = String(v || "").toLowerCase();
  const m = s.match(/(\d+)\s*-\s*(\d+)/);
  if (m) return (Number(m[1]) + Number(m[2])) / 2;
  const single = s.match(/(\d+)/);
  if (single) return Number(single[1]);
  return 30;
}

function riskFromProfile(profile: string): number {
  const p = profile.toLowerCase();
  if (p === "high") return 0.78;
  if (p === "medium") return 0.48;
  return 0.28;
}

export function assessCapitalRisk(
  selected: { payload?: Record<string, unknown> } | null,
  template: {
    cost_structure?: { fixed_gbp?: number; variable_pct?: number };
    time_to_revenue_days?: number;
    risk_profile?: string;
  },
  portfolio: Record<string, unknown>
): CapitalAssessment {
  const payload = selected?.payload || {};
  const liquidity = Number(portfolio.capital_available_gbp) || 0;
  const fixed = Number(template.cost_structure?.fixed_gbp) || 150;
  const variablePct = Number(template.cost_structure?.variable_pct) || 0.1;
  const estimatedCostGbp = Math.round((fixed + liquidity * variablePct * 0.05) * 100) / 100;

  const timeToCashDays = Math.max(
    7,
    Number(template.time_to_revenue_days) || parseTimeToCashDays(payload.time_to_cash)
  );

  const downsideRisk01 = Math.min(
    0.95,
    riskFromProfile(String(template.risk_profile || "medium")) +
      Math.min(0.25, timeToCashDays / 300)
  );

  const liquidityAfterGbp = Math.round((liquidity - estimatedCostGbp) * 100) / 100;

  const maxDeployFrac = Number(process.env.AETHRA_MAX_CAPITAL_DEPLOY_FRAC) || 0.12;
  const maxDays = Number(process.env.AETHRA_MAX_TIME_TO_CASH_DAYS) || 120;
  const maxRisk = Number(process.env.AETHRA_MAX_DOWNSIDE_RISK) || 0.82;

  if (estimatedCostGbp > liquidity * maxDeployFrac && liquidity > 0) {
    return {
      approved: false,
      reason: "capital_rejected_cost_vs_liquidity",
      estimatedCostGbp,
      timeToCashDays,
      downsideRisk01,
      liquidityAfterGbp,
    };
  }
  if (timeToCashDays > maxDays && downsideRisk01 > 0.45) {
    return {
      approved: false,
      reason: "capital_rejected_time_to_cash",
      estimatedCostGbp,
      timeToCashDays,
      downsideRisk01,
      liquidityAfterGbp,
    };
  }
  if (downsideRisk01 > maxRisk) {
    return {
      approved: false,
      reason: "capital_rejected_downside_risk",
      estimatedCostGbp,
      timeToCashDays,
      downsideRisk01,
      liquidityAfterGbp,
    };
  }

  return {
    approved: true,
    estimatedCostGbp,
    timeToCashDays,
    downsideRisk01,
    liquidityAfterGbp,
  };
}
