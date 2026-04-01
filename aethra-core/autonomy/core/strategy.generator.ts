import { makeDecision, type DecisionOption } from "./decision.engine";
import { getBestPerformers } from "../../revenue/memory/revenue.memory";
import { getVentures } from "../../capital/portfolio/portfolio.registry";

type Context = {
  market?: string;
  options?: DecisionOption[];
};

export async function generateStrategy(context: Context) {
  const performers = getBestPerformers(5);
  const ventures = getVentures().slice(-5);
  const market = String(context.market || "general");
  const options = Array.isArray(context.options) ? context.options : buildDefaultOptions(market, performers, ventures);
  const selected = makeDecision(options);
  return {
    id: `strategy_${Date.now()}`,
    market,
    expectedValue: selected.expectedValue,
    risk: selected.riskScore,
    capitalImpact: selected.capitalImpact,
    reversible: selected.reversible !== false,
    source_option_id: selected.id,
    genome_seed: {
      performer_count: performers.length,
      venture_count: ventures.length,
    },
  };
}

function buildDefaultOptions(market: string, performers: any[], ventures: any[]): DecisionOption[] {
  const perfBias = performers.length > 0 ? 1.2 : 0.9;
  const ventureBias = ventures.length > 0 ? 1.1 : 0.85;
  return [
    {
      id: `${market}_expand_existing`,
      expectedValue: 60 * perfBias,
      riskScore: 0.4,
      capitalImpact: 20 * ventureBias,
      reversible: true,
    },
    {
      id: `${market}_test_new_offer`,
      expectedValue: 52 * perfBias,
      riskScore: 0.55,
      capitalImpact: 14,
      reversible: true,
    },
    {
      id: `${market}_high_risk_push`,
      expectedValue: 70,
      riskScore: 0.8,
      capitalImpact: 30,
      reversible: false,
    },
  ];
}
