"use strict";

const { appendHistorical, loadMemory } = require("../memory/store");
const { recordTemplateOutcome } = require("../templates/registry");

/**
 * @param {Record<string, unknown>} outcome
 */
function learnFromOutcome(outcome) {
  const tid = outcome?.template_id;
  if (tid) {
    recordTemplateOutcome(String(tid), {
      revenue_proxy: Number(outcome.revenue_proxy) || 0,
      killed: !!outcome.killed,
      scaled: !!outcome.scaled,
    });
  }
  return { ok: true };
}

/**
 * Returns strategy hints for the next cycle (non-destructive overlay).
 * @param {Record<string, unknown>} [portfolioState]
 */
function adjustStrategy(portfolioState) {
  const mem = loadMemory();
  const recent = mem.historicalLog.slice(-30);
  const failures = recent.filter((r) => r.kind === "failure" || r.outcome === "kill").length;
  const bias = failures >= 8 ? "tighten_icp" : failures <= 2 ? "expand_tests" : "maintain";
  const deployPace =
    (portfolioState?.usage?.portfolio_cycles || 0) > 20 && mem.successRate < 0.35
      ? "slow"
      : "normal";
  return {
    bias,
    deploy_pace: deployPace,
    success_rate_observed: mem.successRate,
    note: "Hints only — merged with existing portfolio scoring.",
  };
}

function promoteWinningPatterns() {
  const mem = loadMemory();
  const wins = mem.historicalLog.filter(
    (r) => r.kind === "deployment" && (r.outcome === "strong" || r.outcome === "scale")
  );
  const templates = {};
  for (const w of wins.slice(-50)) {
    const id = w.template_id;
    if (!id) continue;
    templates[id] = (templates[id] || 0) + 1;
  }
  appendHistorical({ kind: "evolution_promote", templates, count: wins.length });
  return { promoted: templates };
}

function deprecateFailingPatterns() {
  const mem = loadMemory();
  const fails = mem.historicalLog.filter((r) => r.outcome === "kill" || r.kind === "failure");
  const templates = {};
  for (const f of fails.slice(-50)) {
    const id = f.template_id;
    if (!id) continue;
    templates[id] = (templates[id] || 0) + 1;
  }
  appendHistorical({ kind: "evolution_deprecate", templates, count: fails.length });
  return { deprecated: templates };
}

module.exports = {
  learnFromOutcome,
  adjustStrategy,
  promoteWinningPatterns,
  deprecateFailingPatterns,
};
