import { OpportunityState } from "../registry/opportunity.state";

export function compoundCapital(portfolio: OpportunityState[]) {
  const rows = Array.isArray(portfolio) ? portfolio : [];
  const totalRevenue = rows.reduce((a, r) => a + Number(r.revenue || 0), 0);
  const totalCapital = rows.reduce((a, r) => a + Number(r.capitalAllocated || 0), 0);
  const profit = Math.max(0, totalRevenue - totalCapital);
  const reinvestedCapital = Number((totalCapital + profit * 0.8).toFixed(2));
  const portfolioGrowthRate = totalCapital > 0 ? Number((profit / totalCapital).toFixed(4)) : 0;
  return { reinvestedCapital, portfolioGrowthRate };
}
