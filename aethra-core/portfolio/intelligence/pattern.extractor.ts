import { OpportunityState } from "../registry/opportunity.state";

export function extractProfitPatterns(portfolio: OpportunityState[]) {
  const rows = Array.isArray(portfolio) ? portfolio : [];
  const winners = rows.filter((x) => Number(x.roi || 0) >= 2);
  const avgSignal = winners.length
    ? winners.reduce((a, w) => a + Number(w.signalStrength || 0), 0) / winners.length
    : 0;
  return {
    winnerCount: winners.length,
    dominantSignalBand: Number(avgSignal.toFixed(4)),
  };
}
