"use strict";

function hasText(v) {
  return v != null && String(v).trim() !== "";
}

/**
 * Surfaces required for profit-first operator discipline (no fabricated fills).
 */
function assessProfitSurface(envelope) {
  if (!envelope || typeof envelope !== "object") {
    return {
      satisfied: false,
      missing: ["pricing", "acquisition", "execution"],
      system_priority: ["revenue", "speed", "simplicity", "scale"],
    };
  }

  const missing = [];
  const ex = envelope.execution || {};
  const m = envelope.marketing || {};
  const mon = envelope.monetisation || {};

  const price =
    hasText(ex.price) ||
    hasText(ex.first_money) ||
    hasText(mon.price) ||
    (Array.isArray(mon.pricing_tiers) && mon.pricing_tiers.length > 0);
  if (!price) missing.push("pricing");

  const acq =
    hasText(ex.acquisition_channel) ||
    hasText(ex.channel) ||
    (Array.isArray(m.channels) && m.channels.length > 0);
  if (!acq) missing.push("acquisition");

  const execution =
    hasText(ex.offer) || hasText(ex.product_focus) || hasText(ex.demand_test);
  if (!execution) missing.push("execution");

  return {
    satisfied: missing.length === 0,
    missing,
    system_priority: ["revenue", "speed", "simplicity", "scale"],
  };
}

function applyProfitEnforcement(envelope) {
  const a = assessProfitSurface(envelope);
  envelope.meta = { ...(envelope.meta || {}) };
  envelope.meta.profit_enforcement = {
    satisfied: a.satisfied,
    missing_surfaces: a.missing,
    system_priority: a.system_priority,
    mantra: "Revenue first, then speed, simplicity, scale.",
  };

  if (!a.satisfied) {
    const msg = `[Profit enforcement] Missing: ${a.missing.join(", ")} — add explicit GBP pricing, one acquisition channel, and an executable offer before increasing spend.`;
    envelope.autonomous = { ...(envelope.autonomous || {}) };
    const na = Array.isArray(envelope.autonomous.next_actions)
      ? envelope.autonomous.next_actions
      : [];
    if (!na.some((x) => String(x).includes("Profit enforcement"))) {
      envelope.autonomous.next_actions = [msg, ...na];
    }
  }

  return a;
}

module.exports = { assessProfitSurface, applyProfitEnforcement };
