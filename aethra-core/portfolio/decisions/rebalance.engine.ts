import { OpportunityState } from "../registry/opportunity.state";

export function rebalancePortfolio(portfolio: OpportunityState[]) {
  const rows = Array.isArray(portfolio) ? [...portfolio] : [];
  const sorted = rows.sort((a, b) => Number(b.performanceScore || 0) - Number(a.performanceScore || 0));
  const totalCapital = sorted.reduce((a, r) => a + Number(r.capitalAllocated || 0), 0);
  if (!totalCapital) return sorted;
  return sorted.map((r, idx) => {
    const weight = idx === 0 ? 0.45 : idx === 1 ? 0.3 : 0.25 / Math.max(1, sorted.length - 2);
    return { ...r, capitalAllocated: Number((totalCapital * weight).toFixed(2)) };
  });
}
