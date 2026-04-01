import { allocatePortfolioCapital } from "../capital/allocation.matrix";
import { compoundCapital } from "../capital/compounding.engine";
import { rebalancePortfolio } from "../decisions/rebalance.engine";
import { shouldKill } from "../decisions/kill.engine";
import { shouldScale } from "../decisions/scale.engine";
import { learnAcrossPortfolio } from "../intelligence/cross.opportunity.learning";
import { OpportunityState } from "../registry/opportunity.state";
import { getActivePortfolio, registerOpportunity, updateOpportunity } from "../registry/portfolio.registry";
import { calculatePerformance } from "../scoring/performance.engine";
import { computeROI } from "../scoring/roi.engine";

export async function runPortfolioLoop(input?: {
  selectedIdea?: Record<string, unknown>;
  revenue?: number;
  capital?: number;
  signalStrength?: number;
  conversionRate?: number;
}) {
  const idea = input?.selectedIdea || {};
  const id = String(idea.name || idea.idea || `opp_${Date.now()}`);
  const capital = Number(input?.capital || 0);
  const revenue = Number(input?.revenue || 0);
  const initial: OpportunityState = {
    id,
    name: String(idea.name || idea.idea || "Opportunity"),
    status: "active",
    capitalAllocated: capital,
    revenue,
    roi: computeROI(revenue, capital),
    age: 1,
    performanceScore: 0,
    signalStrength: Number(input?.signalStrength || idea.signalStrength || 0.5),
    conversionRate: Number(input?.conversionRate || 0.02),
    timeToRevenue: Number(idea.timeToRevenue || 7),
  };
  registerOpportunity(initial);

  const active = getActivePortfolio();
  const scored = active.map((x) => {
    const perf = calculatePerformance(x);
    return { ...x, ...perf };
  });

  const decided = scored.map((x) => {
    if (shouldKill(x)) return { ...x, status: "killed" as const };
    if (shouldScale(x)) return { ...x, status: "scaled" as const, capitalAllocated: Number((x.capitalAllocated * 1.25).toFixed(2)) };
    return { ...x, status: "active" as const };
  });

  const rebalanced = rebalancePortfolio(decided);
  const compound = compoundCapital(rebalanced);
  const matrix = allocatePortfolioCapital(compound.reinvestedCapital);
  const learning = learnAcrossPortfolio(rebalanced);

  for (const row of rebalanced) {
    updateOpportunity(row.id, row);
  }

  return {
    activePortfolio: rebalanced,
    compound,
    matrix,
    learning,
  };
}
