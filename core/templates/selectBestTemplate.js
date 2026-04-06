"use strict";

const { TEMPLATES, loadPerformanceWeights } = require("./registry");
const { parseTimeToCashDays } = require("../../aethra_node/portfolioExecution/opportunityEngine");

function riskPenalty(profile) {
  const p = String(profile || "").toLowerCase();
  if (p === "high") return 0.12;
  if (p === "medium") return 0.05;
  return 0;
}

/**
 * @param {Record<string, unknown>} opportunity
 */
function selectBestTemplate(opportunity) {
  const idea = String(opportunity?.idea || opportunity?.text || "").toLowerCase();
  const days = parseTimeToCashDays(opportunity?.time_to_cash);
  const demand = Number(opportunity?.demand) || 0.5;
  const weights = loadPerformanceWeights();

  let best = TEMPLATES[0];
  let bestScore = -Infinity;

  for (const t of TEMPLATES) {
    const perf = weights[t.id];
    const perfBoost = perf && perf.n > 0 ? (perf.score / perf.n) * 0.15 : 0;
    const speedFit = 1 / Math.max(1, Math.abs(t.time_to_revenue_days - days) + 1);
    const demandFit = 0.5 + demand * 0.5;
    const scale = (Number(t.scalability_score) || 50) / 100;
    const costDrag = Math.min(0.25, (t.cost_structure?.fixed_gbp || 100) / 2000);
    const score =
      scale * 1.1 +
      speedFit * 1.4 +
      demandFit * 0.6 -
      riskPenalty(t.risk_profile) -
      costDrag +
      perfBoost;

    const keywordBoost =
      (idea.includes("b2b") || idea.includes("saas")) && t.id === "b2b_pilot_strict"
        ? 0.25
        : idea.includes("local") && t.id === "local_service_fast"
          ? 0.2
          : idea.includes("digital") || idea.includes("tool")
            ? t.id === "digital_product_ladder"
              ? 0.2
              : 0
            : idea.includes("market") || idea.includes("arbitrage")
              ? t.id === "marketplace_arb"
                ? 0.2
                : 0
              : 0;

    const s = score + keywordBoost;
    if (s > bestScore) {
      bestScore = s;
      best = t;
    }
  }

  return {
    ...best,
    _selection: {
      score: Math.round(bestScore * 1000) / 1000,
      selected_at: Date.now(),
    },
  };
}

module.exports = { selectBestTemplate };
