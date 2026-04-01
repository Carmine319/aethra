"use strict";

const wallet = require("../venture/wallet");
const crm = require("../crm/crm");
const { computeMetrics } = require("../conversion/conversionDashboard");
const { scalingDecision } = require("./scalingDecision");
const { allocateCapital } = require("./capitalAllocator");
const { scoreVenture } = require("./ventureScoring");
const { executeScaling } = require("./actionEngine");

function buildVentureSignals(row, funnel) {
  const revenue = Number(row.revenue) || 0;
  const cost = Math.max(Number(row.budget) || 0, 1);
  const rounds = Number(row.outreach_rounds) || 0;
  return {
    name: String(row.name || "Unnamed"),
    venture_id: row.venture_id,
    reply_rate: funnel.reply_rate,
    close_rate: funnel.close_rate,
    revenue,
    cost,
    velocity: Math.min(100, rounds * 18),
  };
}

function getLivePortfolioContext() {
  const { ventures, balance, reinvest_pool } = wallet.getWalletSummary();
  const metrics = computeMetrics(crm.getPipeline());
  const funnel = {
    reply_rate: metrics.reply_rate,
    close_rate: metrics.close_rate,
  };
  const active = (Array.isArray(ventures) ? ventures : []).filter((v) => !v.archived);
  const portfolio = active.map((v) => buildVentureSignals(v, funnel));
  const budget =
    Math.max(0, Number(balance) || 0) + Math.max(0, Number(reinvest_pool) || 0);

  return { portfolio, budget, funnel_metrics: metrics };
}

function runScalingBrain(portfolio, budget) {
  const list = Array.isArray(portfolio) ? portfolio : [];

  const decisions = list.map((v) => {
    const decision = scalingDecision(v);
    return {
      name: v.name,
      decision,
      score_snapshot: scoreVenture(v),
    };
  });

  const eligible = list.filter((_v, i) => decisions[i].decision.action !== "kill");
  const allocations = allocateCapital(eligible, budget);

  return {
    decisions,
    allocations,
  };
}

function runLiveScalingBrain() {
  const { portfolio, budget, funnel_metrics } = getLivePortfolioContext();
  const brain = runScalingBrain(portfolio, budget);
  const actions = executeScaling(brain.decisions);

  const ranked = portfolio
    .map((v) => ({ ...v, ...scoreVenture(v) }))
    .sort((a, b) => b.score - a.score);
  const top = ranked[0] || null;

  let topAllocationGbp = null;
  if (top && brain.allocations.length) {
    const hit = brain.allocations.find((a) => a.venture === top.name);
    topAllocationGbp = hit ? hit.allocated : null;
  }

  return {
    ...brain,
    actions,
    budget,
    funnel_metrics,
    top_venture: top ? top.name : null,
    top_score: top ? Math.round(top.score * 100) / 100 : null,
    top_roi: top ? Math.round(top.roi * 100) / 100 : null,
    top_decision: top ? scalingDecision(top) : null,
    top_allocation_gbp: topAllocationGbp,
  };
}

module.exports = {
  runScalingBrain,
  runLiveScalingBrain,
  getLivePortfolioContext,
  buildVentureSignals,
};
