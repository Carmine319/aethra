"use strict";

const wallet = require("./wallet");

const SIM_CLOSE_GBP = 18;
const REINVEST_RATIO = 0.25;

/**
 * Simulated closes from positive reply classifications + optional reinvest tagging.
 */
function applySimulatedCloses(ventureName, replyLog, launched) {
  if (!launched || !ventureName || !Array.isArray(replyLog)) {
    return { closes: 0, revenue_gbp: 0, reinvest_gbp: 0 };
  }
  let closes = 0;
  let revenue = 0;
  for (const r of replyLog) {
    if (r && r.category === "interested") {
      closes++;
      revenue += SIM_CLOSE_GBP;
    }
  }
  if (revenue > 0) {
    wallet.addRevenue(revenue);
    wallet.updateVentureRevenue(ventureName, revenue);
    const reinvest = Math.round(revenue * REINVEST_RATIO * 100) / 100;
    wallet.recordReinvest(ventureName, reinvest);
  }
  return {
    closes,
    revenue_gbp: revenue,
    reinvest_gbp: revenue > 0 ? Math.round(revenue * REINVEST_RATIO * 100) / 100 : 0,
    note: "Simulated settlement for operator training — not bank money.",
  };
}

function describeCycle(venture, closeResult) {
  if (!venture || !venture.launched) {
    return "Venture cycle idle — gates did not allocate wallet this pass.";
  }
  if (!closeResult.closes) {
    return `Venture «${venture.name}» active; no simulated closes this cycle — continue outreach discipline.`;
  }
  return `Venture «${venture.name}»: ${closeResult.closes} simulated close(s), £${closeResult.revenue_gbp} credited to wallet, £${closeResult.reinvest_gbp} tagged for reinvest pool.`;
}

module.exports = { applySimulatedCloses, describeCycle, SIM_CLOSE_GBP, REINVEST_RATIO };
