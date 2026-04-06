"use strict";

/**
 * Template intelligence: execution shape + economics + risk + scale.
 * Performance weights updated via recordTemplateOutcome (additive).
 */
const TEMPLATES = [
  {
    id: "local_service_fast",
    name: "Local service — fast cash",
    executionSteps: ["validate_demand", "single_offer_landing", "booking_cta", "pilot_cap"],
    cost_structure: { fixed_gbp: 120, variable_pct: 0.08 },
    time_to_revenue_days: 14,
    risk_profile: "medium",
    scalability_score: 62,
    monetisation_hooks: ["service_booking", "clinic_audit"],
  },
  {
    id: "digital_product_ladder",
    name: "Digital product — ladder",
    executionSteps: ["icp_slice", "lead_magnet", "core_offer", "upsell_continuity"],
    cost_structure: { fixed_gbp: 200, variable_pct: 0.12 },
    time_to_revenue_days: 28,
    risk_profile: "medium",
    scalability_score: 78,
    monetisation_hooks: ["digital_product", "subscription"],
  },
  {
    id: "b2b_pilot_strict",
    name: "B2B — strict pilot",
    executionSteps: ["account_list", "outreach_cadence", "pilot_scope", "invoice"],
    cost_structure: { fixed_gbp: 260, variable_pct: 0.06 },
    time_to_revenue_days: 21,
    risk_profile: "low",
    scalability_score: 55,
    monetisation_hooks: ["venture_pilot", "deal_payment"],
  },
  {
    id: "marketplace_arb",
    name: "Marketplace arbitrage",
    executionSteps: ["supply_map", "margin_gate", "listing_sync", "kill_rules"],
    cost_structure: { fixed_gbp: 90, variable_pct: 0.18 },
    time_to_revenue_days: 10,
    risk_profile: "high",
    scalability_score: 70,
    monetisation_hooks: ["service_booking"],
  },
];

let _performanceWeights = null;

function loadWeightsPath() {
  return require("path").join(__dirname, "template_performance.json");
}

function loadPerformanceWeights() {
  if (_performanceWeights) return _performanceWeights;
  try {
    const fs = require("fs");
    const p = loadWeightsPath();
    const j = JSON.parse(fs.readFileSync(p, "utf8"));
    _performanceWeights = j && typeof j === "object" ? j : {};
  } catch {
    _performanceWeights = {};
  }
  return _performanceWeights;
}

function savePerformanceWeights(w) {
  try {
    const fs = require("fs");
    fs.writeFileSync(loadWeightsPath(), JSON.stringify(w, null, 2), "utf8");
  } catch {
    /* optional file */
  }
}

/**
 * @param {string} templateId
 * @param {{ revenue_proxy?: number, killed?: boolean, scaled?: boolean }} outcome
 */
function recordTemplateOutcome(templateId, outcome) {
  const id = String(templateId || "").slice(0, 80);
  if (!id) return;
  const w = { ...loadPerformanceWeights() };
  const row = w[id] || { score: 0, n: 0 };
  let delta = Number(outcome.revenue_proxy) || 0;
  if (outcome.scaled) delta += 2;
  if (outcome.killed) delta -= 3;
  row.n = (Number(row.n) || 0) + 1;
  row.score = (Number(row.score) || 0) + delta;
  w[id] = row;
  _performanceWeights = w;
  savePerformanceWeights(w);
}

function listTemplates() {
  return TEMPLATES.map((t) => ({ ...t }));
}

module.exports = {
  TEMPLATES,
  listTemplates,
  loadPerformanceWeights,
  recordTemplateOutcome,
};
