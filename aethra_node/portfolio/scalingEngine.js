"use strict";

const wallet = require("../venture/wallet");

const SCALE_CONVERSION = 0.28;
const KILL_ROUNDS = 4;
const KILL_PROGRESSION = 0.12;

/**
 * Kill / scale recommendation from ledger + CRM signals — does not move capital unless caller applies archive.
 */
function evaluateVenture(ventureRow, context = {}) {
  const v = ventureRow && typeof ventureRow === "object" ? ventureRow : {};
  if (v.archived) {
    return {
      venture: v.name || null,
      decision: { scale: false, kill: false, reason: "already_archived" },
      capital_reallocation: { note: "No change — venture archived." },
    };
  }

  const name = String(v.name || "");
  const revenue = Number(v.revenue) || 0;
  const budget = Number(v.budget) || 0;
  const roi = Number(v.roi) || 0;
  const rounds = Number(v.outreach_rounds) || 0;

  const crm = context.crmMetrics || {};
  const progression =
    typeof crm.reply_progression_rate === "number" ? crm.reply_progression_rate : 0;
  const conversion_proxy = progression;

  if (
    rounds >= KILL_ROUNDS &&
    revenue === 0 &&
    progression < KILL_PROGRESSION &&
    budget > 0
  ) {
    return {
      venture: name,
      decision: {
        scale: false,
        kill: true,
        reason:
          "No recorded revenue after several operator cycles and cold reply progression — archive to stop allocation bleed.",
      },
      capital_reallocation: {
        note: "Tag capital as released from active pursuit; reinvest only after a new hypothesis is validated.",
        suggested_pool: "reinvest_pool",
      },
    };
  }

  if (revenue > 0 && roi >= 0.45) {
    return {
      venture: name,
      decision: {
        scale: true,
        kill: false,
        reason: "Recorded revenue with healthy ROI vs allocated budget — eligible for incremental reinvest test.",
      },
      capital_reallocation: {
        note: "Consider small incremental allocation from reinvest_pool after human review of unit economics.",
        cap_gbp_suggestion: Math.min(15, Math.max(5, Math.round(revenue * 0.15))),
      },
    };
  }

  if (conversion_proxy > SCALE_CONVERSION && revenue === 0 && rounds >= 2) {
    return {
      venture: name,
      decision: {
        scale: true,
        kill: false,
        reason: "Strong reply progression vs simulated CRM — scale outreach depth before killing.",
      },
      capital_reallocation: {
        note: "Reallocate time (not automatic GBP) toward follow-up sequences; keep budget flat until revenue event.",
      },
    };
  }

  return {
    venture: name,
    decision: {
      scale: false,
      kill: false,
      reason: "Inside guardrails — continue discipline; no scale or kill flag this cycle.",
    },
    capital_reallocation: { note: "No automatic wallet mutation." },
  };
}

function evaluateAllActiveVentures(crmMetrics) {
  const ventures = wallet.getActiveVentures().filter((x) => !x.archived);
  return ventures.map((row) => evaluateVenture(row, { crmMetrics }));
}

function applyKillDecisions(evaluations) {
  const applied = [];
  for (const ev of evaluations || []) {
    if (ev?.decision?.kill && ev.venture) {
      wallet.archiveVenture(ev.venture, "fail");
      applied.push(ev.venture);
    }
  }
  return applied;
}

module.exports = {
  evaluateVenture,
  evaluateAllActiveVentures,
  applyKillDecisions,
  SCALE_CONVERSION,
  KILL_ROUNDS,
  KILL_PROGRESSION,
};
