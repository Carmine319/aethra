"use strict";

const wallet = require("./wallet");

const MAX_PER_VENTURE = 30;

function viabilityScore(decision) {
  const s = decision?.scores;
  if (s && s.viability_0_100 != null) return Number(s.viability_0_100);
  return 0;
}

function confidenceScore(decision) {
  if (decision?.confidence_0_100 != null) return Number(decision.confidence_0_100);
  return 0;
}

function shouldLaunch(decision) {
  const v = String(decision?.verdict || "").toLowerCase();
  const build = decision?.build_recommended === true;
  const vi = viabilityScore(decision);
  const conf = confidenceScore(decision);
  return v === "advance" && build && vi > 70 && conf > 65;
}

function pickVentureName(brand, execution) {
  const b = String(brand?.name || brand?.brand_name || "").trim();
  if (b) return b.slice(0, 48);
  const pf = String(execution?.product_focus || "Venture").trim();
  return pf.slice(0, 48) || "Venture";
}

/** Wallet allocation only — CRM and leads are owned by operatorLoop. */
function evaluateAndLaunch(opportunity) {
  const decision = opportunity.decision || {};
  const execution = opportunity.execution || {};
  const brand = opportunity.brand || {};
  const name = pickVentureName(brand, execution);

  if (!shouldLaunch(decision)) {
    return {
      launched: false,
      reason: "gates_not_met",
      name,
      budget: 0,
    };
  }

  const existing = wallet.findVentureByName(name);
  if (existing) {
    return {
      launched: true,
      name,
      budget: existing.budget,
      reason: "venture_already_active",
      stage: "operator_continue",
      revenue: existing.revenue || 0,
    };
  }

  const bal = wallet.getBalance();
  const alloc = Math.min(MAX_PER_VENTURE, bal);
  if (alloc < 5) {
    return { launched: false, reason: "insufficient_wallet", name, budget: 0 };
  }

  const res = wallet.allocate(alloc);
  if (!res.ok) {
    return { launched: false, reason: "allocate_failed", name, budget: 0 };
  }

  wallet.recordVentureAllocation(name, alloc);

  return {
    launched: true,
    name,
    budget: alloc,
    stage: "operator_started",
    revenue: 0,
  };
}

module.exports = { evaluateAndLaunch, shouldLaunch, viabilityScore, confidenceScore };
