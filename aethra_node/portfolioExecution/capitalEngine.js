"use strict";

/**
 * Capital allocation from feedback — scale / iterate / kill; reassign budget; log history.
 * Portfolio pool only (does not mutate venture wallet — keeps existing wallet flows intact).
 * @param {Record<string, unknown>} result — expects measurePerformance output + business ref
 * @param {Record<string, unknown>} ctx — { state, business }
 */
function allocateCapital(result, ctx) {
  const perf = result && typeof result === "object" ? result : {};
  const context = ctx && typeof ctx === "object" ? ctx : {};
  const s = context.state;
  const business = context.business || {};

  const strength = String(perf.signal_strength || "").toLowerCase();
  let action = "iterate";
  let budget_delta_gbp = 0;
  let note = "";

  if (strength === "strong") {
    action = "scale";
    budget_delta_gbp = 250;
    note = "Duplicate creative + narrow channel; increase pilot cap 20%.";
  } else if (strength === "weak") {
    action = "kill";
    budget_delta_gbp = -150;
    note = "Pause spend; archive landing; feed negatives to opportunity engine.";
  } else {
    action = "iterate";
    budget_delta_gbp = 50;
    note = "A/B headline + tighten ICP; keep single channel.";
  }

  if (s && typeof s.capital_available_gbp === "number") {
    s.capital_available_gbp = Math.round((s.capital_available_gbp + budget_delta_gbp) * 100) / 100;
    if (s.capital_available_gbp < 0) s.capital_available_gbp = 0;
  }

  return {
    action,
    budget_delta_gbp,
    note,
    capital_after_gbp: s ? s.capital_available_gbp : null,
    duplicate_model: action === "scale" ? { template_business_id: business.id, clones: 1 } : null,
    logged: {
      business_id: business.id,
      revenue: perf.revenue,
      conversion_rate: perf.conversion_rate,
      signal_strength: strength,
      ts: Date.now(),
    },
  };
}

module.exports = { allocateCapital };
