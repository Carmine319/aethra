"use strict";

const wallet = require("../venture/wallet");
const crm = require("../crm/crm");
const { buildVentureSignals } = require("../scalingBrain/scalingLoop");
const { computeMetrics } = require("../conversion/conversionDashboard");
const { runOptimisation } = require("../optimisation/optimisationLoop");
const { recordPortfolioBrainSnapshot } = require("../memory/learningEngine");
const { orchestratePortfolio } = require("./orchestrator");
const { extractGlobalInsights, applyInsights } = require("./learningBridge");
const { rebalancePortfolio } = require("./rebalanceEngine");

function enrichVenturesWithGlobalSignals(ventures, optimisation, funnel) {
  const imp = optimisation && optimisation.improvements ? optimisation.improvements : {};
  const ch = funnel && funnel.best_channel != null ? funnel.best_channel : null;

  return ventures.map((v) => ({
    ...v,
    best_message: v.best_message || imp.message || null,
    best_price: v.best_price != null ? v.best_price : imp.price || null,
    best_channel: v.best_channel || ch || null,
  }));
}

function runPortfolioBrain(ventures, capital) {
  const list = Array.isArray(ventures) ? ventures : [];
  const evaluated = orchestratePortfolio(list);
  const insights = extractGlobalInsights(list);

  const byName = {};
  list.forEach((v) => {
    byName[String(v.name)] = v;
  });

  const enhanced = evaluated.map((ev) => {
    const base = byName[String(ev.name)] || {};
    return applyInsights({ ...base, ...ev }, insights);
  });

  const allocations = rebalancePortfolio(enhanced, capital);

  return {
    portfolio_state: enhanced,
    insights,
    allocations,
  };
}

function runLivePortfolioBrain(options = {}) {
  const recordMemory = options.recordMemory === true;
  const { ventures, balance, reinvest_pool } = wallet.getWalletSummary();
  const metrics = computeMetrics(crm.getPipeline());
  const optimisation = runOptimisation(crm.getPipeline());

  const funnel = {
    reply_rate: metrics.reply_rate,
    close_rate: metrics.close_rate,
    best_channel: metrics.best_channel,
  };

  const active = (Array.isArray(ventures) ? ventures : []).filter((v) => !v.archived);
  const basePortfolio = active.map((v) => buildVentureSignals(v, funnel));
  const venturesForBrain = enrichVenturesWithGlobalSignals(basePortfolio, optimisation, metrics);

  const capital =
    Math.max(0, Number(balance) || 0) + Math.max(0, Number(reinvest_pool) || 0);

  const out = runPortfolioBrain(venturesForBrain, capital);

  const ranked = [...out.portfolio_state].sort((a, b) => b.score - a.score);
  const top = ranked[0] || null;

  let system_action = "Assessing portfolio";
  if (top) {
    if (top.decision === "scale") system_action = "Scaling allocation";
    else if (top.decision === "maintain") system_action = "Balanced hold";
    else system_action = "Risk reduction";
  }

  const payload = {
    ...out,
    capital,
    active_count: active.length,
    top_performer: top ? top.name : null,
    top_decision: top ? top.decision : null,
    system_action,
    funnel_metrics: metrics,
    optimisation_hints: optimisation.improvements || {},
  };

  if (recordMemory) {
    try {
      recordPortfolioBrainSnapshot({
        active_count: payload.active_count,
        capital: payload.capital,
        top_performer: payload.top_performer,
        system_action: payload.system_action,
        decisions: (payload.portfolio_state || []).map((r) => ({
          name: r.name,
          decision: r.decision,
          score: Math.round(r.score * 100) / 100,
        })),
        allocation_total: (payload.allocations || []).reduce((s, a) => s + (Number(a.allocation) || 0), 0),
      });
    } catch {
      /* non-fatal */
    }
  }

  return payload;
}

module.exports = { runPortfolioBrain, runLivePortfolioBrain, enrichVenturesWithGlobalSignals };
