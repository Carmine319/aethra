"use strict";

const fs = require("fs");
const path = require("path");
const { loadMemory, appendHistorical, addVerifiedRevenueDelta } = require("../memory/store");

const STRIPE_SOURCE_RE = /^stripe/i;

function isVerifiedPaymentSource(source) {
  return STRIPE_SOURCE_RE.test(String(source || ""));
}

function readLearningPaymentsTodayVerified() {
  try {
    const { LEARNING_FILE } = require(path.join(
      __dirname,
      "..",
      "..",
      "aethra_node",
      "memory",
      "learningEngine.js"
    ));
    const s = JSON.parse(fs.readFileSync(LEARNING_FILE, "utf8"));
    const payments = Array.isArray(s.payments) ? s.payments : [];
    const day = new Date().toISOString().slice(0, 10);
    let verified = 0;
    let flagged = 0;
    for (const p of payments) {
      const ts = p.ts || p.at || 0;
      const d = typeof ts === "number" ? new Date(ts).toISOString().slice(0, 10) : "";
      if (d !== day) continue;
      const amt = Number(p.amount_gbp) || 0;
      if (!amt) continue;
      if (isVerifiedPaymentSource(p.source)) verified += amt;
      else flagged += amt;
    }
    return {
      verified_today_gbp: Math.round(verified * 100) / 100,
      flagged_today_gbp: Math.round(flagged * 100) / 100,
    };
  } catch {
    return { verified_today_gbp: 0, flagged_today_gbp: 0 };
  }
}

/**
 * @param {number} amount
 * @param {string} source
 * @param {Record<string, unknown>} [meta]
 * @param {number} [confidence] 0–1; ≥0.85 books to verified core totals
 */
function recordVerifiedRevenue(amount, source, meta, confidence) {
  const a = Math.round(Number(amount) * 100) / 100;
  if (!Number.isFinite(a) || a <= 0) return { ok: false, reason: "bad_amount" };
  const conf = confidence != null ? Number(confidence) : isVerifiedPaymentSource(source) ? 1 : 0.4;
  const verified = conf >= 0.85 && isVerifiedPaymentSource(source);
  if (verified) {
    addVerifiedRevenueDelta(a);
  }
  appendHistorical({
    kind: verified ? "revenue_verified" : "revenue_flagged",
    amount_gbp: a,
    source: String(source || "unknown").slice(0, 120),
    revenueConfidenceScore: Math.round(conf * 1000) / 1000,
    meta: meta && typeof meta === "object" ? meta : {},
  });
  return { ok: true, verified };
}

/** @deprecated Use recordVerifiedRevenue — kept for older call sites; treats as verified only if Stripe-classified source. */
function recordRevenue(amount, source, meta) {
  return recordVerifiedRevenue(amount, source, meta, isVerifiedPaymentSource(source) ? 1 : 0.3);
}

function calculateDailyRevenue(portfolioState) {
  const { verified_today_gbp, flagged_today_gbp } = readLearningPaymentsTodayVerified();
  const mem = loadMemory();
  const verifiedBook = Number(mem.verifiedRevenueGbp) || 0;
  const revenueConfidenceScore =
    verified_today_gbp + flagged_today_gbp <= 0
      ? 1
      : Math.round((verified_today_gbp / (verified_today_gbp + flagged_today_gbp)) * 1000) / 1000;

  return {
    verified_today_gbp,
    flagged_today_gbp,
    verified_book_cumulative_gbp: verifiedBook,
    /** UI: only Stripe-classified settlement signals */
    display_verified_today_gbp: verified_today_gbp,
    revenueConfidenceScore,
    /** Legacy keys — map to verified only (no synthetic book) */
    stripe_and_ledger_today_gbp: verified_today_gbp,
    portfolio_state_today_gbp:
      portfolioState && typeof portfolioState === "object"
        ? Number(portfolioState.revenue_today_gbp) || 0
        : 0,
    organism_book_cumulative_gbp: verifiedBook,
    display_today_gbp: verified_today_gbp,
  };
}

function calculateWinRate(portfolioState) {
  const mem = loadMemory();
  const hist = portfolioState?.performance_history;
  if (Array.isArray(hist) && hist.length) {
    const strong = hist.filter((h) => String(h.signal || "").toLowerCase() === "strong").length;
    return Math.round((strong / hist.length) * 1000) / 1000;
  }
  return mem.successRate;
}

function projectGrowth(usage) {
  const mem = loadMemory();
  const daily = calculateDailyRevenue(null);
  const base = daily.display_today_gbp || 0.01;
  const cycles = Number(usage?.portfolio_cycles) || 0;
  const recencyHours =
    usage && usage.last_cycle_ts
      ? Math.max(0, (Date.now() - Number(usage.last_cycle_ts)) / 3600000)
      : 24;
  const cadenceFactor = Math.min(1.2, 1 + Math.min(cycles, 50) / 200);
  const decay = Math.max(0.85, 1 - Math.min(recencyHours, 72) * 0.002);
  const projected7d = Math.round(base * 7 * cadenceFactor * decay * 100) / 100;
  const cap = Math.max(projected7d, base * 7 * 0.5);
  return {
    basis_daily_gbp: Math.round(base * 100) / 100,
    projected_7d_gbp_low: Math.round(base * 7 * 0.5 * 100) / 100,
    projected_7d_gbp_mid: Math.min(cap, projected7d),
    note: "Heuristic from verified daily throughput only — not a returns forecast.",
    organism_cumulative_gbp: Number(mem.verifiedRevenueGbp) || 0,
  };
}

module.exports = {
  recordRevenue,
  recordVerifiedRevenue,
  calculateDailyRevenue,
  calculateWinRate,
  projectGrowth,
};
