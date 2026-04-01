import { getBestPerformers } from "../../revenue/memory/revenue.memory";
import { scoreSignal } from "../../revenue/signals/signal.scorer";
import {
  registerVenture,
  getVentures,
  recordProfit,
  updateTreasury,
  allocateCapital,
  getTreasury,
} from "../plugin.v7";

type RevenuePerformer = {
  loop_name?: string;
  revenue?: number;
  conversions?: number;
  clicks?: number;
  engagement?: number;
};

function toVenture(p: RevenuePerformer, idx: number) {
  const revenue = Number(p.revenue || 0);
  const conversions = Number(p.conversions || 0);
  const clicks = Number(p.clicks || 0);
  const engagement = Number(p.engagement || 0);
  const signal = scoreSignal({ clicks, likes: engagement, comments: conversions });

  return {
    id: String(p.loop_name || `venture_${idx + 1}`),
    revenue,
    cost: Math.max(1, Math.round(revenue * 0.4)),
    growth: Math.min(2, signal / 100),
    stability: conversions > 0 ? 0.7 : 0.4,
    losses: Math.max(0, Math.round((signal < 10 ? revenue * 0.2 : 0))),
    volatility: signal < 10 ? 0.65 : 0.25,
    probability_weighted_upside: Math.min(1, signal / 80),
    active: true,
  };
}

/**
 * Demonstrates one Ω v6 → Ω v7 cycle:
 * - read v6 performers
 * - register ventures
 * - book profit + treasury inflow
 * - allocate capital with policy/risk controls
 */
export function runV6ToV7Cycle() {
  const performers = getBestPerformers(10) as RevenuePerformer[];
  const candidates = performers.length
    ? performers.map(toVenture)
    : [
        {
          id: "fallback_demo_venture",
          revenue: 120,
          cost: 50,
          growth: 0.8,
          stability: 0.7,
          losses: 0,
          volatility: 0.2,
          probability_weighted_upside: 0.72,
          active: true,
        },
      ];

  for (const c of candidates) registerVenture(c);

  const totalCycleProfit = candidates.reduce((s, c) => s + Number(c.revenue || 0), 0);
  recordProfit("v6_revenue_cycle", totalCycleProfit, { candidates: candidates.length });
  updateTreasury(totalCycleProfit, "v6_revenue_cycle");

  const allocation = allocateCapital();

  return {
    ok: true,
    summary: {
      candidates_registered: candidates.length,
      total_cycle_profit: totalCycleProfit,
      ventures_in_registry: getVentures().length,
      treasury: getTreasury(),
    },
    allocation,
  };
}
